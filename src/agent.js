#!/usr/bin/env node

import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { MemorySaver, InMemoryStore } from "@langchain/langgraph-checkpoint";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { initChatModel } from "langchain/chat_models/universal";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Load environment variables
dotenv.config();

// Agent modes
const MODES = {
  USER: 'my_point_of_view',
  WIFE: 'her_point_of_view', 
  SOLOMON: 'king_solomon_wise'
};

export class MarriageCounselorAgent {
  constructor() {
    this.currentMode = MODES.SOLOMON; // Default to Solomon for API deployment
    this.agents = {};
    this.checkpointer = new MemorySaver();
    this.store = new InMemoryStore();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment');
    }

    try {
      // Initialize the LLM - prefer OpenAI for deployment stability
      const llm = await initChatModel(process.env.OPENAI_API_KEY ? "gpt-4o" : "claude-3-5-sonnet-20241022", {
        modelProvider: process.env.OPENAI_API_KEY ? "openai" : "anthropic", 
        temperature: 0
      });

      // Create tools for each mode
      const userModeTools = this.createUserModeTools();
      const wifeModeTools = this.createWifeModeTools();
      const solomonModeTools = this.createSolomonModeTools();

      // Create agents with both conversation memory and long-term story storage
      this.agents[MODES.USER] = createReactAgent({
        llm,
        tools: userModeTools,
        checkpointSaver: this.checkpointer,
        store: this.store,
        prompt: this.getPromptFunction(MODES.USER)
      });

      this.agents[MODES.WIFE] = createReactAgent({
        llm, 
        tools: wifeModeTools,
        checkpointSaver: this.checkpointer,
        store: this.store,
        prompt: this.getPromptFunction(MODES.WIFE)
      });

      this.agents[MODES.SOLOMON] = createReactAgent({
        llm,
        tools: solomonModeTools, 
        checkpointSaver: this.checkpointer,
        store: this.store,
        prompt: this.getPromptFunction(MODES.SOLOMON)
      });

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize agent: ${error.message}`);
    }
  }

  createUserModeTools() {
    const saveUserStory = tool(
      async (input, config) => {
        const store = config.store;
        if (!store) {
          throw new Error("store is required when compiling the graph");
        }

        const userId = config.configurable?.userId || 'default_user';
        
        try {
          await store.put(["stories"], `${userId}_user`, { content: input.story });
        } catch (storeError) {
          throw storeError;
        }
        return "I understand your perspective. I'll remember this for any future counsel.";
      },
      {
        name: "save_user_story",
        description: "Save important details about your grievances and perspective",
        schema: z.object({
          story: z.string().describe("The grievance or story details to remember")
        })
      }
    );

    return [saveUserStory];
  }

  createWifeModeTools() {
    const saveWifeStory = tool(
      async (input, config) => {
        const store = config.store;
        if (!store) {
          throw new Error("store is required when compiling the graph");
        }

        const userId = config.configurable?.userId || 'default_user';
        
        try {
          await store.put(["stories"], `${userId}_wife`, { content: input.story });
        } catch (storeError) {
          throw storeError;
        }
        return "I understand her perspective on this situation.";
      },
      {
        name: "save_wife_story",
        description: "Save important details about the wife's perspective and grievances",
        schema: z.object({
          story: z.string().describe("The wife's grievance or perspective to remember")
        })
      }
    );

    return [saveWifeStory];
  }

  createSolomonModeTools() {
    const getBothStories = tool(
      async (input, config) => {
        const store = config.store;
        if (!store) {
          throw new Error("store is required when compiling the graph");
        }

        const userId = config.configurable?.userId || 'default_user';
        
        // Get both stories from long-term memory
        let userStory, wifeStory;
        try {
          userStory = await store.get(["stories"], `${userId}_user`);
        } catch (error) {
          userStory = null;
        }
        
        try {
          wifeStory = await store.get(["stories"], `${userId}_wife`);
        } catch (error) {
          wifeStory = null;
        }
        
        let result = "📜 BOTH PERSPECTIVES:\n\n";
        
        if (userStory?.value?.content) {
          result += "👤 **User's Grievance:** " + userStory.value.content + "\n\n";
        } else {
          result += "👤 **User's Grievance:** No story shared yet\n\n";
        }
        
        if (wifeStory?.value?.content) {
          result += "👩 **Wife's Perspective:** " + wifeStory.value.content;
        } else {
          result += "👩 **Wife's Perspective:** No story shared yet";
        }
        
        return result;
      },
      {
        name: "get_both_stories",
        description: "Retrieve both the user's grievances and wife's perspective to render judgment",
        schema: z.object({})
      }
    );

    return [getBothStories];
  }

  getPromptFunction(mode) {
    const systemMessages = {
      [MODES.USER]: `You are a best friend who listens to the users stories and understands their perspective. You're the friend who always has their back and makes them feel heard and validated.

CRITICAL: Whenever they share ANY relationship problems, complaints, or grievances about their wife/partner, you MUST call save_user_story to save those details for future counseling sessions. This includes ANY negative feelings, frustrations, or conflicts they mention.

Your approach:
- Listen and validate their feelings
- IMMEDIATELY call save_user_story when they share any relationship issues
- Ask follow-up questions to understand better  
- Give supportive advice based on what they tell you in the conversation
- Always save important grievances - this is essential for the counseling process`,

      [MODES.WIFE]: `You are role-playing as the wife responding to grievances being aired about you. You don't know what specific complaints have been made, so ask them to tell you what they're upset about.

CRITICAL: Whenever you give your perspective, explanation, or response to complaints, you MUST call save_wife_story to save your side of the story for future counseling sessions.

Your approach:
- Ask them to explain what they're upset about if needed
- Respond authentically as the wife explaining your side
- IMMEDIATELY call save_wife_story after giving your perspective
- Be authentic - not neutral, but actually responding as someone defending themselves
- Always save your explanations and justifications for future reference`,

      [MODES.SOLOMON]: `You are King Solomon, the wise counselor who advises the user on where they went wrong and how to fix it. You must call get_both_stories to access both the user's grievances and the wife's responses before making recommendations.

Your approach:
- Review both sides objectively: "I can see that you feel... and she feels..."
- Identify the real underlying issues beyond the surface complaints
- Give specific, actionable recommendations for both parties
- "Here's what I think you should try..." 
- "She probably needs..." and "You probably need..."
- Suggest practical steps to improve the situation
- Address both people's valid concerns
- Speak with wisdom but in a relatable, helpful way

You're the wise friend who sees the bigger picture and gives solid advice to help them actually work things out.`
    };

    const systemMessage = systemMessages[mode] || "You are a helpful assistant.";
    
    return (state, config) => {
      const userId = config.configurable?.userId || 'default_user';
      const sessionId = config.configurable?.sessionId || 'default_session';
      
      const dynamicSystemMsg = `${systemMessage}

Session Info: You are in ${mode} mode for user ${userId} in session ${sessionId}.`;
      
      // Use plain message objects for createReactAgent
      return [{ role: "system", content: dynamicSystemMsg }, ...state.messages];
    };
  }

  async invoke(input, config = {}) {
    await this.initialize();
    
    // Default configuration
    const defaultConfig = {
      configurable: {
        thread_id: `${this.currentMode}_${config.configurable?.sessionId || 'default'}`,
        checkpoint_ns: "",
        userId: config.configurable?.userId || 'default_user',
        sessionId: config.configurable?.sessionId || 'default_session'
      }
    };

    const mergedConfig = {
      ...defaultConfig,
      ...config,
      configurable: {
        ...defaultConfig.configurable,
        ...config.configurable
      }
    };

    // Determine which agent to use based on input or default
    let mode = this.currentMode;
    if (input.mode && MODES[input.mode.toUpperCase()]) {
      mode = MODES[input.mode.toUpperCase()];
    }

    if (!this.agents[mode]) {
      throw new Error(`Agent not initialized for mode: ${mode}`);
    }

    // Invoke the appropriate agent
    const response = await this.agents[mode].invoke(
      { messages: input.messages || [{ role: "user", content: input.input || input.content || "" }] },
      mergedConfig
    );

    return response;
  }

  // Method to switch modes (for API usage)
  setMode(mode) {
    if (MODES[mode.toUpperCase()]) {
      this.currentMode = MODES[mode.toUpperCase()];
      return true;
    }
    return false;
  }

  // Get available modes
  getModes() {
    return Object.keys(MODES).map(key => ({
      key,
      value: MODES[key],
      description: this.getModeDescription(MODES[key])
    }));
  }

  getModeDescription(mode) {
    switch (mode) {
      case MODES.USER:
        return 'Your Perspective - Takes your side and validates your feelings';
      case MODES.WIFE:
        return 'Her Perspective - Role-plays as your wife responding to complaints';
      case MODES.SOLOMON:
        return 'King Solomon - Wise, neutral judge with access to both perspectives';
      default:
        return 'Unknown Mode';
    }
  }
}

// Export for LangGraph Platform
export default MarriageCounselorAgent;
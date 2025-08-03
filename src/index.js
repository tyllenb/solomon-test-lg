#!/usr/bin/env node

import dotenv from 'dotenv';
import chalk from 'chalk';
import inquirer from 'inquirer';

import { v4 as uuidv4 } from 'uuid';
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { InMemoryStore } from "@langchain/core/stores";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { initChatModel } from "langchain/chat_models/universal";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
// Message objects will be handled as plain objects for createReactAgent
import { MessagesAnnotation } from "@langchain/langgraph";


// Load environment variables
dotenv.config();

// No need for separate stores - checkpointer handles all memory via thread isolation

// Agent modes
const MODES = {
  USER: 'my_point_of_view',
  WIFE: 'her_point_of_view', 
  SOLOMON: 'king_solomon_wise'
};

export class MarriageCounselorAgent {
  constructor() {
    this.currentMode = MODES.USER;
    this.sessionId = uuidv4();
    this.userId = 'user_1'; // In a real app, this would be dynamic
    this.agents = {};
    this.isRunning = false;
    this.checkpointer = new MemorySaver();
    this.store = new InMemoryStore(); // Long-term memory store
  }

  async initialize() {
    console.log(chalk.blue('🏛️  Initializing Marriage Counselor Agent...'));
    
    if (!process.env.OPENAI_API_KEY) {
      console.error(chalk.red('❌ Please set OPENAI_API_KEY in your .env file'));
      process.exit(1);
    }

    try {
      // Initialize the LLM
      const llm = await initChatModel("gpt-4o", {
        modelProvider: "openai", 
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

      console.log(chalk.green('✅ Agent initialized successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize agent:'), error.message);
      process.exit(1);
    }
  }

  createUserModeTools() {
    const saveUserStory = tool(
      async (input, config) => {
        console.log('🔍 User save_user_story called!');
        console.log('📊 Input received:', input);
        
        const store = config.store;
        if (!store) {
          throw new Error("store is required when compiling the graph");
        }

        const userId = config.configurable?.userId;
        if (!userId) {
          throw new Error("userId is required in the config");
        }
        
        console.log(`💾 Saving story for user: ${userId}`);
        try {
          await store.put(["stories"], `${userId}_user`, { content: input.story });
          console.log('✅ Story saved successfully!');
        } catch (storeError) {
          console.log('❌ Store.put failed:', storeError);
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
        console.log('🔍 Wife save_wife_story called!');
        console.log('📊 Input received:', input);
        
        const store = config.store;
        if (!store) {
          throw new Error("store is required when compiling the graph");
        }

        const userId = config.configurable?.userId;
        if (!userId) {
          throw new Error("userId is required in the config");
        }
        
        console.log(`💾 Saving wife story for user: ${userId}`);
        try {
          await store.put(["stories"], `${userId}_wife`, { content: input.story });
          console.log('✅ Wife story saved successfully!');
        } catch (storeError) {
          console.log('❌ Store.put failed:', storeError);
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
        console.log('🔍 King Solomon get_both_stories called!');
        
        const store = config.store;
        if (!store) {
          throw new Error("store is required when compiling the graph");
        }

        const userId = config.configurable?.userId;
        if (!userId) {
          throw new Error("userId is required in the config");
        }
        
        console.log(`🔍 Looking for stories: ${userId}_user, ${userId}_wife`);
        
        // Get both stories from long-term memory using correct API
        let userStory, wifeStory;
        try {
          userStory = await store.get(["stories"], `${userId}_user`);
          console.log('📊 User story retrieved:', userStory);
        } catch (error) {
          console.log('❌ Failed to get user story:', error);
          userStory = null;
        }
        
        try {
          wifeStory = await store.get(["stories"], `${userId}_wife`);
          console.log('📊 Wife story retrieved:', wifeStory);
        } catch (error) {
          console.log('❌ Failed to get wife story:', error);
          wifeStory = null;
        }
        
        console.log('📊 Final stories found:', { userStory, wifeStory });
        
        let result = "📜 BOTH PERSPECTIVES:\\n\\n";
        
        if (userStory?.value?.content) {
          result += "👤 **User's Grievance:** " + userStory.value.content + "\\n\\n";
        } else {
          result += "👤 **User's Grievance:** No story shared yet\\n\\n";
        }
        
        if (wifeStory?.value?.content) {
          result += "👩 **Wife's Perspective:** " + wifeStory.value.content;
        } else {
          result += "👩 **Wife's Perspective:** No story shared yet";
        }
        
        console.log('✅ Returning result:', result);
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
      console.log('\n🎯 PROMPT FUNCTION CALLED!');
      
      const userId = config.configurable?.userId;
      const sessionId = config.configurable?.sessionId;
      
      const dynamicSystemMsg = `${systemMessage}

Session Info: You are in ${mode} mode for user ${userId} in session ${sessionId}.`;
      
      console.log('✅ Prompt ready with', (state.messages?.length || 0) + 1, 'messages');
      
      // Use plain message objects for createReactAgent
      return [{ role: "system", content: dynamicSystemMsg }, ...state.messages];
    };
  }

  getModeDisplay(mode) {
    switch (mode) {
      case MODES.USER:
        return chalk.blue('👤 Your Perspective');
      case MODES.WIFE:
        return chalk.magenta('👩 Her Perspective');
      case MODES.SOLOMON:
        return chalk.yellow('⚖️  King Solomon - The Wise');
      default:
        return 'Unknown Mode';
    }
  }

  async switchMode() {
    const choices = [
      { name: '👤 My Point of View (Your Side)', value: MODES.USER },
      { name: '👩 Her Point of View (Wife\'s Side)', value: MODES.WIFE },
      { name: '⚖️  King Solomon - The Wise (Neutral Judge)', value: MODES.SOLOMON },
      { name: '🚪 Exit', value: 'exit' }
    ];

    const { selectedMode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedMode',
        message: 'Select counseling mode:',
        choices
      }
    ]);

    if (selectedMode === 'exit') {
      this.isRunning = false;
      return;
    }

    this.currentMode = selectedMode;
    console.log(chalk.green(`\\n🔄 Switched to: ${this.getModeDisplay(selectedMode)}\\n`));
  }

  async chat() {
    if (!this.agents[this.currentMode]) {
      console.error(chalk.red('❌ Agent not initialized for this mode'));
      return;
    }
    
    console.log(chalk.cyan(`\\n📝 ${this.getModeDisplay(this.currentMode)} - Ready to listen...`));
    console.log(chalk.gray('Type your message (or "menu" to switch modes, "exit" to quit):\\n'));

    const { message } = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: '>'
      }
    ]);

    if (message.toLowerCase() === 'exit') {
      this.isRunning = false;
      return;
    }

    if (message.toLowerCase() === 'menu') {
      await this.switchMode();
      return;
    }

    if (message.trim() === '') {
      console.log(chalk.yellow('Please enter a message.'));
      return;
    }

    try {
      console.log(chalk.gray('\\n🤔 Thinking...\\n'));

      const config = {
        configurable: {
          thread_id: `${this.currentMode}_${this.sessionId}`,
          checkpoint_ns: "",
          userId: this.userId,
          sessionId: this.sessionId
        }
      };

      console.log(chalk.gray(`🔍 DEBUG: Using thread_id: ${config.configurable.thread_id}`));

      // Follow the exact LangGraph pattern - system prompt is handled by agent creation
      const response = await this.agents[this.currentMode].invoke(
        { messages: [{ role: "user", content: message }] },
        config
      );

      const lastMessage = response.messages[response.messages.length - 1];
      const responseText = lastMessage.content;

      console.log(chalk.white('💬 Response:'));
      console.log(responseText);
      console.log('\\n');

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      console.error(chalk.red('❌ Full error:'), error);
      console.error(chalk.red('❌ Error stack:'), error.stack);
    }
  }

  async start() {
    console.log(chalk.bold.blue('\\n🏛️  MARRIAGE COUNSELOR AGENT'));
    console.log(chalk.gray('A wise counsel system with three perspectives\\n'));

    this.isRunning = true;

    // Show initial mode selection
    await this.switchMode();

    // Main chat loop
    while (this.isRunning) {
      if (this.currentMode) {
        await this.chat();
      }
    }

    console.log(chalk.green('\\n👋 Thank you for using the Marriage Counselor Agent. May wisdom guide you.'));
  }
}

// Main execution
async function main() {
  const counselor = new MarriageCounselorAgent();
  await counselor.initialize();
  await counselor.start();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\\n\\n👋 Goodbye!'));
  process.exit(0);
});

// Start the application
main().catch(console.error);
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
        const store = config.store;
        if (!store) throw new Error("Store is required");
        
        const userId = config.configurable?.userId;
        if (!userId) throw new Error("userId is required");

        await store.mset([[`${userId}_user`, { content: input.story }]]);
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
        if (!store) throw new Error("Store is required");
        
        const userId = config.configurable?.userId;
        if (!userId) throw new Error("userId is required");

        await store.mset([[`${userId}_wife`, { content: input.story }]]);
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
        if (!store) throw new Error("Store is required");
        
        const userId = config.configurable?.userId;
        if (!userId) throw new Error("userId is required");

        // Get both stories from long-term memory
        const stories = await store.mget([`${userId}_user`, `${userId}_wife`]);
        const userStory = stories[0];
        const wifeStory = stories[1];
        
        let result = "📜 BOTH PERSPECTIVES:\\n\\n";
        
        if (userStory?.content) {
          result += "👤 **User's Grievance:** " + userStory.content + "\\n\\n";
        } else {
          result += "👤 **User's Grievance:** No story shared yet\\n\\n";
        }
        
        if (wifeStory?.content) {
          result += "👩 **Wife's Perspective:** " + wifeStory.content;
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

When they share relationship problems or grievances, use save_user_story to SAVE important details for future reference. You have full conversation memory - you remember everything they've told you in this chat session. Do NOT try to retrieve or access saved stories - just respond based on our conversation.

Your approach:
- Listen and validate their feelings
- Ask follow-up questions to understand better  
- Use save_user_story to save important grievances for future counsel
- Give supportive advice based on what they tell you in the conversation
- You remember the conversation automatically - no need to look anything up`,

      [MODES.WIFE]: `You are role-playing as the wife responding to grievances being aired about you. You don't know what specific complaints have been made, so ask them to tell you what they're upset about.

When they explain their grievances, respond as the wife would - explaining your side, your frustrations, and why you do things the way you do. Use save_wife_story to SAVE your responses for future reference.

You have full conversation memory - you remember everything said in this chat session. Do NOT try to retrieve or access saved stories - just respond based on our conversation.

Be authentic as the wife character - not neutral, but actually responding as someone who's being accused of things and wants to explain herself. Save important parts of your perspective using save_wife_story.`,

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
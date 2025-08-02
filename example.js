#!/usr/bin/env node

/**
 * Simple example of using the Marriage Counselor Agent
 * 
 * This demonstrates how to interact with the three different modes:
 * 1. Your perspective (takes your side)
 * 2. Her perspective (takes wife's side) 
 * 3. King Solomon (neutral wise judge)
 */

import { MarriageCounselorAgent } from './index.js';

async function runExample() {
  console.log('🏛️  Marriage Counselor Agent - Example Usage\n');

  // Create and initialize the agent
  const counselor = new MarriageCounselorAgent();
  
  try {
    await counselor.initialize();
    console.log('✅ Agent initialized successfully!\n');
  } catch (error) {
    console.error('❌ Failed to initialize agent:', error.message);
    console.log('\n💡 Make sure to set ANTHROPIC_API_KEY or OPENAI_API_KEY in your .env file');
    return;
  }

  console.log('📝 Example Workflow:');
  console.log('1. Share your side of the story');
  console.log('2. Switch to her perspective');
  console.log('3. Get wise judgment from King Solomon');
  console.log('\n🚀 To start the interactive session, run: npm start');
  console.log('\n💡 Each mode maintains separate memory:');
  console.log('   - Mode 1: Only remembers YOUR story');
  console.log('   - Mode 2: Only remembers HER story (role-played by you)');
  console.log('   - Mode 3: Has access to BOTH stories for judgment');
}

runExample().catch(console.error);
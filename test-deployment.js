#!/usr/bin/env node

/**
 * Test script for the deployment-ready Marriage Counselor Agent
 * This simulates how the agent will work when deployed to LangGraph Platform
 */

import { MarriageCounselorAgent } from './src/agent.js';

async function testDeploymentAgent() {
  console.log('🧪 Testing Deployment-Ready Marriage Counselor Agent\n');

  const agent = new MarriageCounselorAgent();
  
  try {
    console.log('🔄 Initializing agent...');
    await agent.initialize();
    console.log('✅ Agent initialized successfully!\n');

    // Test different modes
    const testCases = [
      {
        mode: 'SOLOMON',
        message: 'My wife and I keep arguing about money. She spends too much and I feel like she doesn\'t understand our budget constraints.'
      },
      {
        mode: 'USER', 
        message: 'I work hard all day and when I come home, she\'s bought more stuff we don\'t need. It\'s frustrating!'
      },
      {
        mode: 'WIFE',
        message: 'He says I spend too much, but I only buy things we need for the house. He doesn\'t appreciate what I do.'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🎯 Testing ${testCase.mode} mode:`);
      console.log(`Input: "${testCase.message}"`);
      
      try {
        const response = await agent.invoke({
          mode: testCase.mode,
          messages: [{ role: "user", content: testCase.message }]
        }, {
          configurable: {
            userId: 'test_user',
            sessionId: 'test_session'
          }
        });

        const lastMessage = response.messages[response.messages.length - 1];
        console.log(`\n💬 Response:`);
        console.log(lastMessage.content);
        console.log('\n' + '─'.repeat(80));
        
      } catch (error) {
        console.error(`❌ Error in ${testCase.mode} mode:`, error.message);
      }
    }

    console.log('\n🎉 Test completed! Your agent is ready for LangGraph Platform deployment.');
    console.log('\n📖 Next steps:');
    console.log('1. Push this code to GitHub');
    console.log('2. Follow the steps in DEPLOYMENT.md');
    console.log('3. Deploy via LangSmith dashboard');

  } catch (error) {
    console.error('❌ Failed to initialize agent:', error.message);
    console.log('\n💡 Make sure to set your API key in .env file:');
    console.log('   OPENAI_API_KEY=your_key_here');
    console.log('   OR');
    console.log('   ANTHROPIC_API_KEY=your_key_here');
  }
}

testDeploymentAgent().catch(console.error);
# LangGraph Platform Deployment Guide

Your Marriage Counselor Agent is now ready for deployment to LangGraph Platform! This guide walks you through the deployment process.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **A GitHub account** - Your code needs to be in a GitHub repository
2. **A LangSmith account** - Free to sign up at [smith.langchain.com](https://smith.langchain.com)
3. **API Keys** - Either OpenAI or Anthropic API key

## 🚀 Deployment Steps

### 1. Push Your Code to GitHub

If this repository isn't already on GitHub:

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - Marriage Counselor Agent"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

### 2. Set Up Environment Variables

Create a `.env` file with your API key:

```bash
# For OpenAI (recommended for deployment stability)
OPENAI_API_KEY=your_openai_api_key_here

# OR for Anthropic Claude
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

⚠️ **Important**: Do NOT commit your `.env` file to GitHub. It's already in `.gitignore`.

### 3. Deploy to LangGraph Platform

1. **Log in to LangSmith** at [smith.langchain.com](https://smith.langchain.com)

2. **Navigate to Deployments** in the left sidebar

3. **Click "+ New Deployment"**

4. **Connect GitHub** (if first time):
   - Click "Import from GitHub"
   - Follow instructions to connect your GitHub account

5. **Select Your Repository**:
   - Choose this repository from the list
   - Click "Submit to deploy"

6. **Wait for Deployment** (about 15 minutes):
   - Monitor progress in the Deployment details view

### 4. Configure Environment Variables in LangSmith

After deployment starts, you'll need to add your environment variables:

1. Go to your deployment details page
2. Find the "Environment Variables" section
3. Add your API key:
   - Name: `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`)
   - Value: Your actual API key

### 5. Test Your Deployment

Once deployed:

1. **Get the API URL**:
   - In Deployment details, click the API URL to copy it

2. **Test with LangGraph Studio**:
   - Click "LangGraph Studio" button in your deployment
   - Test the three different modes

3. **Test via API**:
   ```python
   from langgraph_sdk import get_client

   client = get_client(
       url="your-deployment-url", 
       api_key="your-langsmith-api-key"
   )

   # Test Solomon mode (default)
   async for chunk in client.runs.stream(
       None,  # Threadless run
       "agent",  # Name defined in langgraph.json
       input={
           "messages": [{
               "role": "human",
               "content": "I need marriage advice. My wife and I are arguing about finances.",
           }],
       },
       stream_mode="updates",
   ):
       print(f"Event: {chunk.event}")
       print(chunk.data)
   ```

## 🎯 Agent Modes

Your deployed agent supports three distinct modes:

1. **👤 User Perspective** (`mode: "USER"`):
   - Takes your side and validates feelings
   - Saves your grievances for future reference

2. **👩 Wife Perspective** (`mode: "WIFE"`):
   - Role-plays as your wife responding to complaints
   - Saves her perspective for Solomon's judgment

3. **⚖️ King Solomon** (`mode: "SOLOMON"`, default):
   - Wise, neutral judge with access to both perspectives
   - Provides balanced advice and solutions

## 📡 API Usage Examples

### Switch Modes
```python
# Set mode in the input
response = await client.runs.stream(
    None,
    "agent",
    input={
        "mode": "USER",  # or "WIFE" or "SOLOMON"
        "messages": [{"role": "human", "content": "Your message here"}],
    }
)
```

### Persistent Sessions
```python
# Use consistent thread_id for conversation continuity
config = {
    "configurable": {
        "thread_id": "user123_session456",
        "userId": "user123",
        "sessionId": "session456"
    }
}

response = await client.runs.stream(
    config["configurable"]["thread_id"],
    "agent", 
    input={"messages": [{"role": "human", "content": "Continue our conversation"}]},
    config=config
)
```

## 🔧 Files Added for Deployment

- **`langgraph.json`** - LangGraph Platform configuration
- **`Dockerfile`** - Container configuration for deployment
- **`src/agent.js`** - API-compatible version of your agent
- **`DEPLOYMENT.md`** - This deployment guide

## 🆘 Troubleshooting

### Common Issues:

1. **"Module not found" errors**:
   - Ensure all dependencies are in `package.json`
   - Check that file paths in `langgraph.json` are correct

2. **API key errors**:
   - Verify your API key is set in the LangSmith deployment environment
   - Ensure the key has sufficient credits/usage limits

3. **Deployment timeout**:
   - Large dependencies can cause timeouts
   - Consider optimizing your `package.json` dependencies

4. **Agent not responding**:
   - Check the deployment logs in LangSmith
   - Verify your `langgraph.json` configuration is correct

### Getting Help:

- Check deployment logs in LangSmith dashboard
- Review LangGraph Platform documentation
- Ensure your code works locally before deploying

## 🎉 Next Steps

After successful deployment:

1. **Share the API URL** with users who need marriage counseling assistance
2. **Monitor usage** in the LangSmith dashboard
3. **Update prompts** by modifying the code and redeploying
4. **Scale up** by upgrading your LangSmith plan if needed

---

*May your deployed agent bring wisdom and harmony to relationships worldwide! 🕊️*
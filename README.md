# Marriage Counselor Agent 🏛️

A sophisticated AI-powered marriage counseling system with three distinct modes, built using LangGraph JS. This agent provides different perspectives on relationship conflicts while maintaining proper memory segregation between viewpoints.

## Features

### Three Distinct Modes

1. **👤 My Point of View** - Your advocate and supporter
   - Takes your side completely
   - Has access to your full story and perspective
   - Validates your feelings and helps articulate your position
   - Provides advice that favors your viewpoint

2. **👩 Her Point of View** - Your wife's perspective
   - Speaks from your wife's likely perspective
   - Has NO access to your original story
   - Helps you understand her potential feelings and concerns
   - Challenges you to think from her point of view

3. **⚖️ King Solomon - The Wise** - Neutral judge
   - Has access to BOTH perspectives
   - Provides balanced, wise judgment
   - Finds truth and assigns responsibility fairly
   - Seeks harmony while addressing difficult truths

### Advanced Memory System

- **Memory Segregation**: Each mode has access only to appropriate information
- **Persistent Storage**: Stories and perspectives are saved across sessions
- **Short-term Memory**: Maintains conversation context within each mode
- **Long-term Memory**: Remembers user preferences and story details

### Interactive Features

- **Terminal Interface**: Clean, colored terminal interface with intuitive navigation
- **Speech Synthesis**: Option to hear responses spoken aloud
- **Mode Switching**: Easy switching between perspectives during conversation
- **Session Persistence**: Continue conversations across multiple sessions

## Installation

1. **Clone or create the project directory**
   ```bash
   mkdir marriage-counselor-agent
   cd marriage-counselor-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with your API key:
   ```bash
   # For Anthropic Claude (recommended)
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   
   # OR for OpenAI GPT-4o  
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Test the setup (optional)**
   ```bash
   npm run example
   ```

## Usage

### Starting the Agent

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

Or run the example to see the setup:

```bash
npm run example
```

### Using the Interface

1. **Select a Mode**: Choose from the three available counseling modes
2. **Share Your Story**: Type your grievances, concerns, or perspective
3. **Get Feedback**: Receive tailored responses based on the selected mode
4. **Switch Modes**: Type "menu" to change perspectives
5. **Continue Conversations**: The agent remembers everything within each mode
6. **Listen to Responses**: Option to hear responses via text-to-speech

### Example Workflow

1. **Start in "My Point of View"**:
   - Share your side of the conflict
   - Get validation and support
   - Build your complete narrative

2. **Switch to "Her Point of View"**:
   - Role-play as your wife
   - Explore her potential perspective
   - Understand her likely concerns

3. **Consult "King Solomon"**:
   - Get neutral, wise judgment
   - Receive balanced perspective on both sides
   - Get practical solutions and insights

## Commands

While chatting:
- `menu` - Switch between modes
- `exit` - Quit the application
- `Ctrl+C` - Emergency exit

## Technical Architecture

### Memory Stores
- **User Story Store**: Saves your perspective (accessible in modes 1 & 3)
- **Wife Story Store**: Saves wife's perspective (accessible in modes 2 & 3)
- **Shared Store**: Saves Solomon's judgments and metadata

### Agent Tools
Each mode has specific tools:
- **Mode 1**: `save_user_story`, `get_user_story`
- **Mode 2**: `save_wife_story`, `get_wife_story`
- **Mode 3**: `get_both_stories`, `save_judgment`

### System Prompts
Each mode has carefully crafted system prompts that define:
- The agent's personality and approach
- Access to specific memory stores
- Behavioral guidelines and limitations

## Dependencies

- **@langchain/langgraph**: Core agent framework
- **@langchain/langgraph-checkpoint**: Memory and persistence
- **@langchain/anthropic**: Claude AI integration
- **chalk**: Terminal colors and formatting
- **inquirer**: Interactive terminal prompts
- **say**: Text-to-speech functionality
- **dotenv**: Environment variable management

## Privacy & Security

- All conversations are stored locally in memory
- No data is sent to external services except for AI processing
- Each mode maintains strict access controls to appropriate information
- Stories are segregated and cannot cross-contaminate between perspectives

## Customization

You can modify the system prompts in the `getSystemPrompt()` method to:
- Adjust the personality of each mode
- Add specific counseling techniques
- Customize the wisdom style of King Solomon
- Add new behavioral guidelines

## Troubleshooting

### Common Issues

1. **API Key Error**: Make sure your `.env` file contains a valid API key
2. **Module Not Found**: Run `npm install` to ensure all dependencies are installed
3. **Speech Not Working**: The `say` package requires system-level text-to-speech support
4. **Permission Errors**: On macOS, you may need to grant terminal permissions for speech

### Getting Help

The agent is designed to be self-explanatory, but if you encounter issues:
1. Check your API key is correctly set
2. Ensure all dependencies are installed
3. Try restarting the application
4. Check your internet connection for AI model access

## License

MIT License - Feel free to modify and extend for your needs.

---

*"The heart of the wise inclines to the right, but the heart of the fool to the left."* - Ecclesiastes 10:2

May this tool help bring wisdom and understanding to your relationships. 🕊️# solomon-test-lg

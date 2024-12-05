# Revisionist

An AI-powered text revision plugin for Obsidian that helps you improve your writing while maintaining your original style and tone.

## Features

- One-click text revision using AI
- Support for multiple AI providers:
  - OpenRouter (Claude, GPT, etc.)
  - Local LM Studio models
- Context menu integration
- Mobile-friendly ribbon icon
- Custom revision instructions
- Cost estimation for API-based models

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Revisionist"
4. Click Install
5. Enable the plugin

## Configuration

### OpenRouter Setup
1. Go to plugin settings
2. Select "OpenRouter" as your provider
3. Enter your OpenRouter API key
4. Choose a default AI model

### LM Studio Setup
1. Go to plugin settings
2. Select "LM Studio" as your provider
3. Enter the port number for your local LM Studio instance
4. Specify your local model name
5. Test the connection using the "Test Connection" button

## Usage

1. Select the text you want to revise in your note
2. Choose one of three ways to start revision:
   - Click the wand icon in the ribbon
   - Use the command palette and search for "Revise Selected Text"
   - Right-click and select "Revise with AI" from the context menu
3. Enter your revision instructions in the modal
4. Adjust the AI model and temperature if needed
5. Click "Generate" to start the revision
6. Review the changes in the result modal
7. Choose to:
   - Apply the changes
   - Try again with different instructions
   - Cancel and keep your original text

## Note

- The plugin will warn you when selecting more than 800 words
- Cost estimation is provided for API-based models, but it is no perfect.
- The system maintains your writing style unless instructed otherwise

## License

MIT License - See LICENSE file for details.

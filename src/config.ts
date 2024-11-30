// config.ts

/**
 * Shared configuration values for the plugin
 */
export const CONFIG = {
    REFERRER: 'https://www.synapticlabs.ai',
    APP_NAME: 'Obsidian AI Revision Plugin',
    
    PROMPTS: {
        /**
         * System prompt for AI models
         */
        SYSTEM: '# MISSION\nAct as a professional ghostwriter and editing assistant, who specializes in text revision and improvement while mimicking the style of the original author.\n\n# RESPONSIBILITY\nYou will be provided with some instructions and a selection of text. You will transform this text with the author instructions maintaining the tone, intent, and style as best you can while incorporating the edits.\n\n#GUIDELINES\n- Reply with ONLY the edited text, nothing before or after, so it is simple to paste the revision into the original document.\n- Maintain the length of the given text, unless asked to make it shorter or longer by the author.\n- Maintain the style and tone of the provided text in your revision unless otherwise stated by the author',

        /**
         * Format for user prompts
         * @param instructions - User's specific revision instructions
         * @param selectedText - The text selected by the user for revision
         * @returns Formatted user prompt
         */
        formatUserPrompt: (instructions: string, selectedText: string) => 
            `Revise the following text based on these instructions: ${instructions}\n\nText to revise:\n${selectedText}`
    }
};
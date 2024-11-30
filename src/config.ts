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
        SYSTEM: 'You are a helpful assistant specializing in text revision and improvement. ' +
                'Your goal is to enhance the given text while maintaining its original meaning and intent. ' +
                'Consider clarity, coherence, and proper grammar in your revisions.',

        /**
         * Format for user prompts
         * @param instructions - User's specific revision instructions
         * @returns Formatted user prompt
         */
        formatUserPrompt: (instructions: string) => 
            `Please revise the following text based on these instructions: ${instructions}`
    }
};
// src/ai/openAI.ts

import { RequestUrlResponse } from 'obsidian';
import { AIProvider } from './models';
import { BaseAdapter } from './baseAdapter';
import { CONFIG } from '../config';
import OpenAI from 'openai';

/**
 * OpenAI API service adapter implementation
 * Handles communication with OpenAI's API for their models
 * 
 * This adapter uses the official OpenAI SDK to provide
 * text revision capabilities using OpenAI's models like GPT-4o and GPT-4.1 series.
 * It transforms requests from the plugin's format to OpenAI's expected format
 * and parses responses back into the plugin's expected structure.
 */
export class OpenAIAdapter extends BaseAdapter {
    private client: OpenAI | null = null;

    /**
     * Configure the OpenAI adapter
     * No additional configuration needed beyond the API key
     */
    public configure(config: Record<string, any>): void {
        // No additional configuration needed for OpenAI
    }

    /**
     * Initialize the OpenAI client if needed
     * This ensures we only create the client when we have an API key
     */
    private ensureClient(): OpenAI {
        if (!this.client && this.apiKey) {
            console.log('Initializing OpenAI client');
            this.client = new OpenAI({
                apiKey: this.apiKey,
                dangerouslyAllowBrowser: true // Allow usage in Obsidian's Electron environment
            });
        }
        
        if (!this.client) {
            throw new Error('OpenAI client not initialized - missing API key');
        }
        
        return this.client;
    }

    /**
     * Set API key for the service
     * Override to reset the client when the API key changes
     */
    public setApiKey(apiKey: string): void {
        // If the API key is changing, reset the client
        if (this.apiKey !== apiKey) {
            this.client = null;
        }
        
        // Call the parent method to set the API key
        super.setApiKey(apiKey);
        
        // Initialize the client with the new API key if needed
        if (apiKey) {
            this.ensureClient();
        }
    }

    /**
     * Makes an API request to OpenAI's responses endpoint using the SDK
     * 
     * @param params Request parameters including model, prompt, and settings
     * @returns Promise resolving to the API response
     */
    protected async makeApiRequest(params: {
        model: string;
        prompt: string;
        temperature: number;
        maxTokens: number;
        rawResponse?: boolean;
        selectedText?: string;
        fullNote?: string;
        isTest?: boolean;
    }): Promise<any> {
        try {
            const client = this.ensureClient();
            
            // Prepare input based on whether this is a test or normal request
            let input: string | any[];
            let instructions: string | null = null;
            
            if (params.isTest) {
                // For test connections, use a simple input
                input = params.prompt;
            } else {
                // For normal requests, use the system prompt as instructions
                // and format the user prompt as input
                instructions = CONFIG.PROMPTS.SYSTEM;
                input = CONFIG.PROMPTS.formatUserPrompt(
                    params.prompt,
                    params.selectedText || '',
                    params.fullNote || ''
                );
            }

            // Log the request details
            console.log('OpenAI API Request:', {
                model: params.model,
                input: input,
                instructions: instructions ? '[PRESENT]' : '[NONE]',
                temperature: params.temperature,
                max_output_tokens: params.maxTokens,
                isTest: params.isTest
            });

            // Use the SDK to make the request
            const response = await client.responses.create({
                model: params.model,
                input: input,
                instructions: instructions || undefined,
                temperature: params.temperature,
                max_output_tokens: params.maxTokens
            });

            console.log('OpenAI API Response received successfully');
            return response;
        } catch (error) {
            // Log any errors with detailed information
            console.error('OpenAI API Error:', error);
            
            // The SDK provides detailed error information
            if (error instanceof OpenAI.APIError) {
                console.error('OpenAI API Error Details:', {
                    status: error.status,
                    message: error.message,
                    type: error.type,
                    code: error.code,
                    param: error.param,
                    request_id: error.request_id
                });
            }
            
            throw error;
        }
    }

    /**
     * Extracts the content from the OpenAI API response
     * 
     * @param response The API response object from the SDK
     * @returns The extracted content string
     */
    protected extractContentFromResponse(response: any): string {
        // Log the response structure for debugging
        console.log('OpenAI Response received:', response.id);
        
        // The SDK provides a convenient output_text property
        if (response.output_text) {
            return response.output_text;
        }
        
        // If output_text is not available, extract it manually
        if (!response.output || !Array.isArray(response.output) || response.output.length === 0) {
            console.error('Invalid response format - missing or empty output array');
            throw new Error('Invalid response format from OpenAI API');
        }
        
        // Find the first message in the output array
        const message = response.output.find((item: any) => item.type === 'message');
        if (!message || !message.content || !Array.isArray(message.content) || message.content.length === 0) {
            console.error('No valid message content found');
            throw new Error('No valid message content found in OpenAI API response');
        }
        
        // Find the first text content
        const textContent = message.content.find((item: any) => item.type === 'output_text');
        if (!textContent || !textContent.text) {
            console.error('No text content found');
            throw new Error('No text content found in OpenAI API response');
        }
        
        return textContent.text;
    }

    /**
     * Extracts token count information from the OpenAI API response
     * 
     * @param response The API response object from the SDK
     * @returns Token count object with input, output, and total counts
     */
    protected extractTokenCounts(response: any) {
        const usage = response.usage;
        return {
            input: usage?.input_tokens || 0,
            output: usage?.output_tokens || 0,
            total: usage?.total_tokens || 0
        };
    }

    /**
     * Returns the provider type for this adapter
     * 
     * @returns The AIProvider enum value for OpenAI
     */
    public getProviderType(): AIProvider {
        return AIProvider.OpenAI;
    }

    /**
     * Override the generateResponse method to use the SDK directly
     * This provides better error handling and response parsing
     */
    public async generateResponse(
        prompt: string,
        modelApiName: string,
        options?: {
            temperature?: number;
            maxTokens?: number;
            rawResponse?: boolean;
            selectedText?: string;
            fullNote?: string;
        }
    ): Promise<{
        success: boolean;
        data: string;
        tokens?: {
            input: number;
            output: number;
            total: number;
        };
        error?: string;
    }> {
        try {
            const client = this.ensureClient();
            const apiModel = this.getApiModelName(modelApiName);
            
            if (!apiModel) {
                throw new Error(`No valid model found for ${this.getProviderType()}`);
            }

            const temperature = options?.temperature ?? 0.7;
            const maxTokens = options?.maxTokens ?? 1000;
            
            // Prepare input and instructions
            const instructions = CONFIG.PROMPTS.SYSTEM;
            const input = CONFIG.PROMPTS.formatUserPrompt(
                prompt,
                options?.selectedText || '',
                options?.fullNote || ''
            );

            console.log(`Generating response with model ${apiModel}`);
            
            // Use the SDK to make the request
            const response = await client.responses.create({
                model: apiModel,
                input: input,
                instructions: instructions,
                temperature: temperature,
                max_output_tokens: maxTokens
            });

            console.log('Response received successfully');
            
            // Extract token counts
            const tokens = {
                input: response.usage?.input_tokens || 0,
                output: response.usage?.output_tokens || 0,
                total: response.usage?.total_tokens || 0
            };
            
            // Return the response
            return {
                success: true,
                data: response.output_text || '',
                tokens
            };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Test the connection to the OpenAI API using the SDK
     * 
     * @returns Promise resolving to a boolean indicating if the connection was successful
     */
    public async testConnection(): Promise<boolean> {
        try {
            console.log('Testing OpenAI connection...');
            
            if (!this.isReady()) {
                console.log('OpenAI adapter not ready - missing API key or models');
                return false;
            }
            
            // Use gpt-4.1-nano-2025-04-14 for testing as it's definitely supported by the new API
            // and is the most cost-effective model for testing
            const testModel = 'gpt-4.1-nano-2025-04-14';
            console.log('Using test model:', testModel);
            
            const client = this.ensureClient();
            
            // Use the SDK to make a simple request
            const response = await client.responses.create({
                model: testModel,
                input: 'Hi',
                max_output_tokens: 25
            });
            
            console.log('Test connection successful, response ID:', response.id);
            return true;
        } catch (error) {
            console.error('OpenAI connection test error:', error);
            
            // Provide more detailed error information from the SDK
            if (error instanceof OpenAI.APIError) {
                console.error('OpenAI API Error Details:', {
                    status: error.status,
                    message: error.message,
                    type: error.type,
                    code: error.code,
                    param: error.param,
                    request_id: error.request_id
                });
            }
            
            return false;
        }
    }
}

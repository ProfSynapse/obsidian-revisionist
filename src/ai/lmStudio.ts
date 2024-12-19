// src/ai/lmStudio.ts

import { requestUrl, RequestUrlResponse } from 'obsidian';
import { AIProvider } from './models';
import { BaseAdapter } from './baseAdapter';
import { CONFIG } from '../config';

/**
 * LMStudio adapter for local model inference
 * Communicates with a locally running LM Studio server
 */
export class LMStudioAdapter extends BaseAdapter {
    private port: string = '1234'; // Default port
    private modelName: string = 'default'; // Default model name

    protected async makeApiRequest(params: {
        model: string;
        prompt: string;
        temperature: number;
        maxTokens: number;
        rawResponse?: boolean;
        selectedText?: string;  // Add this parameter
        fullNoteContent: string;  // Add this parameter
    }): Promise<RequestUrlResponse> {
        return await requestUrl({
            url: `http://localhost:${this.port}/v1/chat/completions`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.modelName,
                messages: [
                    {
                        role: 'system',
                        content: CONFIG.PROMPTS.SYSTEM
                    },
                    {
                        role: 'user',
                        content: CONFIG.PROMPTS.formatUserPrompt(
                            params.prompt,
                            params.selectedText || '',  // Pass selected text
                            params.fullNoteContent  // Include full note content
                        )
                    }
                ],
                temperature: params.temperature,
                max_tokens: params.maxTokens,
                stream: false
            })
        });
    }

    protected extractContentFromResponse(response: RequestUrlResponse): string {
        if (!response.json?.choices?.[0]?.message?.content) {
            throw new Error('Invalid response format from LM Studio API');
        }
        return response.json.choices[0].message.content;
    }

    protected extractTokenCounts(response: RequestUrlResponse) {
        const usage = response.json?.usage;
        return {
            input: usage?.prompt_tokens || 0,
            output: usage?.completion_tokens || 0,
            total: usage?.total_tokens || 0
        };
    }

    public getProviderType(): AIProvider {
        return AIProvider.LMStudio;
    }

    /**
     * Configure the LMStudio adapter with port and model name
     */
    public configure(config: { port: string; modelName: string }): void {
        if (config.port) {
            this.port = config.port.toString();
        }
        if (config.modelName) {
            this.modelName = config.modelName;
        }
    }

    /**
     * Override isReady to check local configuration
     */
    public override isReady(): boolean {
        return !!this.port && !!this.modelName;
    }

    /**
     * Get the current port number
     */
    public getPort(): string {
        return this.port;
    }

    /**
     * Get the current model name
     */
    public getModelName(): string {
        return this.modelName;
    }

    /**
     * Set the port number
     */
    public setPort(port: string): void {
        this.port = port;
    }

    /**
     * Set the model name
     */
    public setModelName(modelName: string): void {
        this.modelName = modelName;
    }

    /**
     * Override getAvailableModels to return local model
     */
    public override getAvailableModels(): string[] {
        return [this.modelName];
    }
}
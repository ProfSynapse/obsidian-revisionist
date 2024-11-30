// src/ai/openRouter.ts
import { requestUrl, RequestUrlResponse } from 'obsidian';
import { AIProvider } from './models';
import { BaseAdapter } from './baseAdapter';
import { CONFIG } from '../config';

/**
 * OpenRouter AI service adapter implementation
 * Handles communication with OpenRouter's API for various AI models
 */
export class OpenRouterAdapter extends BaseAdapter {
    public configure(config: Record<string, any>): void {
    }

    protected async makeApiRequest(params: {
        model: string;
        prompt: string;
        temperature: number;
        maxTokens: number;
        rawResponse?: boolean;
        selectedText?: string;  // Add this parameter
    }): Promise<RequestUrlResponse> {
        return await requestUrl({
            url: 'https://openrouter.ai/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': CONFIG.REFERRER,
                'X-Title': CONFIG.APP_NAME
            },
            body: JSON.stringify({
                model: params.model,
                messages: [
                    {
                        role: 'system',
                        content: CONFIG.PROMPTS.SYSTEM
                    },
                    {
                        role: 'user',
                        content: CONFIG.PROMPTS.formatUserPrompt(
                            params.prompt,
                            params.selectedText || ''  // Pass selected text
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
            throw new Error('Invalid response format from OpenRouter API');
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
        return AIProvider.OpenRouter;
    }
}
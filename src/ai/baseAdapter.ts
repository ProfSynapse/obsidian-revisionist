// src/ai/baseAdapter.ts

import { Notice, RequestUrlResponse } from 'obsidian';
import { AIProvider, AIResponse, AIModel, AIModelMap } from './models';

export interface AIResponseOptions {
    temperature?: number;
    maxTokens?: number;
    rawResponse?: boolean;
    selectedText?: string;
}

export interface TokenCount {
    input: number;
    output: number;
    total: number;
}

export interface APIRequestParams {
    model: string;
    prompt: string;
    temperature: number;
    maxTokens: number;
    rawResponse?: boolean;
    selectedText?: string;
}

export interface APIResponse<T = unknown> {
    success: boolean;
    data: T;
    tokens?: TokenCount;
    error?: string;
}

export abstract class BaseAdapter {
    protected apiKey: string = '';
    protected models: AIModel[] = [];

    constructor() {
        // Initialize models based on provider type
        this.models = AIModelMap[this.getProviderType()];
    }

    /**
     * Configure provider-specific settings
     * @param config Configuration object specific to the provider
     */
    abstract configure(config: Record<string, unknown>): void;

    /**
     * Methods that must be implemented by specific adapters
     */
    protected abstract makeApiRequest(params: {
        model: string;
        prompt: string;
        temperature: number;
        maxTokens: number;
        rawResponse?: boolean;
        selectedText?: string;
        isTest?: boolean;
    }): Promise<RequestUrlResponse>;

    protected abstract extractContentFromResponse(response: RequestUrlResponse): string;

    protected abstract extractTokenCounts(response: RequestUrlResponse): TokenCount;

    abstract getProviderType(): AIProvider;

    /**
     * Generate a response from the AI model
     */
    public async generateResponse(
        prompt: string,
        modelApiName: string,
        options?: AIResponseOptions & { fullNote?: string }
    ): Promise<APIResponse<string>> {
        try {
            const apiModel = this.getApiModelName(modelApiName);
            if (!apiModel) {
                throw new Error(`No valid model found for ${this.getProviderType()}`);
            }

            // Skip API key check for LMStudio
            if (!this.apiKey && this.getProviderType() !== AIProvider.LMStudio) {
                throw new Error(`${this.getProviderType()} API key is not set`);
            }

            const temperature = options?.temperature ?? 0.7;
            const maxTokens = options?.maxTokens ?? 1000;

            const response = await this.makeApiRequest({
                model: apiModel,
                prompt,
                temperature,
                maxTokens,
                rawResponse: options?.rawResponse,
                selectedText: options?.selectedText || '',
                isTest: false
            });

            const content = this.extractContentFromResponse(response);
            const tokens = this.extractTokenCounts(response);

            return { 
                success: true, 
                data: content,
                tokens
            };

        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Test the connection to the AI service
     */
    public async testConnection(): Promise<boolean> {
        try {
            if (!this.isReady()) {
                console.log('Adapter not ready during test connection');
                return false;
            }

            console.log('Testing connection with model:', this.models[0]?.apiName);
            
            const response = await this.makeApiRequest({
                model: this.models[0]?.apiName || '',
                prompt: 'Hi',
                temperature: 0.7,
                maxTokens: 10,
                rawResponse: true,
                isTest: true
            });

            console.log('Test connection response:', {
                status: response.status,
                hasContent: !!response.json?.choices?.[0]?.message?.content
            });

            return response.status === 200 && !!response.json?.choices?.[0]?.message?.content;
        } catch (error) {
            return false;
        }
    }

    /**
     * Handle errors uniformly across adapters
     */
    protected handleError(error: unknown): APIResponse<string> {
        const provider = this.getProviderType();
        console.error(`Error in ${provider} API call:`, error);
        
        let errorMessage = 'Unknown error occurred';
        if (error instanceof Error) {
            errorMessage = error.message;
            console.error('Error stack:', error.stack);
        }
        
        if ('response' in (error as any)) {
            console.error('API Response:', (error as any).response);
        }

        new Notice(`${provider} API Error: ${errorMessage}`);
        return { success: false, error: errorMessage, data: '' };
    }

    /**
     * Validate API key
     */
    public async validateApiKey(): Promise<boolean> {
        try {
            if (!this.isReady()) {
                throw new Error(`${this.getProviderType()} is not properly configured`);
            }

            const isValid = await this.testConnection();

            if (isValid) {
                new Notice(`${this.getProviderType()} API key validated successfully`);
                return true;
            } else {
                throw new Error('Failed to validate API key');
            }
        } catch (error) {
            new Notice(`Failed to validate ${this.getProviderType()} API key: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
            return false;
        }
    }

    /**
     * Get list of available models
     */
    public getAvailableModels(): string[] {
        return this.models.map(model => model.apiName);
    }

    /**
     * Set API key for the service
     */
    public setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
    }

    /**
     * Get current API key
     */
    public getApiKey(): string {
        return this.apiKey;
    }

    /**
     * Check if adapter is properly configured
     */
    public isReady(): boolean {
        const ready = (!!this.apiKey || this.getProviderType() === AIProvider.LMStudio) && this.models.length > 0;
        if (!ready) {
            console.warn(`${this.getProviderType()} adapter not ready:`, {
                hasApiKey: !!this.apiKey,
                provider: this.getProviderType(),
                modelsCount: this.models.length
            });
        }
        return ready;
    }

    /**
     * Get API model name, with fallback to first available model
     */
    public getApiModelName(modelApiName: string): string {
        const model = this.models.find(m => m.apiName === modelApiName);
        if (!model) {
            return this.models[0]?.apiName || modelApiName;
        }
        return model.apiName;
    }
}
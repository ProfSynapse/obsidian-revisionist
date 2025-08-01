// src/ai/models.ts

/**
 * Defines the available AI providers
 */
export enum AIProvider {
    OpenRouter = 'openrouter',
    LMStudio = 'lmstudio',
    OpenAI = 'openai'
}

/**
 * Structure of AI response
 */
export interface AIResponse {
    /** Whether the request was successful */
    success: boolean;
    /** Response data if successful */
    data?: unknown;
    /** Error message if unsuccessful */
    error?: string;
    /** Token usage information */
    tokens?: {
        input: number;
        output: number;
        total: number;
    };
}

/**
 * Options for AI response generation
 */
export interface AIResponseOptions {
    /** Skip JSON validation and return raw response */
    rawResponse?: boolean;
    /** Maximum tokens to generate */
    maxTokens?: number;
    /** Temperature for response generation */
    temperature?: number;
    /** Additional provider-specific options */
    providerOptions?: Record<string, unknown>;
}

/**
 * AI model definition
 */
export interface AIModel {
    /** Display name of the model */
    name: string;
    /** API identifier for the model */
    apiName: string;
    /** Optional model capabilities */
    capabilities?: {
        maxTokens?: number;
        supportsFunctions?: boolean;
        supportsStreaming?: boolean;
        supportsVision?: boolean;
    };
    /** Cost per million input tokens in USD */
    inputCostPer1M?: number;
    /** Cost per million output tokens in USD */
    outputCostPer1M?: number;
    /** Maximum context window size in tokens */
    contextWindow?: number;
}

/**
 * Model information organized by provider
 */
export const AIModelMap: Record<AIProvider, AIModel[]> = {
    [AIProvider.OpenRouter]: [
        {
            name: 'Claude 3.5 Haiku',
            apiName: 'anthropic/claude-3.5-haiku',
            capabilities: {
                maxTokens: 8192,
                supportsFunctions: true,
                supportsStreaming: true
            },
            inputCostPer1M: 1.00,
            outputCostPer1M: 1.00,
            contextWindow: 200000
        },
        {
            name: 'Anthropic Claude 4 Sonnet',
            apiName: 'anthropic/claude-4-sonnet',
            capabilities: {
                maxTokens: 8192,
                supportsFunctions: true,
                supportsStreaming: true,
                supportsVision: true
            },
            inputCostPer1M: 3.00,
            outputCostPer1M: 15.00,
            contextWindow: 200000
        },
        {
            name: 'Google Gemini Flash 2.5',
            apiName: 'google/gemini-2.5-flash',
            capabilities: {
                maxTokens: 66000,
                supportsStreaming: true
            },
            inputCostPer1M: 0.3,
            outputCostPer1M: 2.5,
            contextWindow: 1048576
        },
        {
            name: 'Google Gemini Pro 2.5',
            apiName: 'google/gemini-2.5-pro',
            capabilities: {
                maxTokens: 8192,
                supportsStreaming: true,
                supportsVision: true
            },
            inputCostPer1M: 1.25,
            outputCostPer1M: 10.00,
            contextWindow: 1048576
        },
        {
            name: 'Mistral Large',
            apiName: 'mistralai/mistral-large-2407',
            capabilities: {
                maxTokens: 128000,
                supportsStreaming: true
            },
            inputCostPer1M: 2.00,
            outputCostPer1M: 6.00,
            contextWindow: 128000
        },
        {
            name: 'OpenAI 4.1',
            apiName: 'openai/gpt-4.1',
            capabilities: {
                maxTokens: 33000,
                supportsFunctions: true,
                supportsStreaming: true,
                supportsVision: true
            },
            inputCostPer1M: 2.00,
            outputCostPer1M: 8.00,
            contextWindow: 1047576
        },
        {
            name: 'OpenAI 4.1 Mini',
            apiName: 'openai/gpt-4.1-mini',
            capabilities: {
                maxTokens: 33000,
                supportsFunctions: true,
                supportsStreaming: true
            },
            inputCostPer1M: 0.4,
            outputCostPer1M: 1.60,
            contextWindow: 1047576
        },
        {
            name: 'OpenAI o4 Mini',
            apiName: 'openai/gpt-o1-mini',
            capabilities: {
                maxTokens: 100000,
                supportsFunctions: true,
                supportsStreaming: true
            },
            inputCostPer1M: 1.10,
            outputCostPer1M: 4.40,
            contextWindow: 200000
        }
    ],
    [AIProvider.LMStudio]: [
        {
            name: 'Custom',
            apiName: 'custom',
            capabilities: {
                supportsStreaming: false
            }
        }
    ],
    [AIProvider.OpenAI]: [
        {
            name: 'GPT-4o',
            apiName: 'gpt-4o',
            capabilities: {
                maxTokens: 4096,
                supportsFunctions: true,
                supportsStreaming: true,
                supportsVision: true
            },
            inputCostPer1M: 10.00,
            outputCostPer1M: 30.00,
            contextWindow: 128000
        },
        {
            name: 'GPT-4o-mini',
            apiName: 'gpt-4o-mini',
            capabilities: {
                maxTokens: 4096,
                supportsFunctions: true,
                supportsStreaming: true
            },
            inputCostPer1M: 0.50,
            outputCostPer1M: 1.50,
            contextWindow: 128000
        },
        {
            name: 'GPT-4.1',
            apiName: 'gpt-4.1-2025-04-14',
            capabilities: {
                maxTokens: 4096,
                supportsFunctions: true,
                supportsStreaming: true,
                supportsVision: true
            },
            inputCostPer1M: 2.00,
            outputCostPer1M: 8.00,
            contextWindow: 1000000
        },
        {
            name: 'GPT-4.1-mini',
            apiName: 'gpt-4.1-mini-2025-04-14',
            capabilities: {
                maxTokens: 4096,
                supportsFunctions: true,
                supportsStreaming: true
            },
            inputCostPer1M: 0.40,
            outputCostPer1M: 1.60,
            contextWindow: 1000000
        },
        {
            name: 'GPT-4.1-nano',
            apiName: 'gpt-4.1-nano-2025-04-14',
            capabilities: {
                maxTokens: 4096,
                supportsFunctions: true,
                supportsStreaming: true
            },
            inputCostPer1M: 0.10,
            outputCostPer1M: 0.40,
            contextWindow: 1000000
        }
    ]
};

/**
 * Helper utilities for working with AI models
 */
export const AIModelUtils = {
    /**
     * Get a model by its API name
     */
    getModelByApiName(apiName: string): AIModel | undefined {
        for (const models of Object.values(AIModelMap)) {
            const model = models.find(m => m.apiName === apiName);
            if (model) return model;
        }
        return undefined;
    },

    /**
     * Get all available models for a provider
     */
    getModelsForProvider(provider: AIProvider): AIModel[] {
        return AIModelMap[provider] || [];
    },

    /**
     * Get default model for a provider
     */
    getDefaultModelForProvider(provider: AIProvider): AIModel | undefined {
        const models = AIModelMap[provider];
        return models?.[0];
    }
};

/**
 * OpenAI Model Specifications
 * Updated June 17, 2025 with latest model releases
 */

import { ModelSpec } from '../modelTypes';

export const OPENAI_MODELS: ModelSpec[] = [
  // GPT-4o models
  {
    provider: 'openai',
    name: 'GPT-4o',
    apiName: 'gpt-4o',
    contextWindow: 128000,
    maxTokens: 16384,
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
    capabilities: {
      supportsJSON: true,
      supportsImages: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  },

  // GPT-4.1 models
  {
    provider: 'openai',
    name: 'GPT-4.1',
    apiName: 'gpt-4.1',
    contextWindow: 1047576,
    maxTokens: 32768,
    inputCostPerMillion: 8.00,
    outputCostPerMillion: 8.00,
    capabilities: {
      supportsJSON: true,
      supportsImages: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  },
  {
    provider: 'openai',
    name: 'GPT-4.1 Mini',
    apiName: 'gpt-4.1-mini',
    contextWindow: 1047576,
    maxTokens: 32768,
    inputCostPerMillion: 0.10,
    outputCostPerMillion: 1.60,
    capabilities: {
      supportsJSON: true,
      supportsImages: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  },
  {
    provider: 'openai',
    name: 'GPT-4.1 Nano',
    apiName: 'gpt-4.1-nano',
    contextWindow: 1047576,
    maxTokens: 32768,
    inputCostPerMillion: 0.10,
    outputCostPerMillion: 0.40,
    capabilities: {
      supportsJSON: true,
      supportsImages: false,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  },

  // GPT-5 models
  {
    provider: 'openai',
    name: 'GPT-5',
    apiName: 'gpt-5',
    contextWindow: 400000,
    maxTokens: 128000,
    inputCostPerMillion: 1.25,
    outputCostPerMillion: 10.00,
    capabilities: {
      supportsJSON: true,
      supportsImages: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: true
    }
  },
  {
    provider: 'openai',
    name: 'GPT-5 Mini',
    apiName: 'gpt-5-mini',
    contextWindow: 400000,
    maxTokens: 128000,
    inputCostPerMillion: 0.25,
    outputCostPerMillion: 2.00,
    capabilities: {
      supportsJSON: true,
      supportsImages: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: true
    }
  },
  {
    provider: 'openai',
    name: 'GPT-5 Nano',
    apiName: 'gpt-5-nano',
    contextWindow: 400000,
    maxTokens: 128000,
    inputCostPerMillion: 0.05,
    outputCostPerMillion: 0.40,
    capabilities: {
      supportsJSON: true,
      supportsImages: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: true
    }
  },

  // o3 models (reasoning)
  {
    provider: 'openai',
    name: 'o3',
    apiName: 'o3',
    contextWindow: 200000,
    maxTokens: 100000,
    inputCostPerMillion: 2.00,
    outputCostPerMillion: 8.00,
    capabilities: {
      supportsJSON: false,
      supportsImages: false,
      supportsFunctions: false,
      supportsStreaming: false,
      supportsThinking: true
    }
  },
  {
    provider: 'openai',
    name: 'o3 Pro',
    apiName: 'o3-pro',
    contextWindow: 200000,
    maxTokens: 100000,
    inputCostPerMillion: 20.00,
    outputCostPerMillion: 80.00,
    capabilities: {
      supportsJSON: false,
      supportsImages: false,
      supportsFunctions: false,
      supportsStreaming: false,
      supportsThinking: true
    }
  },

  // o3 deep research models
  {
    provider: 'openai',
    name: 'o3 Deep Research',
    apiName: 'o3-deep-research',
    contextWindow: 200000,
    maxTokens: 100000,
    inputCostPerMillion: 10.00,
    outputCostPerMillion: 40.00,
    capabilities: {
      supportsJSON: false,
      supportsImages: true,
      supportsFunctions: false,
      supportsStreaming: true,
      supportsThinking: true
    }
  },

  // o4 models (reasoning)
  {
    provider: 'openai',
    name: 'o4 Mini',
    apiName: 'o4-mini',
    contextWindow: 200000,
    maxTokens: 100000,
    inputCostPerMillion: 1.10,
    outputCostPerMillion: 4.40,
    capabilities: {
      supportsJSON: false,
      supportsImages: false,
      supportsFunctions: false,
      supportsStreaming: false,
      supportsThinking: true
    }
  },
  {
    provider: 'openai',
    name: 'o4 Mini Deep Research',
    apiName: 'o4-mini-deep-research',
    contextWindow: 200000,
    maxTokens: 100000,
    inputCostPerMillion: 2.00,
    outputCostPerMillion: 8.00,
    capabilities: {
      supportsJSON: false,
      supportsImages: true,
      supportsFunctions: false,
      supportsStreaming: true,
      supportsThinking: true
    }
  }
];

export const OPENAI_DEFAULT_MODEL = 'gpt-4.1';

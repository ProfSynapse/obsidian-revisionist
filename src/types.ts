// types.ts
import { AIProvider } from "./ai/models";

interface PluginSettings {
    provider: AIProvider;
    apiKeys: Record<AIProvider, string>;
    defaultModel: string;
    defaultTemperature: number;
    lmStudio: {
        port: number;
        modelName: string;
    };
}

interface RevisionRequest {
    text: string;
    instructions: string;
    model: string;
    temperature: number;
}

interface AIResponse {
    success: boolean;
    data?: string;
    error?: string;
}
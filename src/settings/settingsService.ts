import { AIProvider } from '../ai/models';

/**
 * Plugin settings interface
 */
export interface PluginSettings {
    provider: AIProvider;
    apiKeys: Record<AIProvider, string>;
    defaultModel: string;
    defaultTemperature: number;
    lmStudio: {
        port: string;
        modelName: string;
    };
}

/**
 * Default settings for the plugin
 */
export const DEFAULT_SETTINGS: PluginSettings = {
    provider: AIProvider.OpenRouter,
    apiKeys: {
        [AIProvider.OpenRouter]: '',
        [AIProvider.LMStudio]: ''  // LMStudio doesn't use API keys
    },
    defaultModel: 'anthropic/claude-3.5-sonnet',  // Default to Claude
    defaultTemperature: 0.7,
    lmStudio: {
        port: '1234',
        modelName: 'default'
    }
};

/**
 * Service for managing plugin settings
 */
export class SettingsService {
    private settings: PluginSettings;
    private plugin: any; // Reference to the plugin instance

    constructor(plugin: any) {
        this.plugin = plugin;
        this.settings = DEFAULT_SETTINGS;
    }

    /**
     * Load settings from Obsidian storage
     */
    async loadSettings(): Promise<void> {
        const loadedData = await this.plugin.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
    }

    /**
     * Save current settings to Obsidian storage
     */
    async saveSettings(): Promise<void> {
        await this.plugin.saveData(this.settings);
    }

    /**
     * Get current settings
     */
    getSettings(): PluginSettings {
        return this.settings;
    }

    /**
     * Update specific setting value
     */
    async updateSetting<K extends keyof PluginSettings>(
        key: K, 
        value: PluginSettings[K]
    ): Promise<void> {
        this.settings[key] = value;
        await this.saveSettings();
    }

    /**
     * Update nested setting value
     */
    async updateNestedSetting<K extends keyof PluginSettings, NK extends keyof PluginSettings[K]>(
        key: K,
        nestedKey: NK,
        value: PluginSettings[K][NK]
    ): Promise<void> {
        this.settings[key][nestedKey] = value;
        await this.saveSettings();
    }

    /**
     * Get API key for current provider
     */
    getApiKey(): string {
        return this.settings.apiKeys[this.settings.provider] || '';
    }

    /**
     * Set API key for specific provider
     */
    async setApiKey(provider: AIProvider, apiKey: string): Promise<void> {
        this.settings.apiKeys[provider] = apiKey;
        await this.saveSettings();
    }

    /**
     * Get LMStudio settings
     */
    getLMStudioSettings() {
        return this.settings.lmStudio;
    }

    /**
     * Update LMStudio settings
     */
    async updateLMStudioSettings(port: string, modelName: string): Promise<void> {
        this.settings.lmStudio = {
            port,
            modelName
        };
        await this.saveSettings();
    }

    /**
     * Get default model for current provider
     */
    getDefaultModel(): string {
        return this.settings.defaultModel;
    }

    /**
     * Get default temperature
     */
    getDefaultTemperature(): number {
        return this.settings.defaultTemperature;
    }

    /**
     * Reset settings to defaults
     */
    async resetSettings(): Promise<void> {
        this.settings = { ...DEFAULT_SETTINGS };
        await this.saveSettings();
    }
}
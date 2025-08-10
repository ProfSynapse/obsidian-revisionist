// src/settings/settingsTab.ts

import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import { AIProvider, SettingsService } from './settings';
import { ModelRegistry } from '../llm-adapter-kit/adapters/ModelRegistry';
import { ModelSpec } from '../llm-adapter-kit/adapters/modelTypes';
import { createAdapter } from '../llm-adapter-kit/adapters';

export class SettingTab extends PluginSettingTab {
    private settingsService: SettingsService;
    private plugin: any;

    constructor(app: App, plugin: any, settingsService: SettingsService) {
        super(app, plugin);
        this.plugin = plugin;
        this.settingsService = settingsService;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Remove the top-level heading
        this.addProviderSelection(containerEl);
        this.addProviderSpecificSettings(containerEl);
        this.addDefaultSettings(containerEl);
    }

    private addProviderSelection(containerEl: HTMLElement): void {
        const settings = this.settingsService.getSettings();

        new Setting(containerEl)
            .setName('AI provider')
            .setDesc('Select which AI provider to use')
            .addDropdown(dropdown => {
                Object.values(AIProvider).forEach(provider => {
                    dropdown.addOption(provider, this.getProviderDisplayName(provider));
                });
                
                dropdown
                    .setValue(settings.provider)
                    .onChange(async (value) => {
                        await this.settingsService.updateSetting('provider', value as AIProvider);
                        // Refresh the settings display to show provider-specific settings
                        this.display();
                    });
            });
    }

    private addProviderSpecificSettings(containerEl: HTMLElement): void {
        const settings = this.settingsService.getSettings();

        // Add API key setting for all providers
        this.addApiKeySettings(containerEl, settings.provider);
        
        // Add test connection button
        new Setting(containerEl)
            .addButton(button => {
                button
                    .setButtonText('Test connection')
                    .onClick(async () => {
                        await this.handleTestConnection(button);
                    });
            });
    }

    private async handleTestConnection(button: any) {
        button.setButtonText('Testing...');
        button.setDisabled(true);
        
        try {
            const success = await this.plugin.testConnection();
            if (success) {
                new Notice('Connection test successful!');
            } else {
                new Notice('Connection test failed. Please check your settings.');
            }
        } catch (error) {
            new Notice(`Connection test error: ${error.message}`);
        } finally {
            button.setButtonText('Test connection');
            button.setDisabled(false);
        }
    }

    private addApiKeySettings(containerEl: HTMLElement, provider: AIProvider): void {
        const settings = this.settingsService.getSettings();
        const providerInfo = this.getProviderInfo(provider);

        // API Key Setting
        new Setting(containerEl)
            .setName(`${providerInfo.name} API key`)
            .setDesc(`Enter your ${providerInfo.name} API key`)
            .addText(text => {
                text
                    .setPlaceholder('Enter API key')
                    .setValue(settings.apiKeys[provider])
                    .onChange(async (value) => {
                        await this.settingsService.setApiKey(provider, value);
                        // Immediately update the adapter with new key
                        this.plugin.updateAdapterConfig();
                    });
                text.inputEl.type = 'password';
            })
            .addExtraButton(button => {
                button
                    .setIcon('external-link')
                    .setTooltip('Get API key')
                    .onClick(() => {
                        window.open(providerInfo.keyUrl);
                    });
            });
    }

    private getProviderInfo(provider: AIProvider): { name: string; keyUrl: string } {
        const providerMap = {
            [AIProvider.OpenRouter]: { name: 'OpenRouter', keyUrl: 'https://openrouter.ai/keys' },
            [AIProvider.OpenAI]: { name: 'OpenAI', keyUrl: 'https://platform.openai.com/api-keys' },
            [AIProvider.Anthropic]: { name: 'Anthropic', keyUrl: 'https://console.anthropic.com/settings/keys' },
            [AIProvider.Google]: { name: 'Google Gemini', keyUrl: 'https://aistudio.google.com/app/apikey' },
            [AIProvider.Mistral]: { name: 'Mistral', keyUrl: 'https://console.mistral.ai/api-keys/' },
            [AIProvider.Groq]: { name: 'Groq', keyUrl: 'https://console.groq.com/keys' },
            [AIProvider.Perplexity]: { name: 'Perplexity', keyUrl: 'https://www.perplexity.ai/settings/api' },
            [AIProvider.Requesty]: { name: 'Requesty', keyUrl: 'https://requesty.ai/dashboard' }
        };
        return providerMap[provider] || { name: provider, keyUrl: '#' };
    }


    private addDefaultSettings(containerEl: HTMLElement): void {
        const settings = this.settingsService.getSettings();

        // Default Model Selection
        new Setting(containerEl)
            .setName('Default model')
            .setDesc('Select the default model to use')
            .addDropdown(dropdown => {
                try {
                    const providerName = settings.provider.toLowerCase();
                    const models = ModelRegistry.getProviderModels(providerName);
                    
                    models.forEach(model => {
                        dropdown.addOption(model.apiName, model.name);
                    });
                    
                    dropdown
                        .setValue(settings.defaultModel)
                        .onChange(async (value) => {
                            await this.settingsService.updateSetting('defaultModel', value);
                        });
                } catch (error) {
                    console.warn('Failed to load models for provider:', settings.provider, error);
                }
            });

        // Default Temperature Setting
        new Setting(containerEl)
            .setName('Default temperature')
            .setDesc('Set the default temperature for the AI model (0.0 - 1.0)')
            .addSlider(slider => {
                slider
                    .setLimits(0, 1, 0.05)
                    .setValue(settings.defaultTemperature)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        await this.settingsService.updateSetting('defaultTemperature', value);
                    });
            });
    }


    private getProviderDisplayName(provider: AIProvider): string {
        const displayNames: Record<AIProvider, string> = {
            [AIProvider.OpenRouter]: 'OpenRouter',
            [AIProvider.OpenAI]: 'OpenAI',
            [AIProvider.Anthropic]: 'Anthropic (Claude)',
            [AIProvider.Google]: 'Google (Gemini)',
            [AIProvider.Mistral]: 'Mistral',
            [AIProvider.Groq]: 'Groq',
            [AIProvider.Perplexity]: 'Perplexity',
            [AIProvider.Requesty]: 'Requesty'
        };
        return displayNames[provider] || provider;
    }
}

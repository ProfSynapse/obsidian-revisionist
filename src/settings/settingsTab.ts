// src/settings/settingsTab.ts

import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import { AIProvider, AIModelMap } from '../ai/models';
import { SettingsService } from './settings';

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

        containerEl.createEl('h2', { text: 'Revisionist' });

        this.addProviderSelection(containerEl);
        this.addProviderSpecificSettings(containerEl);
        this.addDefaultSettings(containerEl);
    }

    private addProviderSelection(containerEl: HTMLElement): void {
        const settings = this.settingsService.getSettings();

        new Setting(containerEl)
            .setName('AI Provider')
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

        if (settings.provider === AIProvider.OpenRouter) {
            this.addOpenRouterSettings(containerEl);
        } else if (settings.provider === AIProvider.LMStudio) {
            this.addLMStudioSettings(containerEl);
        }
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
            button.setButtonText('Test Connection');
            button.setDisabled(false);
        }
    }

    private addOpenRouterSettings(containerEl: HTMLElement): void {
        const settings = this.settingsService.getSettings();

        // API Key Setting
        new Setting(containerEl)
            .setName('OpenRouter API Key')
            .setDesc('Enter your OpenRouter API key')
            .addText(text => {
                text
                    .setPlaceholder('Enter API key')
                    .setValue(settings.apiKeys[AIProvider.OpenRouter])
                    .onChange(async (value) => {
                        await this.settingsService.setApiKey(AIProvider.OpenRouter, value);
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
                        window.open('https://openrouter.ai/keys');
                    });
            });

        // Add test connection button
        new Setting(containerEl)
            .addButton(button => {
                button
                    .setButtonText('Test Connection')
                    .onClick(async () => {
                        await this.handleTestConnection(button);
                    });
            });
    }

    private addLMStudioSettings(containerEl: HTMLElement): void {
        const settings = this.settingsService.getSettings();

        // Port Setting
        new Setting(containerEl)
            .setName('LM Studio Port')
            .setDesc('Enter the port number for your local LM Studio instance')
            .addText(text => {
                text
                    .setPlaceholder('1234')
                    .setValue(settings.lmStudio.port)
                    .onChange(async (value) => {
                        await this.settingsService.updateLMStudioSettings(
                            value,
                            settings.lmStudio.modelName
                        );
                    });
            });

        // Model Name Setting
        new Setting(containerEl)
            .setName('Model Name')
            .setDesc('Enter the name of your local model')
            .addText(text => {
                text
                    .setPlaceholder('Model name')
                    .setValue(settings.lmStudio.modelName)
                    .onChange(async (value) => {
                        await this.settingsService.updateLMStudioSettings(
                            settings.lmStudio.port,
                            value
                        );
                    });
            });

        // Add test connection button
        new Setting(containerEl)
            .addButton(button => {
                button
                    .setButtonText('Test Connection')
                    .onClick(async () => {
                        await this.handleTestConnection(button);
                    });
            });
    }

    private addDefaultSettings(containerEl: HTMLElement): void {
        const settings = this.settingsService.getSettings();

        // Default Model Selection (for OpenRouter)
        if (settings.provider === AIProvider.OpenRouter) {
            new Setting(containerEl)
                .setName('Default Model')
                .setDesc('Select the default model to use')
                .addDropdown(dropdown => {
                    const models = AIModelMap[AIProvider.OpenRouter];
                    models.forEach(model => {
                        dropdown.addOption(model.apiName, model.name);
                    });
                    
                    dropdown
                        .setValue(settings.defaultModel)
                        .onChange(async (value) => {
                            await this.settingsService.updateSetting('defaultModel', value);
                        });
                });
        }

        // Default Temperature Setting
        new Setting(containerEl)
            .setName('Default Temperature')
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
            [AIProvider.LMStudio]: 'LM Studio (Local)'
        };
        return displayNames[provider] || provider;
    }
}
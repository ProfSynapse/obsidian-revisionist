// src/ui/revisionModal.ts

import { App, Modal, Setting, TextAreaComponent, DropdownComponent, ButtonComponent, Notice } from 'obsidian';
import { AIProvider, AIModelMap } from '../ai/models';
import { SettingsService } from '../settings/settings';
import { CONFIG, SuggestionPrompt } from '../config'; // Import CONFIG and SuggestionPrompt

interface RevisionModalResult {
    instructions: string;
    model: string;
    temperature: number;
    selectedText: string;
    fullNoteContent: string;  // Add this field
}

export class RevisionModal extends Modal {
    private result: RevisionModalResult;
    private instructionsEl: TextAreaComponent;
    private modelDropdown: DropdownComponent;
    private temperatureSlider: HTMLInputElement;
    private temperatureText: HTMLInputElement;

    constructor(
        app: App,
        private settingsService: SettingsService,
        private selectedText: string,
        private fullNoteContent: string,  // Add this parameter
        private onSubmit: (result: RevisionModalResult) => void
    ) {
        super(app);

        const settings = this.settingsService.getSettings();
        this.result = {
            instructions: '',
            model: settings.defaultModel,
            temperature: settings.defaultTemperature,
            selectedText: this.selectedText,
            fullNoteContent: this.fullNoteContent  // Store it in result
        };
    }

    onOpen() {
        const { contentEl } = this;

        // Modal title
        contentEl.createEl('h2', { text: 'Revise text' });

        // Quick prompt buttons
        const quickButtonsSection = contentEl.createDiv({ cls: 'quick-buttons-grid' });
        CONFIG.SUGGESTION_PROMPTS.forEach((prompt: SuggestionPrompt) => { // Specify type for prompt
            const buttonContainer = quickButtonsSection.createDiv({ cls: 'quick-button-container' });
            const button = new ButtonComponent(buttonContainer)
                .setClass('quick-button')
                .setClass('mod-cta')  // Add Obsidian's native button class
                .setButtonText(prompt.type.charAt(0).toUpperCase() + prompt.type.slice(1))
                .onClick(() => {
                    this.result.instructions = prompt.prompt;
                    this.onSubmit(this.result);
                    this.close();
                });

            // Set button style using CSS variables
            button.buttonEl.style.setProperty('--background-modifier-success', prompt.color);
            
            // Add icon with proper spacing
            const iconSpan = button.buttonEl.createSpan({
                cls: 'quick-button-icon',
                text: prompt.icon
            });
            button.buttonEl.insertBefore(iconSpan, button.buttonEl.firstChild);
        });

        // Instructions input
        const instructionsSection = contentEl.createDiv({ cls: 'revision-instructions' });
        new Setting(instructionsSection)
            .setName('Revision instructions')
            .setDesc('How would you like the text to be revised?')
            .addTextArea(text => {
                this.instructionsEl = text;
                text.setPlaceholder('Enter your instructions here...')
                    .setValue(this.result.instructions)
                    .onChange(value => {
                        this.result.instructions = value;
                    });
                text.inputEl.rows = 4;
            });

        // Model selection (only for OpenRouter)
        const settings = this.settingsService.getSettings();
        if (settings.provider === AIProvider.OpenRouter) {
            new Setting(contentEl)
                .setName('AI model')
                .setDesc('Select the model to use for revision')
                .addDropdown(dropdown => {
                    this.modelDropdown = dropdown;
                    const models = AIModelMap[AIProvider.OpenRouter];
                    models.forEach(model => {
                        dropdown.addOption(model.apiName, model.name);
                    });
                    dropdown
                        .setValue(this.result.model)
                        .onChange(value => {
                            this.result.model = value;
                        });
                });
        }

        // Temperature control
        new Setting(contentEl)
            .setName('Temperature')
            .setDesc('Higher values make the output more creative, lower values make it more consistent')
            .addSlider(slider => {
                slider
                    .setLimits(0, 1, 0.05)
                    .setValue(this.result.temperature)
                    .setDynamicTooltip()
                    .onChange(value => {
                        this.result.temperature = value;
                    });
            });

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'button-container' });
        
        new ButtonComponent(buttonContainer)
            .setButtonText('Submit')
            .setCta()
            .onClick(() => {
                if (!this.validateInput()) {
                    return;
                }
                this.onSubmit(this.result);
                this.close();
            });

        new ButtonComponent(buttonContainer)
            .setButtonText('Cancel')
            .onClick(() => {
                this.close();
            });

        // Focus instructions field
        this.instructionsEl.inputEl.focus();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private validateInput(): boolean {
        if (!this.result.instructions.trim()) {
            new Notice('Please enter revision instructions');
            return false;
        }
        return true;
    }
}

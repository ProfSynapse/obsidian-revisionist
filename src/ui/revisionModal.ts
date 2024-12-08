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
        contentEl.createEl('h2', { text: 'Revise Text' });

        // Quick prompt buttons
        const quickButtonsSection = contentEl.createDiv({ cls: 'quick-buttons' });
        CONFIG.SUGGESTION_PROMPTS.forEach((prompt: SuggestionPrompt) => { // Specify type for prompt
            const buttonContainer = quickButtonsSection.createDiv();
            const button = new ButtonComponent(buttonContainer)
                .setClass('quick-button')
                .setButtonText(prompt.type.toUpperCase())
                .onClick(() => {
                    this.result.instructions = prompt.prompt;
                    this.onSubmit(this.result);
                    this.close();
                });

            // Set button style
            button.buttonEl.style.backgroundColor = prompt.color;
            button.buttonEl.style.color = 'white';
            
            // Add icon
            button.buttonEl.createSpan({
                cls: 'quick-button-icon',
                text: prompt.icon
            });
        });

        // Instructions input
        const instructionsSection = contentEl.createDiv({ cls: 'revision-instructions' });
        new Setting(instructionsSection)
            .setName('Revision Instructions')
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
                .setName('AI Model')
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
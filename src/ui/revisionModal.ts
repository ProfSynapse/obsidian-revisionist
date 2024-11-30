import { App, Modal, Setting, TextAreaComponent, DropdownComponent, Notice } from 'obsidian';
import { AIProvider, AIModelMap } from '../ai/models';
import { SettingsService } from '../settings/settingsService';

interface RevisionModalResult {
    instructions: string;
    model: string;
    temperature: number;
    selectedText: string;
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
        private onSubmit: (result: RevisionModalResult) => void
    ) {
        super(app);

        const settings = this.settingsService.getSettings();
        this.result = {
            instructions: '',
            model: settings.defaultModel,
            temperature: settings.defaultTemperature,
            selectedText: this.selectedText
        };
    }

    onOpen() {
        const { contentEl } = this;

        // Modal title
        contentEl.createEl('h2', { text: 'Revise Text' });

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
        const temperatureContainer = contentEl.createDiv({ cls: 'temperature-control' });
        new Setting(temperatureContainer)
            .setName('Temperature')
            .setDesc('Higher values make the output more creative, lower values make it more consistent')
            .addSlider(slider => {
                this.temperatureSlider = slider.sliderEl;
                slider
                    .setLimits(0, 1, 0.1)
                    .setValue(this.result.temperature)
                    .setDynamicTooltip()
                    .onChange(value => {
                        this.result.temperature = value;
                        if (this.temperatureText) {
                            this.temperatureText.value = value.toString();
                        }
                    });
            })
            .addText(text => {
                this.temperatureText = text.inputEl;
                text
                    .setValue(this.result.temperature.toString())
                    .onChange(value => {
                        const temp = parseFloat(value);
                        if (!isNaN(temp) && temp >= 0 && temp <= 1) {
                            this.result.temperature = temp;
                            if (this.temperatureSlider) {
                                this.temperatureSlider.value = temp.toString();
                            }
                        }
                    });
            });

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'button-container' });
        
        // Submit button
        const submitButton = buttonContainer.createEl('button', { 
            text: 'Submit',
            cls: 'mod-cta'
        });
        submitButton.addEventListener('click', () => {
            if (!this.validateInput()) {
                return;
            }
            this.onSubmit(this.result);
            this.close();
        });

        // Cancel button
        const cancelButton = buttonContainer.createEl('button', { 
            text: 'Cancel'
        });
        cancelButton.addEventListener('click', () => {
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
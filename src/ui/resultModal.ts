import { App, Modal, TextAreaComponent, Editor, Notice } from 'obsidian';

interface ResultModalProps {
    originalText: string;
    revisedText: string;
    editor: Editor;
    onRetry: () => void;
    cost?: {
        total: number;
        input: number;
        output: number;
    };
}

export class ResultModal extends Modal {
    private revisedTextArea: TextAreaComponent;

    constructor(
        app: App,
        private props: ResultModalProps
    ) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('result-modal');

        // Modal title
        contentEl.createEl('h2', { text: 'Review Revised Text' });
        
        // Create container for revised text
        const revisedSection = contentEl.createDiv({ cls: 'text-section' });
        revisedSection.createEl('h3', { text: 'Revised Text' });
        
        // Create editable textarea for revised text
        this.revisedTextArea = new TextAreaComponent(revisedSection);
        this.revisedTextArea
            .setValue(this.props.revisedText)
            .setPlaceholder('Revised text will appear here...');
        this.revisedTextArea.inputEl.classList.add('revised-textarea');

        // Add cost information if available
        if (this.props.cost) {
            const costInfo = contentEl.createDiv({ cls: 'cost-info' });
            costInfo.createEl('span', { 
                text: `Cost: $${this.props.cost.total.toFixed(4)} (Input: $${this.props.cost.input.toFixed(4)}, Output: $${this.props.cost.output.toFixed(4)})` 
            });
        }

        // Create button container
        const buttonContainer = contentEl.createDiv({ cls: 'button-container' });

        // Apply button
        const applyButton = this.createButton(buttonContainer, 'Apply', 'mod-cta', () => {
            this.applyChanges();
        });

        // Copy button
        const copyButton = this.createButton(buttonContainer, 'Copy to Clipboard', '', () => {
            this.copyToClipboard();
        });

        // Retry button
        const retryButton = this.createButton(buttonContainer, 'Retry', '', () => {
            this.close();
            this.props.onRetry();
        });

        // Cancel button
        const cancelButton = this.createButton(buttonContainer, 'Cancel', '', () => {
            this.close();
        });
    }

    private createButton(container: HTMLElement, text: string, cls: string, onClick: () => void): HTMLButtonElement {
        const button = container.createEl('button', { text });
        if (cls) button.addClass(cls);
        button.addEventListener('click', onClick);
        return button;
    }

    private applyChanges() {
        const revisedText = this.revisedTextArea.getValue();
        this.props.editor.replaceSelection(revisedText);
        new Notice('Text replaced successfully');
        this.close();
    }

    private async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.revisedTextArea.getValue());
            new Notice('Copied to clipboard');
        } catch (error) {
            new Notice('Failed to copy to clipboard');
            console.error('Failed to copy:', error);
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
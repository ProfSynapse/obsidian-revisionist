import { App, Modal, TextAreaComponent, Editor, Notice } from 'obsidian';

interface ResultModalProps {
    originalText: string;
    revisedText: string;
    editor: Editor;
    onRetry: () => void;
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

        // Modal title
        contentEl.createEl('h2', { text: 'Review Revised Text' });

        // Create comparison container
        const comparisonContainer = contentEl.createDiv({ cls: 'comparison-container' });

        // Original text section
        const originalSection = comparisonContainer.createDiv({ cls: 'text-section' });
        originalSection.createEl('h3', { text: 'Original Text' });
        const originalTextEl = originalSection.createEl('div', {
            cls: 'text-content',
            text: this.props.originalText
        });

        // Revised text section
        const revisedSection = comparisonContainer.createDiv({ cls: 'text-section' });
        revisedSection.createEl('h3', { text: 'Revised Text (Editable)' });
        
        // Create editable textarea for revised text
        this.revisedTextArea = new TextAreaComponent(revisedSection);
        this.revisedTextArea
            .setValue(this.props.revisedText)
            .setPlaceholder('Revised text will appear here...');
        this.revisedTextArea.inputEl.rows = 8;
        this.revisedTextArea.inputEl.classList.add('revised-textarea');

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
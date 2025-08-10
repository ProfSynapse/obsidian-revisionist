// main.ts
import { 
    Plugin, 
    Editor,
    Menu,
    Notice,
    MarkdownView
} from 'obsidian';

import { SettingsService } from './settings/settings';
import { SettingTab } from './settings/settingsTab';
import { RevisionModal } from './ui/revisionModal';
import { ResultModal } from './ui/resultModal';
import { createAdapter } from './llm-adapter-kit/adapters';
import { SupportedProvider, LLMResponse, GenerateOptions } from './llm-adapter-kit/adapters/types';
import { ModelRegistry } from './llm-adapter-kit/adapters/ModelRegistry';
import { ModelSpec } from './llm-adapter-kit/adapters/modelTypes';
import { BaseAdapter } from './llm-adapter-kit/adapters/BaseAdapter';
import { AIProvider } from './settings/settings';

export default class AIRevisionPlugin extends Plugin {
    private settingsService: SettingsService;
    private aiAdapter: BaseAdapter;

    async onload() {
        // Initialize services
        this.settingsService = new SettingsService(this);
        await this.settingsService.loadSettings();
        
        // Initialize AI adapter based on settings
        this.initializeAIAdapter();

        // Add settings tab
        this.addSettingTab(new SettingTab(
            this.app,
            this,
            this.settingsService
        ));

        // Add ribbon icon for mobile-friendly access
        this.addRibbonIcon('wand-2', 'Revise selected text', () => {
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeView?.editor) {
                const selectedText = activeView.editor.getSelection();
                if (selectedText) {
                    this.handleRevisionRequest(activeView.editor);
                } else {
                    new Notice('Please select text to revise');
                }
            }
        });

        // Add command to command palette
        this.addCommand({
            id: 'revise-text',
            name: 'Revise selected text',
            editorCallback: (editor: Editor) => {
                this.handleRevisionRequest(editor);
            }
        });

        // Register context menu event
        this.registerEvent(
            this.app.workspace.on(
                "editor-menu",
                (menu: Menu, editor: Editor) => {
                    // Only add menu item if text is selected
                    if (editor.getSelection()) {
                        menu.addItem((item) => {
                            item
                                .setTitle("Revise with AI")
                                .setIcon("wand-2")
                                .onClick(() => {
                                    this.handleRevisionRequest(editor);
                                });
                        });
                    }
                }
            )
        );
    }

    /**
     * Initialize or reinitialize the AI adapter based on current settings
     */
    private initializeAIAdapter() {
        const settings = this.settingsService.getSettings();
        
        // Clean up existing adapter if needed
        if (this.aiAdapter) {
        }

        try {
            // Create new adapter based on provider
            const providerName = settings.provider.toLowerCase() as SupportedProvider;
            this.aiAdapter = createAdapter(providerName, settings.defaultModel);
            
            // Configure the adapter with API key if needed
            if (settings.apiKeys[settings.provider]) {
                // Set API key in environment for the adapter to pick up
                this.configureAdapter(settings.provider as AIProvider, settings.apiKeys[settings.provider]);
            }
        } catch (error) {
            new Notice('Failed to initialize AI provider. Check console for details.');
        }
    }

    /**
     * Configure adapter with API key
     */
    private configureAdapter(provider: AIProvider, apiKey: string) {
        // Set API key in the adapter's config
        if (this.aiAdapter && 'apiKey' in this.aiAdapter) {
            (this.aiAdapter as any).apiKey = apiKey;
        }
    }

    /**
     * Update adapter configuration with current settings
     */
    updateAdapterConfig() {
        const settings = this.settingsService.getSettings();
        
        if (!this.aiAdapter) {
            this.initializeAIAdapter();
            return;
        }

        // Update API key for current provider
        if (settings.apiKeys[settings.provider]) {
            this.configureAdapter(settings.provider as AIProvider, settings.apiKeys[settings.provider]);
        }
    }

    /**
     * Check if adapter is available
     */
    private async isAdapterReady(): Promise<boolean> {
        if (!this.aiAdapter) return false;
        try {
            return await this.aiAdapter.isAvailable();
        } catch (error) {
            return false;
        }
    }

    /**
     * Calculate approximate cost based on token usage and model rates
     */
    private calculateApproximateCost(tokens: { input: number; output: number }, modelName: string): { input: number; output: number; total: number } | undefined {
        try {
            // Use ModelRegistry to get model info
            const models = ModelRegistry.getLatestModels();
            const model = models.find(m => m.apiName === modelName || m.name === modelName);
            
            if (!model) {
                return undefined;
            }

            const inputCost = (tokens.input / 1_000_000) * model.inputCostPerMillion;
            const outputCost = (tokens.output / 1_000_000) * model.outputCostPerMillion;
            
            return {
                input: inputCost,
                output: outputCost,
                total: inputCost + outputCost
            };
        } catch (error) {
            console.warn('Failed to calculate cost:', error);
            return undefined;
        }
    }

    /**
     * Helper function to count words in text
     */
    private countWords(text: string): number {
        return text.trim().split(/\s+/).length;
    }

    /**
     * Handle the text revision request from either command palette or context menu
     */
    private async handleRevisionRequest(editor: Editor) {
        const selectedText = editor.getSelection();
        const fullNoteContent = editor.getValue();  // Get full note content
        
        if (!selectedText) {
            new Notice('Please select text to revise');
            return;
        }

        const wordCount = this.countWords(selectedText);
        const WORD_LIMIT = 800;

        if (wordCount > WORD_LIMIT) {
            new Notice(`Warning: Selected text is ${wordCount} words. The AI may struggle with more than ${WORD_LIMIT} words at once. Consider selecting a smaller portion.`, 10000);
        }

        // Check if adapter is ready
        if (!(await this.isAdapterReady())) {
            new Notice('AI provider is not properly configured. Please check settings.');
            return;
        }

        // Show revision modal
        const revisionModal = new RevisionModal(
            this.app,
            this.settingsService,
            selectedText,
            fullNoteContent,  // Pass full note content
            async (result) => {
                try {
                    new Notice('Generating revision...');
                    
                    // Create the prompt with context
                    const contextualPrompt = `Based on the following note content and selected text, ${result.instructions}

Full note content:
${fullNoteContent}

Selected text to revise:
${selectedText}

Please provide only the revised version of the selected text.`;

                    const generateOptions: GenerateOptions = {
                        model: result.model,
                        temperature: result.temperature,
                        maxTokens: 4096
                    };

                    const response: LLMResponse = await this.aiAdapter.generate(contextualPrompt, generateOptions);

                    // Calculate cost if tokens are available
                    const cost = response.usage ? 
                        this.calculateApproximateCost({
                            input: response.usage.promptTokens,
                            output: response.usage.completionTokens
                        }, result.model) : 
                        undefined;

                    // Show result modal with cost
                    new ResultModal(
                        this.app,
                        {
                            originalText: selectedText,
                            revisedText: response.text,
                            editor: editor,
                            onRetry: () => {
                                this.handleRevisionRequest(editor);
                            },
                            cost: cost
                        }
                    ).open();

                } catch (error) {
                    new Notice(`Error: ${error.message}`);
                }
            }
        );

        revisionModal.open();
    }

    /**
     * Test the connection to the current AI provider
     */
    async testConnection(): Promise<boolean> {
        return await this.isAdapterReady();
    }

    async onunload() {
        // Cleanup
    }
}

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
import { OpenRouterAdapter } from './ai/openRouter';
import { LMStudioAdapter } from './ai/lmStudio';
import { BaseAdapter } from './ai/baseAdapter';
import { AIProvider, AIModelUtils } from './ai/models';

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
        this.addRibbonIcon('wand-2', 'Revise Selected Text', () => {
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
            name: 'Revise Selected Text',
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
        console.log('Initializing AI adapter with provider:', settings.provider);
        
        // Clean up existing adapter if needed
        if (this.aiAdapter) {
            console.log('Cleaning up existing adapter');
        }

        try {
            // Create new adapter based on provider
            switch (settings.provider) {
                case AIProvider.OpenRouter:
                    console.log('Creating OpenRouter adapter');
                    this.aiAdapter = new OpenRouterAdapter();
                    if (!settings.apiKeys[AIProvider.OpenRouter]) {
                        console.warn('OpenRouter API key is not set');
                    }
                    this.aiAdapter.setApiKey(settings.apiKeys[AIProvider.OpenRouter]);
                    break;
                case AIProvider.LMStudio:
                    console.log('Creating LMStudio adapter');
                    this.aiAdapter = new LMStudioAdapter();
                    this.aiAdapter.configure({
                        port: settings.lmStudio.port,
                        modelName: settings.lmStudio.modelName
                    });
                    break;
                default:
                    console.error('Unknown provider:', settings.provider);
                    return;
            }
            console.log('AI adapter initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AI adapter:', error);
            new Notice('Failed to initialize AI provider. Check console for details.');
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

        if (settings.provider === AIProvider.OpenRouter) {
            this.aiAdapter.setApiKey(settings.apiKeys[AIProvider.OpenRouter]);
        } else if (settings.provider === AIProvider.LMStudio) {
            this.aiAdapter.configure({
                port: settings.lmStudio.port,
                modelName: settings.lmStudio.modelName
            });
        }
    }

    /**
     * Calculate approximate cost based on token usage and model rates
     */
    private calculateApproximateCost(tokens: { input: number; output: number }, modelName: string): { input: number; output: number; total: number } | undefined {
        const model = AIModelUtils.getModelByApiName(modelName);
        if (!model || !model.inputCostPer1M || !model.outputCostPer1M) {
            return undefined;
        }

        const inputCost = (tokens.input / 1_000_000) * model.inputCostPer1M;
        const outputCost = (tokens.output / 1_000_000) * model.outputCostPer1M;
        
        return {
            input: inputCost,
            output: outputCost,
            total: inputCost + outputCost
        };
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
        if (!this.aiAdapter.isReady()) {
            new Notice('AI provider is not properly configured. Please check settings.');
            return;
        }

        // Show revision modal
        const revisionModal = new RevisionModal(
            this.app,
            this.settingsService,
            selectedText,
            async (result) => {
                try {
                    new Notice('Generating revision...');
                    
                    const response = await this.aiAdapter.generateResponse(
                        result.instructions,
                        result.model,
                        {
                            temperature: result.temperature,
                            maxTokens: 4096,
                            selectedText: selectedText
                        }
                    );

                    if (!response.success) {
                        throw new Error(response.error || 'Failed to generate revision');
                    }

                    // Calculate cost if tokens are available
                    const cost = response.tokens ? 
                        this.calculateApproximateCost(response.tokens, result.model) : 
                        undefined;

                    // Show result modal with cost
                    new ResultModal(
                        this.app,
                        {
                            originalText: selectedText,
                            revisedText: response.data as string,
                            editor: editor,
                            onRetry: () => {
                                this.handleRevisionRequest(editor);
                            },
                            cost: cost  // Simply pass the cost object without the isApproximate flag
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
        console.log('Testing connection to AI provider');
        if (!this.aiAdapter) {
            console.error('No AI adapter initialized');
            return false;
        }
        return this.aiAdapter.testConnection();
    }

    async onunload() {
        // Cleanup
    }
}
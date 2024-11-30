// main.ts
import { 
    Plugin, 
    Editor,
    Menu,
    Notice
} from 'obsidian';

import { SettingsService } from './settings/settingsService';
import { SettingTab } from './settings/settingsTab';
import { RevisionModal } from './ui/revisionModal';
import { ResultModal } from './ui/resultModal';
import { OpenRouterAdapter } from './ai/openRouter';
import { LMStudioAdapter } from './ai/lmStudio';
import { BaseAdapter } from './ai/baseAdapter';
import { AIProvider } from './ai/models';

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
        
        // Clean up existing adapter if needed
        if (this.aiAdapter) {
            // Any cleanup needed
        }

        // Create new adapter based on provider
        switch (settings.provider) {
            case AIProvider.OpenRouter:
                this.aiAdapter = new OpenRouterAdapter();
                this.aiAdapter.setApiKey(settings.apiKeys[AIProvider.OpenRouter]);
                break;
            case AIProvider.LMStudio:
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
                            maxTokens: 2000  // Reasonable default
                        }
                    );

                    if (!response.success) {
                        throw new Error(response.error || 'Failed to generate revision');
                    }

                    // Show result modal
                    new ResultModal(
                        this.app,
                        {
                            originalText: selectedText,
                            revisedText: response.data as string,
                            editor: editor,
                            onRetry: () => {
                                // Reopen revision modal
                                this.handleRevisionRequest(editor);
                            }
                        }
                    ).open();

                } catch (error) {
                    console.error('Error in revision process:', error);
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
        return this.aiAdapter.testConnection();
    }

    async onunload() {
        // Cleanup
    }
}
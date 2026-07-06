import React, { useState, useCallback, useEffect } from 'react';
import { Sparkles, Settings } from 'lucide-react';
import AISettingsModal from './AISettingsModal';
import AIAssistantPanel from './AIAssistantPanel';
import { hasAIConfigured } from '../../lib/aiConfig';

interface Props {
  /** Callback to insert AI-generated text at the cursor position in the Tiptap editor */
  onInsertText: (text: string) => void;
  /** Currently selected text in the editor (for context-aware AI actions) */
  selectedText?: string;
}

/**
 * AIEditorToolbar – Orchestrates the AI settings modal and assistant panel.
 * This component renders the floating AI trigger button and manages
 * the open/close state for both the settings and assistant panels.
 */
export default function AIEditorToolbar({ onInsertText, selectedText }: Props) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const isConfigured = hasAIConfigured();

  const handleAIClick = useCallback(() => {
    if (!isConfigured) {
      setIsSettingsOpen(true);
    } else {
      setIsAssistantOpen(true);
    }
  }, [isConfigured]);

  // Listen for custom event from BubbleMenu AI button
  useEffect(() => {
    const handler = () => handleAIClick();
    window.addEventListener('open-ai-assistant', handler);
    return () => window.removeEventListener('open-ai-assistant', handler);
  }, [handleAIClick]);

  const handleOpenSettings = useCallback(() => {
    setIsAssistantOpen(false);
    setIsSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  return (
    <>
      {/* Floating AI trigger button */}
      <button
        type="button"
        onClick={handleAIClick}
        data-ai-trigger
        className="fixed bottom-6 right-6 z-[80] flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 group"
        title="Asistente de IA"
      >
        <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
        <span className="text-sm font-semibold">Asistente IA</span>
      </button>

      {/* Settings Modal */}
      <AISettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
      />

      {/* Assistant Panel */}
      <AIAssistantPanel
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onInsert={onInsertText}
        onOpenSettings={handleOpenSettings}
        selectedText={selectedText}
      />
    </>
  );
}

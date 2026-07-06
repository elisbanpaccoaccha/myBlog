import React, { useState, useRef, useEffect, useCallback } from 'react';
import EditorWYSIWYG from './EditorWYSIWYG';
import AIEditorToolbar from './AIEditorToolbar';
import { useAI } from '../../lib/useAI';
import { hasAIConfigured } from '../../lib/aiConfig';
import { marked } from 'marked';

interface Props {
  initialContent?: string;
}

/**
 * EditorWithAI – Wrapper that combines the WYSIWYG editor with AI capabilities.
 * Manages the bridge between editor selection state and the AI assistant panel.
 */
export default function EditorWithAI({ initialContent = '' }: Props) {
  const [selectedText, setSelectedText] = useState('');
  const editorRef = useRef<any>(null);
  const { generate } = useAI();

  const handleInsertText = useCallback((text: string) => {
    editorRef.current?.chain().focus().insertContent(text).run();
  }, []);

  const handleInlineAIRequest = useCallback(async (prompt: string) => {
    if (!hasAIConfigured()) {
      const btn = document.querySelector('[data-ai-trigger]') as HTMLButtonElement;
      btn?.click();
      return;
    }

    const editor = editorRef.current;
    if (!editor) return;

    let fullText = '';
    const startPos = editor.state.selection.from;
    
    // Disable editing during generation to prevent cursor interference
    editor.setEditable(false);

    try {
      await generate(prompt, {
        systemPrompt: "Eres un asistente de redacción para un blog. Escribe el contenido solicitado directamente. Usa formato Markdown para negritas, listas y bloques de código. Responde SOLO con el texto, sin introducciones ni frases como 'Aquí tienes'.",
        onToken: (token) => {
          fullText += token;
          editor.commands.insertContent(token);
        }
      });
      
      // When generation completes, replace the raw markdown stream with rich HTML
      const endPos = editor.state.selection.to;
      const html = await marked.parse(fullText);
      editor.chain().deleteRange({ from: startPos, to: endPos }).insertContent(html).run();
      
    } catch (err) {
      console.error("AI Generation Error:", err);
    } finally {
      editor.setEditable(true);
    }
  }, [generate]);

  // Listen for the custom event dispatched from the BubbleMenu AI button
  useEffect(() => {
    const handler = () => {
      // The AI toolbar will handle opening the assistant
      const btn = document.querySelector('[data-ai-trigger]') as HTMLButtonElement;
      btn?.click();
    };
    window.addEventListener('open-ai-assistant', handler);
    return () => window.removeEventListener('open-ai-assistant', handler);
  }, []);

  return (
    <>
      <EditorWYSIWYG
        initialContent={initialContent}
        onSelectedTextChange={setSelectedText}
        onInlineAIRequest={handleInlineAIRequest}
        editorRef={editorRef}
      />
      <AIEditorToolbar
        onInsertText={handleInsertText}
        selectedText={selectedText}
      />
    </>
  );
}

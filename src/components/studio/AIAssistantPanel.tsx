import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  X,
  Send,
  Copy,
  ClipboardPaste,
  Loader2,
  StopCircle,
  Wand2,
  FileText,
  Pen,
  RotateCcw,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { useAI } from '../../lib/useAI';
import { hasAIConfigured, getAIConfig, PROVIDER_DEFAULTS } from '../../lib/aiConfig';
import { marked } from 'marked';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
  onOpenSettings: () => void;
  selectedText?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_ACTIONS = [
  { id: 'improve', label: 'Mejorar redacción', icon: <Wand2 className="w-3.5 h-3.5" />, prompt: 'Mejora la redacción del siguiente texto, haciéndolo más claro, fluido y profesional. Devuelve solo el texto mejorado, sin explicaciones:' },
  { id: 'summarize', label: 'Resumir', icon: <FileText className="w-3.5 h-3.5" />, prompt: 'Resume el siguiente texto en un párrafo conciso. Devuelve solo el resumen:' },
  { id: 'rewrite', label: 'Reescribir', icon: <Pen className="w-3.5 h-3.5" />, prompt: 'Reescribe el siguiente texto con un estilo diferente pero conservando el significado. Devuelve solo el texto reescrito:' },
  { id: 'continue', label: 'Continuar escribiendo', icon: <RotateCcw className="w-3.5 h-3.5" />, prompt: 'Continúa escribiendo a partir del siguiente texto, manteniendo el mismo tono y estilo. Escribe 2-3 párrafos más:' },
];

const SYSTEM_PROMPT = `Eres un asistente de redacción para un blog. Tu objetivo es ayudar al autor a escribir contenido de alta calidad. Responde siempre en español. Usa formato Markdown (negritas, listas, cursivas, bloques de código, encabezados) cuando sea necesario para estructurar la respuesta. Sé conciso y directo. Devuelve el texto limpio, listo para insertar.`;

export default function AIAssistantPanel({ isOpen, onClose, onInsert, onOpenSettings, selectedText }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { generate, isLoading, error, abort } = useAI();

  const isConfigured = hasAIConfigured();
  const config = getAIConfig();
  const providerLabel = PROVIDER_DEFAULTS[config.provider]?.label ?? config.provider;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && isConfigured) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isConfigured]);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setMessages((prev) => [...prev, { id, role, content }]);
  }, []);

  const handleGenerate = useCallback(async (userPrompt: string) => {
    if (!userPrompt.trim() || isLoading) return;

    addMessage('user', userPrompt);
    setInput('');
    setStreamingContent('');

    try {
      const fullText = await generate(userPrompt, {
        systemPrompt: SYSTEM_PROMPT,
        onToken: (token) => {
          setStreamingContent((prev) => prev + token);
        },
      });

      if (fullText) {
        addMessage('assistant', fullText);
      }
    } catch {
      // Error is handled by the hook
    } finally {
      setStreamingContent('');
    }
  }, [isLoading, generate, addMessage]);

  const handleQuickAction = useCallback((actionPrompt: string) => {
    const textToProcess = selectedText || '';
    if (!textToProcess && actionPrompt.includes('siguiente texto')) {
      handleGenerate('Ayúdame a escribir un artículo de blog interesante. Dame ideas y un esquema.');
      return;
    }
    handleGenerate(`${actionPrompt}\n\n"${textToProcess}"`);
  }, [selectedText, handleGenerate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = selectedText
      ? `Contexto del texto seleccionado: "${selectedText}"\n\nPetición del usuario: ${input}`
      : input;
    handleGenerate(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopyAndInsert = async (text: string) => {
    try {
      const html = await marked.parse(text);
      onInsert(html);
    } catch (e) {
      onInsert(text); // Fallback a texto plano
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch { /* ignore */ }
  };

  if (!isOpen) return null;

  return (
    <div
      className="not-prose font-sans fixed right-0 top-0 h-full w-[380px] bg-white border-l border-gray-200 z-[90] flex flex-col shadow-xl"
      style={{ animation: 'slideInRight 0.25s ease forwards' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-none">Asistente IA</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{providerLabel} · {config.model}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Configuración de IA"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Not configured state */}
      {!isConfigured && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Configura tu proveedor de IA</h4>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Conecta Ollama local o ingresa tu API Key de OpenAI, Gemini o DeepSeek para usar el asistente.
          </p>
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-sm font-semibold bg-slate-900 text-white px-5 py-2 rounded-md hover:bg-slate-800 transition-colors"
          >
            Configurar IA
          </button>
        </div>
      )}

      {/* Configured state */}
      {isConfigured && (
        <>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Empty state */}
            {messages.length === 0 && !streamingContent && (
              <div className="space-y-4">
                {selectedText && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1.5">Texto seleccionado</p>
                    <p className="text-xs text-blue-800 line-clamp-3 italic">"{selectedText}"</p>
                  </div>
                )}

                <p className="text-xs text-slate-400 text-center pt-2">Acciones rápidas</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleQuickAction(action.prompt)}
                      className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-left"
                    >
                      <span className="text-slate-400">{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-br-sm'
                      : 'bg-gray-100 text-slate-800 rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <>
                      <div 
                        className="whitespace-pre-wrap prose prose-sm prose-slate prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100 max-w-none"
                        dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}
                      />
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => handleCopyAndInsert(msg.content)}
                          className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                          title="Insertar en el editor"
                        >
                          <ClipboardPaste className="w-3 h-3" />
                          Insertar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.content)}
                          className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                          title="Copiar al portapapeles"
                        >
                          <Copy className="w-3 h-3" />
                          Copiar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming content */}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[90%] bg-gray-100 rounded-xl rounded-bl-sm px-3.5 py-2.5 text-sm text-slate-800 leading-relaxed">
                  <p className="whitespace-pre-wrap">{streamingContent}<span className="inline-block w-1.5 h-4 bg-slate-400 animate-pulse ml-0.5 align-text-bottom rounded-sm" /></p>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !streamingContent && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-xl rounded-bl-sm px-3.5 py-2.5">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-gray-200 px-4 py-3">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu petición..."
                rows={1}
                className="flex-1 resize-none px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-shadow max-h-24"
                style={{ minHeight: '38px' }}
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={abort}
                  className="shrink-0 w-9 h-9 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  title="Detener generación"
                >
                  <StopCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="shrink-0 w-9 h-9 flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Enviar"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

import { useState, useRef, useCallback } from 'react';
import { getAIConfig } from './aiConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GenerateOptions {
  systemPrompt?: string;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

interface UseAIReturn {
  generate: (prompt: string, options?: Omit<GenerateOptions, 'signal'>) => Promise<string>;
  isLoading: boolean;
  error: string | null;
  abort: () => void;
}

// ─── Stream parsers ───────────────────────────────────────────────────────────

/**
 * Parse an Ollama NDJSON stream.
 * Each line is a JSON object: { message: { content: string }, done: boolean }
 */
async function parseOllamaStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onToken?: (token: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const decoder = new TextDecoder();
  let buffer = '';
  let result = '';

  while (true) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    // Keep the last partial line in the buffer
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const json = JSON.parse(trimmed);
        const content: string = json.message?.content ?? '';
        if (content) {
          result += content;
          onToken?.(content);
        }
        if (json.done) return result;
      } catch {
        // Skip malformed lines
      }
    }
  }

  return result;
}

/**
 * Parse an SSE stream from the cloud proxy.
 *
 * OpenAI / DeepSeek format:
 *   data: {"choices":[{"delta":{"content":"..."}}]}
 *
 * Gemini format:
 *   data: {"candidates":[{"content":{"parts":[{"text":"..."}]}}]}
 *
 * End sentinel:
 *   data: [DONE]
 */
async function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  provider: string,
  onToken?: (token: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const decoder = new TextDecoder();
  let buffer = '';
  let result = '';

  while (true) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue; // skip empty & SSE comments

      if (!trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6); // strip 'data: '

      if (data === '[DONE]') return result;

      try {
        const json = JSON.parse(data);
        let content = '';

        if (provider === 'gemini') {
          content = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        } else {
          // openai / deepseek share the same delta format
          content = json.choices?.[0]?.delta?.content ?? '';
        }

        if (content) {
          result += content;
          onToken?.(content);
        }
      } catch {
        // Skip malformed SSE payloads
      }
    }
  }

  return result;
}

// ─── Standalone generate function ─────────────────────────────────────────────

/**
 * Core AI generation function – usable outside of React components.
 * Reads AI configuration from `getAIConfig()` and dispatches to either
 * Ollama (direct) or the cloud proxy endpoint.
 */
export async function generateAI(
  prompt: string,
  options: GenerateOptions = {},
): Promise<string> {
  const { systemPrompt, onToken, signal } = options;
  const config = getAIConfig();

  const messages = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    { role: 'user' as const, content: prompt },
  ];

  // ── Ollama (direct client-side connection) ──────────────────────────────
  if (config.provider === 'ollama') {
    const res = await fetch(`${config.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true,
      }),
      signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`Ollama error (${res.status}): ${text}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body from Ollama');

    return parseOllamaStream(reader, onToken, signal);
  }

  // ── Cloud providers via Astro proxy ─────────────────────────────────────
  const res = await fetch('/api/ai/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      messages,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`AI proxy error (${res.status}): ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body from AI proxy');

  return parseSSEStream(reader, config.provider, onToken, signal);
}

// ─── React hook ───────────────────────────────────────────────────────────────

/**
 * Unified React hook for AI text generation.
 *
 * ```tsx
 * const { generate, isLoading, error, abort } = useAI();
 * const text = await generate('Write a haiku', {
 *   systemPrompt: 'You are a poet.',
 *   onToken: (t) => setPartial((p) => p + t),
 * });
 * ```
 */
export function useAI(): UseAIReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const generate = useCallback(
    async (
      prompt: string,
      options: Omit<GenerateOptions, 'signal'> = {},
    ): Promise<string> => {
      // Cancel any in-progress generation
      abort();

      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const result = await generateAI(prompt, {
          ...options,
          signal: controller.signal,
        });
        return result;
      } catch (err) {
        // Don't report user-initiated aborts as errors
        if (err instanceof DOMException && err.name === 'AbortError') {
          return '';
        }
        const message = err instanceof Error ? err.message : 'Unknown AI error';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [abort],
  );

  return { generate, isLoading, error, abort };
}

// AI provider configuration stored in browser localStorage
// Never saved to the database for security

export type AIProvider = 'ollama' | 'openai' | 'gemini' | 'deepseek';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  endpoint: string;
  model: string;
}

const STORAGE_KEY = 'myblog_ai_settings';

export const PROVIDER_DEFAULTS: Record<AIProvider, { endpoint: string; model: string; label: string }> = {
  ollama:   { endpoint: 'http://localhost:11434', model: 'llama3.2', label: 'Ollama (Local)' },
  openai:   { endpoint: 'https://api.openai.com/v1', model: 'gpt-4o-mini', label: 'OpenAI' },
  gemini:   { endpoint: 'https://generativelanguage.googleapis.com', model: 'gemini-2.0-flash', label: 'Google Gemini' },
  deepseek: { endpoint: 'https://api.deepseek.com/v1', model: 'deepseek-chat', label: 'DeepSeek' },
};

export const getAIConfig = (): AIConfig => {
  if (typeof window === 'undefined') {
    return { provider: 'ollama', apiKey: '', endpoint: PROVIDER_DEFAULTS.ollama.endpoint, model: PROVIDER_DEFAULTS.ollama.model };
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { /* corrupt data, return default */ }
  }
  return { provider: 'ollama', apiKey: '', endpoint: PROVIDER_DEFAULTS.ollama.endpoint, model: PROVIDER_DEFAULTS.ollama.model };
};

export const saveAIConfig = (config: AIConfig): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const hasAIConfigured = (): boolean => {
  const config = getAIConfig();
  if (config.provider === 'ollama') return true; // Ollama doesn't need API key
  return config.apiKey.trim().length > 0;
};

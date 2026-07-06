import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  X,
  Cpu,
  Cloud,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  type AIConfig,
  type AIProvider,
  PROVIDER_DEFAULTS,
  getAIConfig,
  saveAIConfig,
} from '../../lib/aiConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ProviderOption {
  id: AIProvider;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

type ConnectionStatus = 'idle' | 'loading' | 'success' | 'error';

const PROVIDERS: ProviderOption[] = [
  {
    id: 'ollama',
    label: 'Ollama (Local)',
    icon: <Cpu className="w-5 h-5" />,
    badge: 'Gratis & Privado',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    icon: <Cloud className="w-5 h-5" />,
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    icon: <Cloud className="w-5 h-5" />,
  },
];

export default function AISettingsModal({ isOpen, onClose }: Props) {
  const [provider, setProvider] = useState<AIProvider>('ollama');
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState(PROVIDER_DEFAULTS.ollama.endpoint);
  const [model, setModel] = useState(PROVIDER_DEFAULTS.ollama.model);
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [visible, setVisible] = useState(false);

  // Load existing config on open
  useEffect(() => {
    if (isOpen) {
      const config = getAIConfig();
      setProvider(config.provider);
      setApiKey(config.apiKey);
      setEndpoint(config.endpoint);
      setModel(config.model);
      setConnectionStatus('idle');
      setConnectionMessage('');
      setShowApiKey(false);

      // Trigger enter animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Switch provider: reset fields to defaults
  const handleProviderChange = useCallback((p: AIProvider) => {
    setProvider(p);
    setEndpoint(PROVIDER_DEFAULTS[p].endpoint);
    setModel(PROVIDER_DEFAULTS[p].model);
    setApiKey('');
    setConnectionStatus('idle');
    setConnectionMessage('');
  }, []);

  // Close with exit animation
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  // Test connection
  const testConnection = useCallback(async () => {
    setConnectionStatus('loading');
    setConnectionMessage('');

    try {
      if (provider === 'ollama') {
        const res = await fetch(`${endpoint}/api/tags`, { method: 'GET' });
        if (!res.ok) throw new Error(`Ollama respondió con status ${res.status}`);
        const data = await res.json();
        const modelCount = data.models?.length ?? 0;
        setConnectionStatus('success');
        setConnectionMessage(
          `Conexión exitosa. ${modelCount} modelo${modelCount !== 1 ? 's' : ''} disponible${modelCount !== 1 ? 's' : ''}.`
        );
      } else {
        const res = await fetch('/api/ai/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            apiKey,
            model,
            endpoint,
            messages: [{ role: 'user', content: 'Hi' }],
            maxTokens: 5,
          }),
        });
        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(errBody || `Error ${res.status}`);
        }
        setConnectionStatus('success');
        setConnectionMessage('Conexión exitosa. API Key válida.');
      }
    } catch (err: unknown) {
      setConnectionStatus('error');
      setConnectionMessage(
        err instanceof Error ? err.message : 'Error de conexión desconocido.'
      );
    }
  }, [provider, apiKey, endpoint, model]);

  // Save configuration
  const handleSave = useCallback(() => {
    saveAIConfig({ provider, apiKey, endpoint, model });
    handleClose();
  }, [provider, apiKey, endpoint, model, handleClose]);

  if (!isOpen) return null;

  const isCloudProvider = provider !== 'ollama';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 relative z-10 transform transition-all duration-200 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Configuración de IA</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Provider Cards – 2×2 grid */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Proveedor de IA
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderChange(p.id)}
                  className={`relative flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer ${
                    provider === p.id
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      provider === p.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-gray-100 text-slate-500'
                    }`}
                  >
                    {p.icon}
                  </div>
                  <span className="text-sm font-medium text-slate-900">{p.label}</span>
                  {p.badge && (
                    <span className="absolute top-2 right-2 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full leading-none">
                      {p.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic fields */}
          <div className="space-y-4">
            {/* Endpoint – only shown for Ollama */}
            {provider === 'ollama' && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Endpoint
                </label>
                <input
                  type="url"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-shadow"
                />
              </div>
            )}

            {/* API Key – cloud providers */}
            {isCloudProvider && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`sk-...`}
                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-md text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-shadow font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Model */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Modelo
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={PROVIDER_DEFAULTS[provider].model}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-shadow"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Modelo por defecto: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{PROVIDER_DEFAULTS[provider].model}</code>
              </p>
            </div>

            {/* Ollama info box */}
            {provider === 'ollama' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5">
                <p className="text-sm text-blue-800 leading-relaxed">
                  Asegúrate de que Ollama está corriendo con:
                </p>
                <code className="block mt-1.5 text-xs bg-blue-100 text-blue-900 px-2.5 py-1.5 rounded font-mono">
                  OLLAMA_ORIGINS="*" ollama serve
                </code>
              </div>
            )}
          </div>

          {/* Test connection */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={testConnection}
              disabled={connectionStatus === 'loading'}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connectionStatus === 'loading' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Probar Conexión
            </button>

            {connectionStatus === 'success' && (
              <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{connectionMessage}</span>
              </div>
            )}

            {connectionStatus === 'error' && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{connectionMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="text-sm font-semibold text-slate-600 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="text-sm font-semibold bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-800 active:scale-[0.98] transition-all shadow-md"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
}

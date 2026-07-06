import type { APIRoute } from 'astro';
import { lucia } from '../../../lib/lucia';

/**
 * POST /api/ai/proxy
 * CORS-free proxy for cloud AI providers. Receives the user's API key
 * in the request body, forwards it to the provider, and streams the
 * response back. The API key is NEVER stored on the server.
 *
 * Requiere sesión activa de administrador.
 */

type CloudProvider = 'openai' | 'gemini' | 'deepseek';
const VALID_PROVIDERS: CloudProvider[] = ['openai', 'gemini', 'deepseek'];

interface ProxyRequestBody {
  provider: CloudProvider;
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
}

// ─── Helper: build provider-specific fetch options ──────────────────────────

function buildOpenAIRequest(body: ProxyRequestBody): { url: string; init: RequestInit } {
  return {
    url: 'https://api.openai.com/v1/chat/completions',
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${body.apiKey}`,
      },
      body: JSON.stringify({
        model: body.model,
        messages: body.messages,
        stream: true,
      }),
    },
  };
}

function buildDeepSeekRequest(body: ProxyRequestBody): { url: string; init: RequestInit } {
  return {
    url: 'https://api.deepseek.com/v1/chat/completions',
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${body.apiKey}`,
      },
      body: JSON.stringify({
        model: body.model,
        messages: body.messages,
        stream: true,
      }),
    },
  };
}

function buildGeminiRequest(body: ProxyRequestBody): { url: string; init: RequestInit } {
  // Map OpenAI-style messages to Gemini format
  const contents = body.messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${body.model}:streamGenerateContent?key=${body.apiKey}&alt=sse`;

  return {
    url,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    },
  };
}

const PROVIDER_BUILDERS: Record<CloudProvider, (body: ProxyRequestBody) => { url: string; init: RequestInit }> = {
  openai: buildOpenAIRequest,
  deepseek: buildDeepSeekRequest,
  gemini: buildGeminiRequest,
};

// ─── POST handler ───────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request, cookies }) => {
  // ─── Guardia de autenticación ──────────────────────────────────────────
  const sessionId = cookies.get(lucia.sessionCookieName)?.value;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }
  const { session } = await lucia.validateSession(sessionId);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Sesión inválida' }), { status: 401 });
  }

  // ─── Parsear body ─────────────────────────────────────────────────────
  let body: ProxyRequestBody;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
  }

  // ─── Validar campos requeridos ─────────────────────────────────────────
  if (!body.provider || !VALID_PROVIDERS.includes(body.provider)) {
    return new Response(
      JSON.stringify({ error: `Proveedor inválido. Usar: ${VALID_PROVIDERS.join(', ')}` }),
      { status: 400 },
    );
  }

  if (!body.apiKey || body.apiKey.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Se requiere apiKey' }), { status: 400 });
  }

  if (!body.model || body.model.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Se requiere model' }), { status: 400 });
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Se requiere messages (array no vacío)' }), { status: 400 });
  }

  // ─── Construir y enviar request al proveedor ──────────────────────────
  const { url, init } = PROVIDER_BUILDERS[body.provider](body);

  try {
    const providerResponse = await fetch(url, init);

    if (!providerResponse.ok) {
      const errorText = await providerResponse.text();
      console.error(`[ai/proxy] Error del proveedor ${body.provider}:`, providerResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: `Error del proveedor (${providerResponse.status})`,
          details: errorText,
        }),
        { status: providerResponse.status },
      );
    }

    // ─── Stream de la respuesta al cliente ─────────────────────────────
    if (!providerResponse.body) {
      return new Response(JSON.stringify({ error: 'Sin cuerpo de respuesta del proveedor' }), { status: 502 });
    }

    return new Response(providerResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[ai/proxy] Error de red:', err);
    return new Response(
      JSON.stringify({ error: 'Error al conectar con el proveedor de IA' }),
      { status: 502 },
    );
  }
};

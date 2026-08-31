import type { APIRoute } from 'astro';
import { uploadToR2 } from '../../lib/r2';
import { lucia } from '../../lib/lucia';
import { randomBytes } from 'node:crypto';

/**
 * POST /api/upload
 * Recibe un archivo binario vía FormData, lo sube a Cloudflare R2
 * y devuelve la URL pública al cliente (TipTap la incrusta automáticamente).
 *
 * Requiere sesión activa de administrador.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  // ─── Guardia de autenticación ────────────────────────────────────────────
  const sessionId = cookies.get(lucia.sessionCookieName)?.value;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }
  const { session } = await lucia.validateSession(sessionId);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Sesión inválida' }), { status: 401 });
  }

  // ─── Parsear FormData ────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'FormData inválido' }), { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return new Response(JSON.stringify({ error: 'No se encontró el archivo' }), { status: 400 });
  }

  // ─── Validar tipo MIME ───────────────────────────────────────────────────
  const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!ALLOWED.includes(file.type)) {
    return new Response(
      JSON.stringify({ error: 'Tipo de archivo no permitido. Solo imágenes.' }),
      { status: 415 },
    );
  }

  // ─── Generar clave única en R2 ───────────────────────────────────────────
  const ext = file.name.split('.').pop() ?? 'bin';
  const uniqueId = randomBytes(8).toString('hex');
  const key = `uploads/${uniqueId}.${ext}`;

  // ─── Subir a R2 ─────────────────────────────────────────────────────────
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const publicUrl = await uploadToR2(key, buffer, file.type);

    return new Response(JSON.stringify({ url: publicUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[upload] Error en R2:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Error al subir el archivo' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
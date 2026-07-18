import type { APIRoute } from 'astro';
import { db } from '../../db/client';
import { users, emailVerificationTokens } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { lucia } from '../../lib/lucia';

export const GET: APIRoute = async (context) => {
  const token = context.url.searchParams.get('token');

  if (!token) {
    return context.redirect('/login?error=' + encodeURIComponent('Enlace de verificación inválido.'));
  }

  // Buscar el token en la BD
  const [dbToken] = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.code, token))
    .limit(1);

  if (!dbToken) {
    return context.redirect('/login?error=' + encodeURIComponent('Enlace de verificación inválido o ya utilizado.'));
  }

  // Comprobar expiración
  const now = Math.floor(Date.now() / 1000);
  if (dbToken.expiresAt < now) {
    // Eliminar token expirado
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, dbToken.id));
    return context.redirect('/login?error=' + encodeURIComponent('El enlace de verificación ha expirado.'));
  }

  // Actualizar el estado del usuario
  await db
    .update(users)
    .set({ emailVerified: 1 })
    .where(eq(users.id, dbToken.userId));

  // Eliminar el token usado
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, dbToken.id));

  // Crear sesión y redirigir al panel
  const session = await lucia.createSession(dbToken.userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  context.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  return context.redirect('/studio?verified=true');
};

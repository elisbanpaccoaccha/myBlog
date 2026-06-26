import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { lucia } from '../lib/lucia';
import { db } from '../db/client.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

/**
 * Verifica una contraseña contra el hash almacenado.
 * El hash tiene formato "salt:derivedKeyHex".
 */
async function verifyPassword(stored: string, plain: string): Promise<boolean> {
  const [salt, storedHash] = stored.split(':');
  const derivedKey = await scryptAsync(plain, salt, 64) as Buffer;
  return derivedKey.toString('hex') === storedHash;
}



export const authActions = {
  /** Inicio de sesión: valida credenciales, crea sesión en Turso y fija cookie */
  login: defineAction({
    accept: 'form',
    input: z.object({
      username: z.string().min(1, 'El usuario es requerido'),
      password: z.string().min(1, 'La contraseña es requerida'),
    }),
    handler: async (input, context) => {
      // Buscar usuario por username
      const [user] = await db
        .select({ id: users.id, password_hash: users.password_hash })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (!user) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Credenciales inválidas' });
      }

      const valid = await verifyPassword(user.password_hash, input.password);
      if (!valid) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Credenciales inválidas' });
      }

      // Crear sesión en Lucia → la inserta en la tabla Sessions de Turso
      const session = await lucia.createSession(user.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);

      context.cookies.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );

      return { success: true };
    },
  }),

  /** Cierre de sesión: invalida la sesión en Turso y elimina la cookie */
  logout: defineAction({
    handler: async (_input, context) => {
      const sessionId = context.cookies.get(lucia.sessionCookieName)?.value;
      if (sessionId) {
        await lucia.invalidateSession(sessionId);
      }
      const blankCookie = lucia.createBlankSessionCookie();
      context.cookies.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
      return { success: true };
    },
  }),
};
import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { lucia } from '../lib/lucia';
import { db } from '../db/client.ts';
import { users, emailVerificationTokens } from '../db/schema.ts';
import { eq, or } from 'drizzle-orm';
import { scrypt, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { Resend } from 'resend';
import { nanoid } from 'nanoid';

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

/**
 * Hashea una contraseña.
 */
async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(plain, salt, 64) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export const authActions = {
  /** Registro de usuario */
  register: defineAction({
    accept: 'form',
    input: z.object({
      username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(20),
      email: z.string().email('Correo electrónico inválido'),
      password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
      confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword'],
    }),
    handler: async (input) => {
      const resend = new Resend(import.meta.env.API_RESEND);
      // Verificar si existe el usuario o email
      const existingUser = await db
        .select({ id: users.id, username: users.username, email: users.email })
        .from(users)
        .where(
          or(
            eq(users.username, input.username),
            eq(users.email, input.email)
          )
        )
        .limit(1);

      if (existingUser.length > 0) {
        throw new ActionError({
          code: 'CONFLICT',
          message: 'El nombre de usuario o correo ya está en uso',
        });
      }

      const hashedPassword = await hashPassword(input.password);
      const userId = nanoid();

      // Crear usuario no verificado con rol de autor (como Medium)
      await db.insert(users).values({
        id: userId,
        username: input.username,
        email: input.email,
        password_hash: hashedPassword,
        emailVerified: 0,
        role: 'USER',
      });

      // Generar token
      const tokenId = nanoid();
      const code = nanoid(32); // UUID largo para el link
      
      // Expira en 15 minutos
      const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;

      await db.insert(emailVerificationTokens).values({
        id: tokenId,
        userId,
        email: input.email,
        code,
        expiresAt,
      });

      // Enviar email con Resend
      const verifyLink = `${import.meta.env.PUBLIC_URL || 'http://localhost:4321'}/api/verify-email?token=${code}`;

      await resend.emails.send({
        from: 'MyBlog <onboarding@resend.dev>',
        to: input.email,
        subject: 'Confirma tu correo electrónico - MyBlog',
        html: `
          <h1>¡Bienvenido a MyBlog!</h1>
          <p>Haz clic en el siguiente enlace para confirmar tu cuenta y acceder:</p>
          <a href="${verifyLink}" style="display:inline-block;padding:10px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:5px;">
            Verificar mi correo
          </a>
          <p>Este enlace expirará en 15 minutos.</p>
        `,
      });

      return { success: true, email: input.email };
    }
  }),

  /** Inicio de sesión: valida credenciales, crea sesión en Turso y fija cookie */
  login: defineAction({
    accept: 'form',
    input: z.object({
      username: z.string().min(1, 'El usuario es requerido'),
      password: z.string().min(1, 'La contraseña es requerida'),
    }),
    handler: async (input, context) => {
      // Buscar usuario por username (permitir también por email en el futuro, pero ahora pedimos usuario)
      const [user] = await db
        .select({ id: users.id, password_hash: users.password_hash, emailVerified: users.emailVerified })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (!user) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Credenciales inválidas' });
      }

      // Validar si el correo está verificado
      if (user.emailVerified === 0) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Por favor, verifica tu correo electrónico antes de iniciar sesión.' });
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
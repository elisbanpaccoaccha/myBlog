import { Lucia } from 'lucia';
import { LibSQLAdapter } from '@lucia-auth/adapter-sqlite';
import { libsqlClient } from '../db/client.ts';

// En producción, apunta a Turso mediante las variables de entorno.
const isProduction = import.meta.env.MODE === 'production';

const adapter = new LibSQLAdapter(libsqlClient, {
  user:    'Users',
  session: 'Sessions',
});

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure:   isProduction,     // HTTPS en producción
      sameSite: 'lax' as const,
    },
  },
  getUserAttributes(attributes) {
    return {
      username: (attributes as { username: string }).username,
      role: (attributes as { role: string }).role,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: { username: string; role: string };
  }
}
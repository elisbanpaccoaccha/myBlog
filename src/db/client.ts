import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.ts';

const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return (import.meta.env as Record<string, any>)[key];
};

let rawUrl = (getEnv('TURSO_DATABASE_URL') || 'file:.astro/content.db').trim();
const authToken = getEnv('TURSO_AUTH_TOKEN')?.trim();

// En entornos Serverless (Netlify Functions), convertir libsql:// a https:// fuerza el uso de HTTP fetch en lugar de WebSockets.
if (rawUrl.startsWith('libsql://')) {
  rawUrl = rawUrl.replace('libsql://', 'https://');
}

export const libsqlClient = createClient({ url: rawUrl, authToken });
export const db = drizzle(libsqlClient, { schema });

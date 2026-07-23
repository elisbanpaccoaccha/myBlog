import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.ts';

const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return (import.meta.env as Record<string, any>)[key];
};

const url = getEnv('TURSO_DATABASE_URL') || 'file:.astro/content.db';
const authToken = getEnv('TURSO_AUTH_TOKEN');

export const libsqlClient = createClient({ url, authToken });
export const db = drizzle(libsqlClient, { schema });

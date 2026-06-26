import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.ts';

const url = import.meta.env.TURSO_DATABASE_URL || 'file:.astro/content.db';
const authToken = import.meta.env.TURSO_AUTH_TOKEN;

export const libsqlClient = createClient({ url, authToken });
export const db = drizzle(libsqlClient, { schema });

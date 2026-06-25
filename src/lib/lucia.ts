import { Lucia } from 'lucia';
// Typically you'd setup the turso adapter here. 
// import { LibSQLAdapter } from '@lucia-auth/adapter-sqlite';
// For now, this is a placeholder since we're using astro:db

export const lucia = new Lucia({} as any, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    }
  }
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
  }
}
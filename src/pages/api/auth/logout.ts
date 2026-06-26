import { lucia } from '../../../lib/lucia';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const sessionId = cookies.get(lucia.sessionCookieName)?.value;
  if (!sessionId) {
    return redirect('/login');
  }

  await lucia.invalidateSession(sessionId);
  const blankCookie = lucia.createBlankSessionCookie();
  cookies.set(blankCookie.name, blankCookie.value, blankCookie.attributes);

  return redirect('/login');
};

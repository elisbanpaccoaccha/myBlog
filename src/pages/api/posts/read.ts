import type { APIRoute } from 'astro';
import { db } from '../../../db/client';
import { posts } from '../../../db/schema';
import { sql, eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const data = await request.json();
    const postId = data.postId;

    if (!postId) {
      return new Response(JSON.stringify({ error: 'postId required' }), { status: 400 });
    }

    const readCookieName = `read_${postId}`;
    
    // Si ya lo leyó recientemente, ignoramos
    if (cookies.has(readCookieName)) {
      return new Response(JSON.stringify({ success: true, message: 'Already read' }), { status: 200 });
    }

    // Incrementar readCount en la BD
    await db.update(posts)
      .set({ readCount: sql`${posts.readCount} + 1` })
      .where(eq(posts.id, postId));

    // Establecer cookie para evitar pings múltiples en 24 horas
    cookies.set(readCookieName, 'true', {
      path: '/',
      maxAge: 60 * 60 * 24, // 24 horas
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

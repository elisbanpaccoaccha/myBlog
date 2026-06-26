import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { lucia } from '../lib/lucia';
import { db } from '../db/client.ts';
import { posts, tags, postTags } from '../db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

/**
 * Genera un slug URL-amigable desde un título.
 * Agrega sufijo aleatorio para garantizar unicidad.
 */
function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // eliminar diacríticos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  const suffix = randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}

/**
 * Estima el tiempo de lectura en minutos basado en el JSON de TipTap.
 * Extrae el texto plano y divide entre 200 palabras/minuto.
 */
function estimateReadingTime(tiptapJson: string): number {
  try {
    const doc = JSON.parse(tiptapJson);
    const text = JSON.stringify(doc).replace(/"text":"([^"]*)"/g, '$1');
    const wordCount = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  } catch {
    return 1;
  }
}

export const postActions = {
  savePost: defineAction({
    accept: 'form',
    input: z.object({
      id:         z.string().nullish(),
      title:      z.string().min(1, 'El título es requerido'),
      content:    z.string().min(2, 'El contenido es requerido'),
      tags:       z.string().nullish().default(''),
      excerpt:    z.string().nullish().default(''),
      coverImage: z.string().nullish().default(''),
      status:     z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
    }),
    handler: async (input, context) => {
      // Verificar sesión
      const sessionId = context.cookies.get(lucia.sessionCookieName)?.value;
      if (!sessionId) throw new ActionError({ code: 'UNAUTHORIZED' });
      const { session, user } = await lucia.validateSession(sessionId);
      if (!session || !user) throw new ActionError({ code: 'UNAUTHORIZED' });

      const now        = new Date();
      const postId     = input.id || `post-${randomBytes(8).toString('hex')}`;
      const slug       = input.status === 'PUBLISHED' ? slugify(input.title) : `draft-${postId}`;
      const readingTime = estimateReadingTime(input.content);

      // UPSERT post
      await db
        .insert(posts)
        .values({
          id: postId,
          title: input.title,
          slug,
          excerpt: input.excerpt || null,
          coverImage: input.coverImage || null,
          content: input.content,
          authorId: user.id,
          published: input.status === 'PUBLISHED' ? 1 : 0,
          status: input.status,
          readingTime,
          publishedAt: input.status === 'PUBLISHED' ? now.toISOString() : null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        })
        .onConflictDoUpdate({
          target: posts.id,
          set: {
            title: input.title,
            slug,
            excerpt: input.excerpt || null,
            coverImage: input.coverImage || null,
            content: input.content,
            status: input.status,
            published: input.status === 'PUBLISHED' ? 1 : 0,
            readingTime,
            publishedAt: input.status === 'PUBLISHED' ? now.toISOString() : null,
            updatedAt: now.toISOString(),
          },
        });

      // Procesar tags
      if (input.tags) {
        const tagNames = input.tags.split(',').map(t => t.trim()).filter(Boolean);
        for (const name of tagNames) {
          const tagSlug  = name.toLowerCase().replace(/\s+/g, '-');
          const tagId    = `tag-${randomBytes(4).toString('hex')}`;

          // INSERT OR IGNORE para idempotencia
          await db
            .insert(tags)
            .values({ id: tagId, name, slug: tagSlug })
            .onConflictDoNothing();

          const [tagRow] = await db
            .select({ id: tags.id })
            .from(tags)
            .where(eq(tags.slug, tagSlug))
            .limit(1);

          if (tagRow) {
            await db
              .insert(postTags)
              .values({ postId, tagId: tagRow.id })
              .onConflictDoNothing();
          }
        }
      }

      return { success: true, slug, postId };
    },
  }),

  /** Elimina un post y sus relaciones */
  deletePost: defineAction({
    input: z.object({ id: z.string() }),
    handler: async (input, context) => {
      const sessionId = context.cookies.get(lucia.sessionCookieName)?.value;
      if (!sessionId) throw new ActionError({ code: 'UNAUTHORIZED' });
      const { session } = await lucia.validateSession(sessionId);
      if (!session) throw new ActionError({ code: 'UNAUTHORIZED' });

      await db.delete(postTags).where(eq(postTags.postId, input.id));
      await db.delete(posts).where(eq(posts.id, input.id));

      return { success: true };
    },
  }),

  /** Duplica un post existente como borrador */
  duplicatePost: defineAction({
    input: z.object({ id: z.string() }),
    handler: async (input, context) => {
      const sessionId = context.cookies.get(lucia.sessionCookieName)?.value;
      if (!sessionId) throw new ActionError({ code: 'UNAUTHORIZED' });
      const { session, user } = await lucia.validateSession(sessionId);
      if (!session || !user) throw new ActionError({ code: 'UNAUTHORIZED' });

      const [originalPost] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, input.id))
        .limit(1);

      if (!originalPost) throw new ActionError({ code: 'NOT_FOUND', message: 'Post no encontrado' });

      const newId = `post-${randomBytes(8).toString('hex')}`;
      const newTitle = `Copia de ${originalPost.title}`;
      const now = new Date().toISOString();

      try {
        await db.insert(posts).values({
          ...originalPost,
          id: newId,
          title: newTitle,
          slug: `draft-${newId}`,
          status: 'DRAFT',
          published: 0,
          publishedAt: null,
          createdAt: now,
          updatedAt: now,
        });

        return { success: true, newId };
      } catch (e: any) {
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: e.message || 'Error de BD' });
      }
    },
  }),

  /** Obtiene todos los posts del autor autenticado */
  getPosts: defineAction({
    handler: async (_, context) => {
      const sessionId = context.cookies.get(lucia.sessionCookieName)?.value;
      if (!sessionId) throw new ActionError({ code: 'UNAUTHORIZED' });
      const { session, user } = await lucia.validateSession(sessionId);
      if (!session || !user) throw new ActionError({ code: 'UNAUTHORIZED' });

      const rows = await db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          readingTime: posts.readingTime,
          published: posts.published,
          status: posts.status,
          publishedAt: posts.publishedAt,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
        })
        .from(posts)
        .where(eq(posts.authorId, user.id))
        .orderBy(desc(posts.createdAt))
        .limit(50);

      const mapped = rows.map(row => ({
        id:          row.id,
        title:       row.title,
        slug:        row.slug,
        readingTime: row.readingTime,
        published:   row.published === 1,
        status:      row.status,
        publishedAt: row.publishedAt,
        createdAt:   row.createdAt,
        updatedAt:   row.updatedAt,
      }));
      // console.log("SERVER getPosts output:", JSON.stringify(mapped, null, 2));
      return mapped;
    },
  }),
};
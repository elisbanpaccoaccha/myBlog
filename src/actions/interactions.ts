import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { lucia } from '../lib/lucia';
import { db } from '../db/client.ts';
import { bookmarks, comments, users, likes, commentLikes } from '../db/schema.ts';
import { and, eq, desc, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

export const interactionActions = {
  toggleBookmark: defineAction({
    input: z.object({ postId: z.string() }),
    handler: async (input, context) => {
      const sessionId = context.cookies.get(lucia.sessionCookieName)?.value;
      if (!sessionId) throw new ActionError({ code: 'UNAUTHORIZED' });
      const { session, user } = await lucia.validateSession(sessionId);
      if (!session || !user) throw new ActionError({ code: 'UNAUTHORIZED' });

      const [existing] = await db
        .select()
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, user.id),
            eq(bookmarks.postId, input.postId)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .delete(bookmarks)
          .where(
            and(
              eq(bookmarks.userId, user.id),
              eq(bookmarks.postId, input.postId)
            )
          );
        return { bookmarked: false };
      } else {
        const now = new Date().toISOString();
        await db
          .insert(bookmarks)
          .values({
            userId: user.id,
            postId: input.postId,
            createdAt: now,
          });
        return { bookmarked: true };
      }
    },
  }),

  addLike: defineAction({
    input: z.object({ postId: z.string() }),
    handler: async (input, context) => {
      const sessionId = context.cookies.get(lucia.sessionCookieName)?.value;
      if (!sessionId) throw new ActionError({ code: 'UNAUTHORIZED' });
      const { session, user } = await lucia.validateSession(sessionId);
      if (!session || !user) throw new ActionError({ code: 'UNAUTHORIZED' });

      const [existing] = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.userId, user.id),
            eq(likes.postId, input.postId)
          )
        )
        .limit(1);

      if (existing) {
        const newCount = Math.min(existing.count + 1, 50);
        await db
          .update(likes)
          .set({ count: newCount })
          .where(
            and(
              eq(likes.userId, user.id),
              eq(likes.postId, input.postId)
            )
          );
        return { count: newCount };
      } else {
        const now = new Date().toISOString();
        await db
          .insert(likes)
          .values({
            userId: user.id,
            postId: input.postId,
            count: 1,
            createdAt: now,
          });
        return { count: 1 };
      }
    },
  }),

  addCommentLike: defineAction({
    input: z.object({ commentId: z.string() }),
    handler: async (input, context) => {
      const sessionId = context.cookies.get(lucia.sessionCookieName)?.value;
      if (!sessionId) throw new ActionError({ code: 'UNAUTHORIZED' });
      const { session, user } = await lucia.validateSession(sessionId);
      if (!session || !user) throw new ActionError({ code: 'UNAUTHORIZED' });

      const [existing] = await db
        .select()
        .from(commentLikes)
        .where(
          and(
            eq(commentLikes.userId, user.id),
            eq(commentLikes.commentId, input.commentId)
          )
        )
        .limit(1);

      if (existing) {
        const newCount = Math.min(existing.count + 1, 50);
        await db
          .update(commentLikes)
          .set({ count: newCount })
          .where(
            and(
              eq(commentLikes.userId, user.id),
              eq(commentLikes.commentId, input.commentId)
            )
          );
        return { count: newCount };
      } else {
        const now = new Date().toISOString();
        await db
          .insert(commentLikes)
          .values({
            userId: user.id,
            commentId: input.commentId,
            count: 1,
            createdAt: now,
          });
        return { count: 1 };
      }
    },
  }),

  deleteComment: defineAction({
    input: z.object({ commentId: z.string() }),
    handler: async (input, context) => {
      const sessionId = context.cookies.get(lucia.sessionCookieName)?.value;
      if (!sessionId) throw new ActionError({ code: 'UNAUTHORIZED' });
      const { session, user } = await lucia.validateSession(sessionId);
      if (!session || !user) throw new ActionError({ code: 'UNAUTHORIZED' });

      const [comment] = await db.select().from(comments).where(eq(comments.id, input.commentId)).limit(1);
      if (!comment || comment.userId !== user.id) throw new ActionError({ code: 'FORBIDDEN' });

      // Ver si el comentario tiene hijos
      const children = await db.select({ id: comments.id }).from(comments).where(eq(comments.parentId, input.commentId)).limit(1);
      
      if (children.length > 0) {
        // Soft delete
        await db.update(comments).set({ isDeleted: 1 }).where(eq(comments.id, input.commentId));
        return { success: true, softDeleted: true };
      } else {
        // Hard delete
        await db.delete(comments).where(eq(comments.id, input.commentId));
        return { success: true, softDeleted: false };
      }
    },
  }),

  addComment: defineAction({
    input: z.object({
      postId: z.string(),
      content: z.string().min(1, 'El comentario no puede estar vacío'),
      parentId: z.string().nullish(),
    }),
    handler: async (input, context) => {
      const sessionId = context.cookies.get(lucia.sessionCookieName)?.value;
      if (!sessionId) throw new ActionError({ code: 'UNAUTHORIZED' });
      const { session, user } = await lucia.validateSession(sessionId);
      if (!session || !user) throw new ActionError({ code: 'UNAUTHORIZED' });

      const commentId = `cmt-${randomBytes(6).toString('hex')}`;
      const now = new Date().toISOString();

      await db.insert(comments).values({
        id: commentId,
        userId: user.id,
        postId: input.postId,
        parentId: input.parentId || null,
        content: input.content,
        createdAt: now,
        updatedAt: now,
      });

      const [newComment] = await db
        .select({
          id: comments.id,
          content: comments.content,
          isDeleted: comments.isDeleted,
          createdAt: comments.createdAt,
          parentId: comments.parentId,
          user: {
            id: users.id,
            displayName: users.displayName,
            username: users.username,
            avatarUrl: users.avatarUrl,
          }
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.id, commentId))
        .limit(1);

      return newComment;
    },
  }),

  getComments: defineAction({
    input: z.object({ postId: z.string() }),
    handler: async (input, context) => {
        const rows = await db
        .select({
          id: comments.id,
          content: comments.content,
          isDeleted: comments.isDeleted,
          createdAt: comments.createdAt,
          parentId: comments.parentId,
          user: {
            id: users.id,
            displayName: users.displayName,
            username: users.username,
            avatarUrl: users.avatarUrl,
          }
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.postId, input.postId))
        .orderBy(desc(comments.createdAt));

      // Fetch all comment likes for these comments and attach them
      const commentIds = rows.map(r => r.id);
      
      let allCommentLikes: any[] = [];
      if (commentIds.length > 0) {
        // Obtenemos los totales por comentario
        allCommentLikes = await db
          .select({
            commentId: commentLikes.commentId,
            totalLikes: sql<number>`sum(${commentLikes.count})`
          })
          .from(commentLikes)
          // Usamos un simple inArray, o iteramos si no está importado. Mejor import inArray de drizzle-orm
          .where(sql`${commentLikes.commentId} IN (${sql.join(commentIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(commentLikes.commentId);
      }

      // Si el usuario está logueado, obtenemos sus likes personales
      let userCommentLikesMap: Record<string, number> = {};
      const sessionId = context.cookies.get(lucia.sessionCookieName)?.value;
      if (sessionId) {
        const { session, user } = await lucia.validateSession(sessionId);
        if (session && user && commentIds.length > 0) {
          const userLikesRows = await db
            .select({
              commentId: commentLikes.commentId,
              count: commentLikes.count
            })
            .from(commentLikes)
            .where(
              and(
                eq(commentLikes.userId, user.id),
                sql`${commentLikes.commentId} IN (${sql.join(commentIds.map(id => sql`${id}`), sql`, `)})`
              )
            );
          
          userLikesRows.forEach(row => {
            userCommentLikesMap[row.commentId] = row.count;
          });
        }
      }

      const likesMap: Record<string, number> = {};
      allCommentLikes.forEach(r => {
        likesMap[r.commentId] = r.totalLikes || 0;
      });

      return rows.map(r => ({
        ...r,
        likeCount: likesMap[r.id] || 0,
        userLikeCount: userCommentLikesMap[r.id] || 0
      }));
    },
  }),
};

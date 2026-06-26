import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { lucia } from '../lib/lucia';

export const profileActions = {
  saveProfile: defineAction({
    accept: 'form',
    input: z.object({
      displayName: z.string().nullable().optional(),
      bio: z.string().nullable().optional(),
      avatarUrl: z.string().nullable().optional(),
    }),
    handler: async (input, context) => {
      const sessionId = context.cookies.get(lucia.sessionCookieName)?.value;
      if (!sessionId) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'No session found' });
      }

      const { user } = await lucia.validateSession(sessionId);
      if (!user) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Invalid session' });
      }

      try {
        await db.update(users)
          .set({
            displayName: input.displayName || null,
            bio: input.bio || null,
            avatarUrl: input.avatarUrl || null,
          })
          .where(eq(users.id, user.id));

        return { success: true };
      } catch (e) {
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update profile' });
      }
    },
  }),
};

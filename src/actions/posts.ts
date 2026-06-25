import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const postActions = {
  createPost: defineAction({
    accept: 'form',
    input: z.object({
      title: z.string(),
      content: z.string(),
      tags: z.string(),
    }),
    handler: async (input, context) => {
      // Create post logic here
      return { success: true };
    }
  }),
  deletePost: defineAction({
    input: z.object({ id: z.string() }),
    handler: async (input, context) => {
      return { success: true };
    }
  }),
  getSignedUrl: defineAction({
    input: z.object({ filename: z.string(), contentType: z.string() }),
    handler: async (input, context) => {
      // Generate signed URL logic
      return { url: 'https://dummy-signed-url.com' };
    }
  })
};
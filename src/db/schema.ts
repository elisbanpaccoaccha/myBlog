import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('Users', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  password_hash: text('password_hash').notNull(),
  role: text('role').default('AUTHOR').notNull(),
});

export const sessions = sqliteTable('Sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: integer('expires_at').notNull(),
});

export const posts = sqliteTable('Posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').unique().notNull(),
  excerpt: text('excerpt'),
  coverImage: text('coverImage'),
  content: text('content').notNull(),
  authorId: text('authorId').references(() => users.id).notNull(),
  published: integer('published').default(0).notNull(),
  status: text('status').default('DRAFT').notNull(),
  readingTime: integer('readingTime').default(1).notNull(),
  publishedAt: text('publishedAt'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const tags = sqliteTable('Tags', {
  id: text('id').primaryKey(),
  name: text('name').unique().notNull(),
  slug: text('slug').unique().notNull(),
});

export const postTags = sqliteTable('PostTags', {
  postId: text('postId').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  tagId: text('tagId').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tagId] }),
}));

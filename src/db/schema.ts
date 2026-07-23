import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('Users', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  email: text('email').unique().notNull(),
  emailVerified: integer('emailVerified').default(0).notNull(),
  password_hash: text('password_hash').notNull(),
  role: text('role').default('USER').notNull(),
  displayName: text('displayName'),
  bio: text('bio'),
  avatarUrl: text('avatarUrl'),
});

export const emailVerificationTokens = sqliteTable('EmailVerificationTokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expiresAt: integer('expires_at').notNull(),
});

export const passwordResetTokens = sqliteTable('PasswordResetTokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  code: text('code').notNull(),
  expiresAt: integer('expires_at').notNull(),
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

export const bookmarks = sqliteTable('Bookmarks', {
  userId: text('userId').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId: text('postId').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  createdAt: text('createdAt').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.postId] }),
}));

export const likes = sqliteTable('Likes', {
  userId: text('userId').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId: text('postId').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  count: integer('count').default(1).notNull(),
  createdAt: text('createdAt').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.postId] }),
}));

export const comments = sqliteTable('Comments', {
  id: text('id').primaryKey(),
  userId: text('userId').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId: text('postId').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  parentId: text('parentId'),
  content: text('content').notNull(),
  isDeleted: integer('isDeleted').default(0).notNull(),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const commentLikes = sqliteTable('CommentLikes', {
  userId: text('userId').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  commentId: text('commentId').references(() => comments.id, { onDelete: 'cascade' }).notNull(),
  count: integer('count').default(1).notNull(),
  createdAt: text('createdAt').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.commentId] }),
}));

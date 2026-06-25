import { defineDb, defineTable, column } from 'astro:db';

const Users = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    username: column.text({ unique: true }),
    password_hash: column.text(),
  }
});

const Sessions = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text({ references: () => Users.columns.id }),
    expiresAt: column.number(),
  }
});

const Posts = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    title: column.text(),
    slug: column.text({ unique: true }),
    content: column.text(),
    authorId: column.text({ references: () => Users.columns.id }),
    publishedAt: column.date({ optional: true }),
  }
});

const Tags = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    name: column.text({ unique: true }),
  }
});

const PostTags = defineTable({
  columns: {
    postId: column.text({ references: () => Posts.columns.id }),
    tagId: column.text({ references: () => Tags.columns.id }),
  }
});

export default defineDb({
  tables: {
    Users,
    Sessions,
    Posts,
    Tags,
    PostTags,
  }
});
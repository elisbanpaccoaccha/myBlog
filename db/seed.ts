import { db, Users, Posts, Tags, PostTags } from 'astro:db';

export default async function seed() {
  await db.insert(Users).values({
    id: 'user-1',
    username: 'admin',
    password_hash: 'hash-for-testing-only' // In production, use a secure hash
  });

  await db.insert(Posts).values({
    id: 'post-1',
    title: 'Hello World',
    slug: 'hello-world',
    content: '<p>Welcome to my Astro blog!</p>',
    authorId: 'user-1',
    publishedAt: new Date(),
  });
}
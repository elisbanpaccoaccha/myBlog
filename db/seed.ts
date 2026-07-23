import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../src/db/schema.ts';
import { scrypt, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL || 'file:.astro/content.db';
  const authToken = process.env.TURSO_AUTH_TOKEN;
  
  console.log(`Seeding database at: ${url}`);
  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });

  // Limpiar datos existentes
  await db.delete(schema.postTags);
  await db.delete(schema.tags);
  await db.delete(schema.posts);
  await db.delete(schema.sessions);
  await db.delete(schema.users);

  // ─── Usuario Admin ─────────────────────────────────────────────────────────
  const adminPasswordHash = await hashPassword('admin1234');
  await db.insert(schema.users).values({
    id:            'user-admin-001',
    username:      'admin',
    email:         'admin@myblog.com',
    emailVerified: 1,
    password_hash: adminPasswordHash,
    role:          'ADMIN',
  });

  // ─── Etiquetas ──────────────────────────────────────────────────────────────
  await db.insert(schema.tags).values([
    { id: 'tag-astro',      name: 'Astro',      slug: 'astro' },
    { id: 'tag-typescript', name: 'TypeScript', slug: 'typescript' },
    { id: 'tag-webdev',     name: 'Web Dev',    slug: 'web-dev' },
    { id: 'tag-tutorial',   name: 'Tutorial',   slug: 'tutorial' },
  ]);

  // ─── Artículo de prueba con JSON de TipTap ──────────────────────────────────
  const sampleContent = JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '¿Qué es Astro?' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Astro es un framework web moderno diseñado para construir sitios orientados al contenido con el máximo rendimiento posible.',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Con la arquitectura de ' },
          { type: 'text', marks: [{ type: 'bold' }], text: 'Islas de Componentes' },
          {
            type: 'text',
            text: ', solo el JavaScript necesario se envía al navegador, haciendo los sitios extremadamente rápidos.',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Características Principales' }],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', marks: [{ type: 'bold' }], text: 'Cero JS por defecto:' },
                  { type: 'text', text: ' El HTML se renderiza en el servidor.' },
                ],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', marks: [{ type: 'bold' }], text: 'Multi-framework:' },
                  {
                    type: 'text',
                    text: ' Usa React, Vue, Svelte o Solid en el mismo proyecto.',
                  },
                ],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', marks: [{ type: 'bold' }], text: 'Content-first:' },
                  {
                    type: 'text',
                    text: ' Optimizado para blogs, documentación y sitios de marketing.',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  const now = new Date().toISOString();

  await db.insert(schema.posts).values({
    id:          'post-hello-astro-001',
    title:       'Introducción a Astro: El Framework del Futuro',
    slug:        'introduccion-a-astro',
    excerpt:     'Descubre cómo Astro revoluciona el desarrollo web con su arquitectura de Islas de Componentes y rendimiento excepcional.',
    coverImage:  null,
    content:     sampleContent,
    authorId:    'user-admin-001',
    published:   1,
    readingTime: 4,
    publishedAt: now,
    createdAt:   now,
    updatedAt:   now,
  });

  // ─── Relaciones Post ↔ Tag ───────────────────────────────────────────────────
  await db.insert(schema.postTags).values([
    { postId: 'post-hello-astro-001', tagId: 'tag-astro' },
    { postId: 'post-hello-astro-001', tagId: 'tag-webdev' },
    { postId: 'post-hello-astro-001', tagId: 'tag-tutorial' },
  ]);

  console.log('Database seeded successfully!');
}

main().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
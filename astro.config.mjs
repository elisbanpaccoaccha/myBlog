import { defineConfig } from 'astro/config';
import db from '@astrojs/db';
import react from '@astrojs/react';
import tailwind from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [
    db(),
    react()
  ],
  vite: {
    plugins: [tailwind()]
  }
  // adapter: node() or cloudflare() based on deployment target
});
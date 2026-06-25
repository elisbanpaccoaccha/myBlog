import { defineConfig } from 'astro/config';
import db from '@astrojs/db';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [
    db(),
    react()
  ],
  // adapter: node() or cloudflare() based on deployment target
});
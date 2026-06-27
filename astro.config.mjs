import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [
    react()
  ],
  vite: {
    plugins: [tailwind()],
    ssr: {
      noExternal: ['react-tweet']
    }
  }
  // adapter: node() or cloudflare() based on deployment target
});
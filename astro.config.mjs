// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  markdown: {
    // Puedes usar temas como 'dracula', 'github-dark', 'monokai', etc.
    shikiConfig: {
      theme: 'dracula',
    },
  },
});
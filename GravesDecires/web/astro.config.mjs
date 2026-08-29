// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// NOTE: this prototype reads canonical corpus files directly from the parent
// repository (../data, ../content) instead of duplicating them inside web/.
// vite.server.fs.allow is widened to the repo root so those files can be
// read at build/dev time without copying them.
export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    server: {
      fs: {
        allow: ['..'],
      },
    },
  },
});
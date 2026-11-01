import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { alias, buildDefaults, define } from './vite.shared';

// Classic IIFE: content scripts cannot be ES modules.
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  resolve: { alias },
  define,
  build: {
    ...buildDefaults,
    lib: {
      entry: 'src/content/index.ts',
      name: 'AppScouteContent',
      formats: ['iife'],
      fileName: () => 'content.js',
    },
  },
});

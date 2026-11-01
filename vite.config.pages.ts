import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { alias, buildDefaults, workspaceRoot } from './vite.shared';

// Popup and options are ordinary extension pages, so they keep ES modules and
// Vite's normal asset pipeline.
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  base: './',
  resolve: { alias },
  build: {
    ...buildDefaults,
    rollupOptions: {
      input: {
        popup: 'popup.html',
        options: 'options.html',
      },
    },
  },
  // The pages share the core package sources that live outside this folder.
  server: { fs: { allow: [workspaceRoot] } },
});

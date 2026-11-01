import { defineConfig } from 'vite';
import { alias, buildDefaults, define, stubPdfjs } from './vite.shared';

// Mellowtel's documented browser integration needs its own content script on
// <all_urls> at document_start. Classic IIFE, same as the sidebar script.
export default defineConfig({
  plugins: [stubPdfjs()],
  publicDir: false,
  resolve: { alias },
  define,
  build: {
    ...buildDefaults,
    lib: {
      entry: 'src/mellowtel/content.ts',
      name: 'AppScouteMellowtel',
      formats: ['iife'],
      fileName: () => 'mellowtel-content.js',
    },
  },
});

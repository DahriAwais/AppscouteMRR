import { defineConfig } from 'vite';
import { alias, buildDefaults, define, stubPdfjs } from './vite.shared';

// The MV3 service worker is registered as a classic script (no "type": "module"),
// so it is bundled as a single IIFE with pdf.js stubbed out.
export default defineConfig({
  plugins: [stubPdfjs()],
  publicDir: false,
  resolve: { alias },
  define,
  build: {
    ...buildDefaults,
    lib: {
      entry: 'src/background/index.ts',
      name: 'AppScouteBackground',
      formats: ['iife'],
      fileName: () => 'background.js',
    },
  },
});

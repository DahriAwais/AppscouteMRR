import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));

export const extensionRoot = here;
export const workspaceRoot = path.resolve(here, '..');

export const alias = {
  '@core': path.resolve(workspaceRoot, 'packages/core/src'),
  '@': path.resolve(here, 'src'),
};

/** The extension's own Mellowtel integration id. */
export const integrationId = (process.env.MELLOWTEL_INTEGRATION_ID ?? 'intgr-i0jY4yD9V9').trim();

export const define = {
  __MELLOWTEL_KEY__: JSON.stringify(integrationId),
  /**
   * Vite leaves `process.env.NODE_ENV` untouched in library builds, and there is
   * no `process` object inside a page: React's own dev/prod switch would throw
   * ReferenceError while the injected script is still loading, so nothing after
   * it (including the sidebar) would ever run. Inline it for every bundle.
   */
  'process.env.NODE_ENV': JSON.stringify('production'),
};

export const buildDefaults = {
  outDir: 'dist',
  emptyOutDir: false,
  target: 'chrome120',
  sourcemap: false,
  minify: 'esbuild' as const,
};

/**
 * Mellowtel lazily imports pdf.js to extract text from PDFs, which is not a
 * feature this extension uses. Replacing the module keeps the service worker a
 * single classic script with no dynamic import or extra chunk.
 */
export function stubPdfjs(): Plugin {
  const id = '\0appscoute:pdfjs-stub';
  return {
    name: 'appscoute:pdfjs-stub',
    enforce: 'pre',
    resolveId(source) {
      return source.startsWith('pdfjs-dist') ? id : null;
    },
    load(source) {
      if (source !== id) return null;
      return 'export function getDocument() { return Promise.reject(new Error("PDF text extraction is not bundled in this build.")); }\nexport default { getDocument };\n';
    },
  };
}

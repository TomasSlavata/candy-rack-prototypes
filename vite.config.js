import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Every top-level folder with an index.html is a prototype.
// Add a new prototype = create a new folder, nothing to register here.
const IGNORED = new Set(['shared', 'node_modules', 'dist', 'public']);

const prototypes = readdirSync(import.meta.dirname, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
  .map((entry) => entry.name)
  .filter((name) => !IGNORED.has(name))
  .filter((name) => existsSync(resolve(import.meta.dirname, name, 'index.html')))
  .sort();

export default defineConfig({
  plugins: [react()],
  // Relative paths, so the build works on GitHub Pages under /candy-rack-prototypes/
  base: './',
  define: {
    __PROTOTYPES__: JSON.stringify(prototypes),
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        ...Object.fromEntries(
          prototypes.map((name) => [name, resolve(import.meta.dirname, name, 'index.html')]),
        ),
      },
    },
  },
});

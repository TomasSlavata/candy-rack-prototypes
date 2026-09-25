import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const root = import.meta.dirname;

// Structure: <feature>/<part>/index.html, e.g. reward-bar/admin-slide-cart/index.html
// Add a feature or part = create a folder, nothing to register here.
// Folders starting with "_" (like _template) are local-only: visible in `npm run dev`, never published.
const IGNORED = new Set(['shared', 'node_modules', 'dist', 'public']);
const PART_ORDER = ['admin-', 'theme-editor', 'storefront-'];

const subfolders = (dir) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name);

const partRank = (part) => {
  const rank = PART_ORDER.findIndex((prefix) => part.startsWith(prefix));
  return rank === -1 ? PART_ORDER.length : rank;
};

const features = subfolders(root)
  .filter((name) => !IGNORED.has(name))
  .map((slug) => ({
    slug,
    localOnly: slug.startsWith('_'),
    parts: subfolders(resolve(root, slug))
      .filter((part) => existsSync(resolve(root, slug, part, 'index.html')))
      .sort((a, b) => partRank(a) - partRank(b) || a.localeCompare(b)),
  }))
  .filter((feature) => feature.parts.length > 0)
  .sort((a, b) => a.slug.localeCompare(b.slug));

const published = features.filter((feature) => !feature.localOnly);

export default defineConfig({
  plugins: [react()],
  // Relative paths, so the build works on GitHub Pages under /candy-rack-prototypes/
  base: './',
  define: {
    __FEATURES__: JSON.stringify(features),
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(root, 'index.html'),
        ...Object.fromEntries(
          published.flatMap(({ slug, parts }) =>
            parts.map((part) => [`${slug}__${part}`, resolve(root, slug, part, 'index.html')]),
          ),
        ),
      },
    },
  },
});

// The library build: two ES-module entries in `lib/`, React and Storybook left to the app. Types
// come from tsconfig.lib.json.
//
// - `index` (`src/library/index.ts`, the package's `.`) → `lib/index.js`, and every library
//   stylesheet in `lib/zen.css`.
// - `storybook` (`src/library/storybook.tsx`, `./storybook`: toolbar globals and decorators for an
//   app's own Storybook) → `lib/storybook.js`. Its own entry, so the main one never reaches it.
// - `svelte` (`src/library/svelte.ts`, `./svelte`: the Svelte 5 renderers and the theme action) →
//   `lib/svelte.js`, compiled here by vite-plugin-svelte against `svelte` (external, a peer at the
//   compiler's minor or later), and `storybook-svelte` (`./storybook-svelte`) → `lib/storybook-svelte.js`.
//
// Code the entries share is in shared chunks, `lib/chunks/zen-*.js`, so an app importing both
// gets one copy. CSS is split per chunk (`cssCodeSplit`), and `joinStyles` then gathers every
// chunk's stylesheet into `zen.css`.
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/** Gathers every chunk's stylesheet into `zen.css`, shared chunks first. */
function joinStyles(): Plugin {
  return {
    name: 'zen-join-styles',
    apply: 'build',
    generateBundle(_options, bundle) {
      const target = 'zen.css';
      const parts: string[] = [];
      const chunks = Object.values(bundle).filter((f) => f.type === 'chunk');
      // Shared chunks first (theme.tsx's library.css leads zen.css), then the entries' own.
      const order = [...chunks].sort((a, b) => Number(a.isEntry) - Number(b.isEntry));
      for (const chunk of order) {
        for (const name of chunk.viteMetadata?.importedCss ?? []) {
          const asset = bundle[name];
          if (asset?.type !== 'asset') continue;
          parts.push(String(asset.source));
          // A stylesheet already named zen.css is rewritten below.
          if (name === target) continue;
          delete bundle[name];
          chunk.viteMetadata?.importedCss.delete(name);
        }
      }
      const existing = bundle[target];
      if (existing?.type === 'asset') existing.source = parts.join('\n');
      else this.emitFile({ type: 'asset', fileName: target, source: parts.join('\n') });
    },
  };
}

export default defineConfig({
  plugins: [react(), svelte(), joinStyles()],
  publicDir: false,
  build: {
    outDir: 'lib',
    emptyOutDir: true,
    copyPublicDir: false,
    cssCodeSplit: true,
    sourcemap: true,
    lib: {
      entry: {
        index: 'src/library/index.ts',
        storybook: 'src/library/storybook.tsx',
        svelte: 'src/library/svelte.ts',
        'storybook-svelte': 'src/library/storybook-svelte.ts',
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: [/^react(\/.*)?$/, /^react-dom(\/.*)?$/, /^svelte(\/.*)?$/, /^storybook(\/.*)?$/, /^@storybook\//],
      output: { chunkFileNames: 'chunks/zen-[hash].js', assetFileNames: '[name][extname]' },
    },
  },
});

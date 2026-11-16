// The Hotwire build (`@satoramoto/zen/hotwire`): `src/library/hotwire.ts` as one ES module an import
// map pins whole, for a server-rendered app with no bundler (Rails 8: importmap and Propshaft).
// Run after the library build (`npm run build:lib`), into `lib/hotwire/`:
//
// - `zen.js`: the Stimulus controllers, the DOM renderer and the core parts, no code split; its
//   imports are `@hotwired/stimulus`, which the app already pins, and `lightweight-charts`, loaded
//   only when a chart mounts, which the app pins from the file zen-vendor copies (`check:lib`).
// - `zen.css`: the scope's rules and every bundled part's stylesheet.
// - `themes/<pack>.css`: each pack's custom properties, light and dark, under
//   `.lib-scope[data-zen-pack="<pack>"][data-mode="…"]`, so a page that keeps one pack can skip the
//   inline properties `zen-theme` also sets.
import { defineConfig, type Plugin } from 'vite';
import { sharedAliases } from './vite.aliases';
import { joinStyles } from './vite.lib.config';
import { packs } from './src/library/foundation/themes/packs';
import { toCssVars } from './src/library/contract';

/** Fails the build when anything it bundles reaches React or Svelte: the DOM renderer draws without them. */
function noFrameworks(): Plugin {
  return {
    name: 'zen-hotwire-no-frameworks',
    enforce: 'pre',
    resolveId(id, importer) {
      if (/^(?:react(?:-dom)?|svelte)(?:\/.*)?$/.test(id)) this.error(`the Hotwire build reaches "${id}" from ${importer}: the DOM renderer and its parts never import React or Svelte`);
      return null;
    },
  };
}

/** One stylesheet per pack: its light and dark custom properties. */
function packStyles(): Plugin {
  return {
    name: 'zen-pack-styles',
    apply: 'build',
    generateBundle() {
      for (const pack of packs) {
        const rules = (['light', 'dark'] as const).map((mode) => {
          const vars = Object.entries(toCssVars(pack.facets, mode)).map(([name, value]) => `  ${name}: ${value};`);
          return `.lib-scope[data-zen-pack="${pack.id}"][data-mode="${mode}"] {\n${vars.join('\n')}\n}`;
        });
        this.emitFile({ type: 'asset', fileName: `themes/${pack.id}.css`, source: `/* ${pack.label}: zen's \`${pack.id}\` pack, light and dark. */\n${rules.join('\n\n')}\n` });
      }
    },
  };
}

export default defineConfig({
  plugins: [noFrameworks(), joinStyles(), packStyles()],
  resolve: { alias: sharedAliases },
  publicDir: false,
  build: {
    outDir: 'lib/hotwire',
    emptyOutDir: true,
    copyPublicDir: false,
    cssCodeSplit: true,
    sourcemap: true,
    minify: true,
    lib: {
      entry: { zen: 'src/library/hotwire.ts' },
      formats: ['es'],
      fileName: () => 'zen.js',
    },
    rollupOptions: {
      external: ['@hotwired/stimulus', 'lightweight-charts'],
      output: { inlineDynamicImports: true, assetFileNames: '[name][extname]' },
    },
  },
});

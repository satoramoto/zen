// The library build: two ES-module entries in `lib/`, React left to the app. Types come from
// tsconfig.lib.json.
//
// - `index` (`src/library/index.ts`, the package's `.`) → `lib/index.js`, and every library
//   stylesheet in `lib/zen.css`.
// - `visuals` (`src/library/visuals/index.ts`, `./visuals`: visual[flow]'s app on zen) →
//   `lib/visuals.js`, and only visuals' own stylesheets (those under `src/library/visuals/`) in
//   `lib/visuals.css`. The app imports both stylesheets; no rule is in both.
//
// Library code both entries use is one shared chunk, `lib/chunks/zen-*.js`, so an app importing
// both gets one copy. CSS is split per chunk (`cssCodeSplit`) and `splitStyles` then joins every
// stylesheet but the visuals entry's into `zen.css`.
import { resolve, sep } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const VISUALS_DIR = resolve('src/library/visuals') + sep;

/** Joins every chunk's stylesheet but the visuals entry's into `zen.css`, and keeps library styles out of `visuals.css`. */
function splitStyles(): Plugin {
  return {
    name: 'zen-split-styles',
    apply: 'build',
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle).filter((f) => f.type === 'chunk');
      const visuals = chunks.find((c) => c.isEntry && c.name === 'visuals');
      if (!visuals) return this.error('no visuals entry chunk');
      const strays = visuals.moduleIds.filter((id) => /\.css($|\?)/.test(id) && !id.startsWith(VISUALS_DIR));
      if (strays.length)
        this.error(`library stylesheets only the visuals entry reaches would land in visuals.css; export their components from src/library/index.ts:\n${strays.join('\n')}`);
      const visualsCss = new Set(visuals.viteMetadata?.importedCss ?? []);
      // The shared chunk's first (theme.tsx's library.css), then the index entry's own.
      const order = [...chunks].sort((a, b) => Number(a.isEntry) - Number(b.isEntry));
      const parts: string[] = [];
      for (const chunk of order)
        for (const name of chunk.viteMetadata?.importedCss ?? []) {
          if (visualsCss.has(name)) continue;
          const asset = bundle[name];
          if (asset?.type !== 'asset') continue;
          parts.push(String(asset.source));
          delete bundle[name];
          chunk.viteMetadata?.importedCss.delete(name);
        }
      this.emitFile({ type: 'asset', fileName: 'zen.css', source: parts.join('\n') });
      for (const name of visualsCss) {
        const asset = bundle[name];
        if (asset?.type !== 'asset' || name === 'visuals.css') continue;
        delete bundle[name];
        this.emitFile({ type: 'asset', fileName: 'visuals.css', source: asset.source });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), splitStyles()],
  publicDir: false,
  build: {
    outDir: 'lib',
    emptyOutDir: true,
    copyPublicDir: false,
    cssCodeSplit: true,
    sourcemap: true,
    lib: {
      entry: { index: 'src/library/index.ts', visuals: 'src/library/visuals/index.ts' },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: [/^react(\/.*)?$/, /^react-dom(\/.*)?$/],
      output: { chunkFileNames: 'chunks/zen-[hash].js', assetFileNames: '[name][extname]' },
    },
  },
});

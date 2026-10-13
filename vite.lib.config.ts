// The library build: four ES-module entries in `lib/`, React and Storybook left to the app. Types
// come from tsconfig.lib.json.
//
// - `index` (`src/library/index.ts`, the package's `.`) → `lib/index.js`, and every library
//   stylesheet in `lib/zen.css`.
// - `storybook` (`src/library/storybook.tsx`, `./storybook`: toolbar globals and decorators for an
//   app's own Storybook) → `lib/storybook.js`. Its own entry, so the main one never reaches it.
// - `visuals` (`src/library/visuals/index.ts`, `./visuals`: visual[flow]'s app on zen) →
//   `lib/visuals.js`, and visuals' own stylesheets (those under `src/library/visuals/`) in
//   `lib/visuals.css`. The app imports both stylesheets; no rule is in both.
// - `visuals-lab` (`src/library/visuals/lab.ts`, `./visuals/lab`: the preset editor, for a lab
//   build only) → `lib/visuals-lab.js`, and the stylesheets only it reaches in
//   `lib/visuals-lab.css`. Its own entry, so an app built without the lab bundles none of it.
//
// Code entries share is in shared chunks, `lib/chunks/zen-*.js`, so an app importing several
// gets one copy. CSS is split per chunk (`cssCodeSplit`), and `splitStyles` then sorts each
// chunk's stylesheet by where its sources live: the lab entry's into `visuals-lab.css`, any other
// chunk whose stylesheets are all under `src/library/visuals/` into `visuals.css`, the rest into
// `zen.css`.
import { resolve, sep } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const VISUALS_DIR = resolve('src/library/visuals') + sep;
const isCss = (id: string) => /\.css($|\?)/.test(id);

/** Sorts every chunk's stylesheet into `zen.css`, `visuals.css` or `visuals-lab.css`, and fails on a chunk that mixes library and visuals styles. */
function splitStyles(): Plugin {
  return {
    name: 'zen-split-styles',
    apply: 'build',
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle).filter((f) => f.type === 'chunk');
      const visuals = chunks.find((c) => c.isEntry && c.name === 'visuals');
      const lab = chunks.find((c) => c.isEntry && c.name === 'visuals-lab');
      if (!visuals || !lab) return this.error('no visuals or visuals-lab entry chunk');
      for (const entry of [visuals, lab]) {
        const strays = entry.moduleIds.filter((id) => isCss(id) && !id.startsWith(VISUALS_DIR));
        if (strays.length)
          this.error(`library stylesheets only the ${entry.name} entry reaches would land in its stylesheet; export their components from src/library/index.ts:\n${strays.join('\n')}`);
      }
      const out: Record<'zen.css' | 'visuals.css' | 'visuals-lab.css', string[]> = { 'zen.css': [], 'visuals.css': [], 'visuals-lab.css': [] };
      // Shared chunks first (theme.tsx's library.css leads zen.css), then the entries' own.
      const order = [...chunks].sort((a, b) => Number(a.isEntry) - Number(b.isEntry));
      for (const chunk of order) {
        const css = chunk.moduleIds.filter(isCss);
        const inVisuals = css.filter((id) => id.startsWith(VISUALS_DIR)).length;
        if (inVisuals && inVisuals !== css.length)
          this.error(`chunk ${chunk.fileName} mixes library and visuals stylesheets:\n${css.join('\n')}`);
        const target = chunk === lab ? 'visuals-lab.css' : inVisuals ? 'visuals.css' : 'zen.css';
        for (const name of chunk.viteMetadata?.importedCss ?? []) {
          const asset = bundle[name];
          if (asset?.type !== 'asset') continue;
          out[target].push(String(asset.source));
          // An entry's own stylesheet already has the target's name: it is rewritten below.
          if (name === target) continue;
          delete bundle[name];
          chunk.viteMetadata?.importedCss.delete(name);
        }
      }
      for (const [fileName, parts] of Object.entries(out)) {
        const existing = bundle[fileName];
        if (existing?.type === 'asset') existing.source = parts.join('\n');
        else this.emitFile({ type: 'asset', fileName, source: parts.join('\n') });
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
      entry: { index: 'src/library/index.ts', storybook: 'src/library/storybook.tsx', visuals: 'src/library/visuals/index.ts', 'visuals-lab': 'src/library/visuals/lab.ts' },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: [/^react(\/.*)?$/, /^react-dom(\/.*)?$/, /^storybook(\/.*)?$/, /^@storybook\//],
      output: { chunkFileNames: 'chunks/zen-[hash].js', assetFileNames: '[name][extname]' },
    },
  },
});

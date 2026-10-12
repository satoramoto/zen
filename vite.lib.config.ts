// The library build: `src/library/index.ts` as an ES module in `lib/`, React left to the app, and
// every stylesheet the library imports extracted to one `lib/zen.css`. Types come from tsconfig.lib.json.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'lib',
    emptyOutDir: true,
    copyPublicDir: false,
    cssCodeSplit: false,
    sourcemap: true,
    lib: {
      entry: 'src/library/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
      cssFileName: 'zen',
    },
    rollupOptions: {
      external: [/^react(\/.*)?$/, /^react-dom(\/.*)?$/],
    },
  },
});

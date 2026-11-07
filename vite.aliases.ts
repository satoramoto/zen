import { fileURLToPath } from 'node:url';
import type { Alias } from 'vite';

/**
 * Module aliases every Vite build here shares (the app, Vitest, the library build, Storybook).
 *
 * `use-resize-observer`: mafs 0.21 imports the hook as a v9 default export, but v9's peer range
 * stops at React 18 (npm warns on every install under React 19) and v10, which accepts React 19,
 * has a named export only. npm installs v10 (`overrides` in package.json, so the install is
 * clean) and the bundlers resolve the bare import to `vendor/use-resize-observer`, the same hook
 * with both exports. Drop both once mafs imports the named export.
 */
export const sharedAliases: Alias[] = [
  { find: /^use-resize-observer$/, replacement: fileURLToPath(new URL('./vendor/use-resize-observer/index.js', import.meta.url)) },
];

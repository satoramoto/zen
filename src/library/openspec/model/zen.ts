// Zen's own OpenSpec root, read at build time: every file under /openspec, keyed by its path
// relative to that folder. The dogfood: the stories render the spec of the thing drawing them.
import type { Files } from './repo';

const raw = import.meta.glob('/openspec/**/*.{md,yaml,yml}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const ZEN_FILES: Files = Object.fromEntries(Object.entries(raw).map(([path, source]) => [path.replace(/^\/openspec\//, ''), source]));

import type { IndexedStory } from './select.mjs';
export const INSTALL: string;
export type Played = { story: IndexedStory; ok: boolean; ms: number; problems: string[] };
export function playInBrowser(options: { base: string; stories: IndexedStory[]; workers: number; timeout: number; report: (result: Played) => void }): Promise<null | { why: string; fix: string }>;
export function serveBuilt(dir: string): Promise<{ url: string; close: () => Promise<void> }>;

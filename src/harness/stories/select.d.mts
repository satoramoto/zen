/** A story as Storybook's index lists it. */
export type IndexedStory = { id: string; title: string; name: string; tags?: string[]; importPath: string; exportName: string };
export type Plan = { virtual: IndexedStory[]; browser: IndexedStory[]; skipped: { story: IndexedStory; why: string }[] };
export function storyIndex(configDir: string): Promise<IndexedStory[]>;
export function matching<S extends { id: string; title: string }>(stories: S[], prefixes: string[]): S[];
export function plan(stories: IndexedStory[], options: { mode: 'local' | 'no-browser' | 'browser-all'; stage: boolean }): Plan;
export function fileOf(root: string, story: IndexedStory): string;

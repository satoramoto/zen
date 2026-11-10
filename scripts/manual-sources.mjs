import { sourceIdentity } from 'story-spec/walkthrough/node';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export const manualSettings = { viewport: { width: 1280, height: 800 }, theme: 'textbook-console' };
/** Inputs shared by capture and publication; callers compute these independently. */
export async function manualSources(root) {
  const toolkit = createHash('sha256');
  for (const entry of ['story-spec', 'story-spec/walkthrough', 'story-spec/walkthrough/node', 'story-spec/walkthrough/capture']) toolkit.update(await readFile(new URL(import.meta.resolve(entry))));
  return { product: await sourceIdentity(root, ['src', '.storybook', 'package-lock.json', 'vite.aliases.ts', 'scripts/capture-manual.mjs', 'scripts/manual-sources.mjs', 'scripts/build-storybook.mjs'], { ...manualSettings, toolkit: toolkit.digest('hex') }) };
}

import { sourceIdentity } from 'story-spec/walkthrough/node';
export const manualSettings = { viewport: { width: 1280, height: 800 }, theme: 'textbook-console' };
/** Inputs shared by capture and publication; callers compute these independently. */
export async function manualSources(root) {
  return { product: await sourceIdentity(root, ['src/library/site', 'package-lock.json', 'scripts/capture-manual.mjs', 'scripts/manual-sources.mjs'], manualSettings) };
}

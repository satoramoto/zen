// Which stories a run plays, and where: the project's story index as Storybook builds it, cut
// down by prefix and sorted into the virtual DOM, the browser and the skipped.
import path from 'node:path';

/** Every story of the project, from Storybook's own indexer: no server, no module loaded. */
export async function storyIndex(configDir) {
  const { buildIndex } = await import('storybook/internal/core-server');
  const index = await buildIndex({ configDir });
  return Object.values(index.entries).filter((e) => e.type === 'story').sort((a, b) => a.id.localeCompare(b.id));
}

/** Every `count`th story from the `index`th (1-based), so `count` runs share the stories evenly. */
export function shard(stories, index, count) {
  return stories.filter((_, k) => k % count === index - 1);
}

/** Stories whose id or title starts with one of `prefixes`; all of them when none is given. */
export function matching(stories, prefixes) {
  if (!prefixes.length) return stories;
  return stories.filter((s) => prefixes.some((p) => s.id.startsWith(p) || s.title.startsWith(p)));
}

const has = (story, tag) => (story.tags ?? []).includes(tag);

/**
 * Sorts stories into `virtual` (played on the virtual DOM), `browser` (played in the headless
 * shell) and `skipped` ({ story, why }). A story without Storybook's `test` tag is never played.
 *   mode 'local'       the default: `browser` stories in the browser, the rest on the virtual DOM
 *   mode 'no-browser'  `browser` stories are skipped
 *   mode 'browser-all' everything in the browser
 * `stage` says whether a stage server answers (and, for the browser, whether the Storybook
 * being played is one with a stage): without it `stage` stories are skipped.
 */
export function plan(stories, { mode, stage }) {
  const out = { virtual: [], browser: [], skipped: [] };
  for (const story of stories) {
    const inBrowser = mode === 'browser-all' || has(story, 'browser');
    // Storybook gives every story the `test` tag unless it is tagged `!test`: such a story is
    // played by something else, or by no one.
    if (!has(story, 'test')) out.skipped.push({ story, why: 'not a test (tagged !test)' });
    else if (has(story, 'stage') && !stage) out.skipped.push({ story, why: 'no stage server answers' });
    else if (inBrowser && mode === 'no-browser') out.skipped.push({ story, why: 'needs a browser' });
    else (inBrowser ? out.browser : out.virtual).push(story);
  }
  return out;
}

/** A story's file, absolute. The index gives it relative to the project. */
export const fileOf = (root, story) => path.resolve(root, story.importPath);

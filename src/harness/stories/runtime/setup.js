// Runs inside Vitest before each stories file, after `standins.js`: applies the project's own
// Storybook preview, and ends each story with its test.
import { afterEach, beforeAll } from 'vitest';
import { composeStory, setProjectAnnotations } from 'virtual:zen-stories/framework';
import * as preview from 'virtual:zen-stories/preview';

// For stage stories: where the Omarchy stage is served (there is no page whose origin it could
// be), that nothing draws here, and the requests that close sessions, awaited after each story.
globalThis.__OMARCHY_STAGE__ = { url: process.env.ZEN_STORIES_STAGE_URL || undefined, headless: true, closing: new Set() };

const { default: byDefault, ...named } = preview;
const annotations = setProjectAnnotations([byDefault ?? named]);
beforeAll(() => annotations.beforeAll?.());

// A composed story is unmounted when the next one runs. Running an empty story after each one
// unmounts it now, so a story's effects end (a stage story's session closes) with its test.
const nothing = composeStory({ render: () => null }, { title: 'zen-stories/nothing' });
afterEach(async () => {
  await nothing.run().catch(() => {});
  await Promise.allSettled([...globalThis.__OMARCHY_STAGE__.closing]);
});

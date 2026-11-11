// Runs inside Vitest before each stories file, after `standins.js`: applies the project's own
// Storybook preview, and ends each story with its test.
import { afterEach, beforeAll } from 'vitest';
import { composeStory, setProjectAnnotations } from 'virtual:zen-stories/framework';
import * as preview from 'virtual:zen-stories/preview';

// Where the Omarchy stage is served, for stage stories: there is no page whose origin it could be.
if (process.env.ZEN_STORIES_STAGE_URL) globalThis.__OMARCHY_STAGE_URL__ = process.env.ZEN_STORIES_STAGE_URL;

const { default: byDefault, ...named } = preview;
const annotations = setProjectAnnotations([byDefault ?? named]);
beforeAll(() => annotations.beforeAll?.());

// A composed story is unmounted when the next one runs. Running an empty story after each one
// unmounts it now, so a story's effects end (a stage story's session closes) with its test.
const nothing = composeStory({ render: () => null }, { title: 'zen-stories/nothing' });
afterEach(async () => {
  await nothing.run().catch(() => {});
  await Promise.allSettled([...(globalThis.__OMARCHY_STAGE_CLOSING__ ?? [])]);
});

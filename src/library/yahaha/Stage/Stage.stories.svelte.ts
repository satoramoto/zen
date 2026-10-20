// Stage in the Svelte Storybook: the same story names and args as Stage.stories.tsx, from
// Stage.fixtures.ts, each in the same frame (Stage.story.svelte). The React Playground (a
// stateful story wrapper, StagePlayground.tsx) has no Svelte twin; behaviours are exercised on the
// React stories, and the parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook-svelte';
import Stage from './Stage.svelte';
import StageStory from './Stage.story.svelte';
import { stageStories as s } from './Stage.fixtures';

const meta: Meta = {
  title: 'Yahaha/Screens/Stage',
  component: Stage,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { tipAction: fn() },
};
export default meta;

/** A story: its fixture's args, drawn in the Stage's story frame. */
const story = (name: keyof typeof s) => ({
  args: s[name].args as Record<string, unknown>,
  render: (args: Record<string, unknown>) => ({ Component: StageStory, props: args }),
});

export const Board = story('Board');
export const QuickRacks = story('QuickRacks');
export const Stopped = story('Stopped');
export const Letterboxed = story('Letterboxed');
export const Pillarboxed = story('Pillarboxed');
export const Small = story('Small');
export const Narrow = story('Narrow');
export const NarrowScaled = story('NarrowScaled');
export const SplitBoard = story('SplitBoard');
export const SplitSmall = story('SplitSmall');

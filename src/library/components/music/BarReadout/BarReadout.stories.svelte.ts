// BarReadout in the Svelte Storybook: the same story names and args as BarReadout.stories.tsx, from
// BarReadout.fixtures.ts. Behaviours (the `play` functions) are exercised on the React stories; the
// parity test holds this renderer to the same DOM. Group draws its rows in a wrapping row (the
// React story stacks them).
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import BarReadout from './BarReadout.svelte';
import { barReadoutArgTypes, barReadoutArgs, barReadoutStories as s } from './BarReadout.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Music/BarReadout',
  component: BarReadout,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  args: { ...barReadoutArgs, onChange: fn() },
  argTypes: barReadoutArgTypes,
};
export default meta;

const story = fixtureStory(BarReadout);

export const Level: FixtureStory = story(s.Level);
export const Pan: FixtureStory = story(s.Pan);
export const LowFreq: FixtureStory = story(s.LowFreq);
export const Display: FixtureStory = story(s.Display);
export const Ratio: FixtureStory = story(s.Ratio);
export const Waiting: FixtureStory = story(s.Waiting);
export const Disabled: FixtureStory = story(s.Disabled);
export const Group: FixtureStory = story(s.Group);

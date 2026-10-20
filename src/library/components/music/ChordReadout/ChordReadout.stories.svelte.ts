// ChordReadout in the Svelte Storybook: the same story names and args as ChordReadout.stories.tsx,
// from ChordReadout.fixtures.ts. Behaviours (the `play` functions) are exercised on the React
// stories; the parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import ChordReadout from './ChordReadout.svelte';
import { chordReadoutArgTypes, chordReadoutArgs, chordReadoutStories as s } from './ChordReadout.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Music/ChordReadout',
  component: ChordReadout,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  args: chordReadoutArgs,
  argTypes: chordReadoutArgTypes,
};
export default meta;

const story = fixtureStory(ChordReadout);

export const Board: FixtureStory = story(s.Board);
export const Held: FixtureStory = story(s.Held);
export const Long: FixtureStory = story(s.Long);
export const LongFingering: FixtureStory = story(s.LongFingering);
export const HeroSize: FixtureStory = story(s.HeroSize);
export const Empty: FixtureStory = story(s.Empty);

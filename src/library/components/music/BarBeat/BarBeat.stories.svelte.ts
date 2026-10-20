// BarBeat in the Svelte Storybook: the same story names and args as BarBeat.stories.tsx, from
// BarBeat.fixtures.ts. Behaviours (the `play` functions) are exercised on the React stories; the
// parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import BarBeat from './BarBeat.svelte';
import { barBeatArgTypes, barBeatStories as s } from './BarBeat.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Music/BarBeat',
  component: BarBeat,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  argTypes: barBeatArgTypes,
};
export default meta;

const story = fixtureStory(BarBeat);

export const Board: FixtureStory = story(s.Board);
export const Intro: FixtureStory = story(s.Intro);
export const Stopped: FixtureStory = story(s.Stopped);
export const ThreeFour: FixtureStory = story(s.ThreeFour);
export const Sections: FixtureStory = story(s.Sections);
export const SevenEight: FixtureStory = story(s.SevenEight);
export const Thick: FixtureStory = story(s.Thick);

// PartMarks in the Svelte Storybook: the same story names and args as PartMarks.stories.tsx, from
// PartMarks.fixtures.ts. InSoundCells draws the marks of each part with any in a row (the React
// story lays them after the part and sound names). The parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import PartMarks from './PartMarks.svelte';
import { partMarksArgTypes, partMarksStories as s } from './PartMarks.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Music/PartMarks',
  component: PartMarks,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  argTypes: partMarksArgTypes,
};
export default meta;

const story = fixtureStory(PartMarks);

export const Board: FixtureStory = story(s.Board);
export const Missing: FixtureStory = story(s.Missing);
export const Failed: FixtureStory = story(s.Failed);
export const Off: FixtureStory = story(s.Off);
export const Bass: FixtureStory = story(s.Bass);
export const Strip: FixtureStory = story(s.Strip);
export const InSoundCells: FixtureStory = story(s.InSoundCells);

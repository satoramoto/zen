// SoundCell in the Svelte Storybook: the same story names and args as SoundCell.stories.tsx, from
// SoundCell.fixtures.ts. The parity test holds this renderer to the same DOM. WithMarks draws
// without the React story's StatusDot (no Svelte StatusDot yet).
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import SoundCell from './SoundCell.svelte';
import { soundCellArgs, soundCellArgTypes, soundCellStories as s } from './SoundCell.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Music/SoundCell',
  component: SoundCell,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { ...soundCellArgs, onPart: fn(), onSound: fn() },
  argTypes: soundCellArgTypes,
};
export default meta;

const story = fixtureStory(SoundCell);

export const Board: FixtureStory = story(s.Board);
export const Off: FixtureStory = story(s.Off);
export const LongName: FixtureStory = story(s.LongName);
export const WithMarks: FixtureStory = story(s.WithMarks);
export const NoNumber: FixtureStory = story(s.NoNumber);
export const Row: FixtureStory = story(s.Row);

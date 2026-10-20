// RackCell in the Svelte Storybook: the same story names and args as RackCell.stories.tsx, from
// RackCell.fixtures.ts. The parity test holds this renderer to the same DOM. Modified and LongName
// draw without the React stories' StatusDot (no Svelte StatusDot yet), and InRow without its SoundCells.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import RackCell from './RackCell.svelte';
import { rackCellArgTypes, rackCellStories as s } from './RackCell.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Music/RackCell',
  component: RackCell,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { tip: 'nav.rack', onPress: fn() },
  argTypes: rackCellArgTypes,
};
export default meta;

const story = fixtureStory(RackCell);

export const Board: FixtureStory = story(s.Board);
export const NoSlot: FixtureStory = story(s.NoSlot);
export const Modified: FixtureStory = story(s.Modified);
export const LongName: FixtureStory = story(s.LongName);
export const Empty: FixtureStory = story(s.Empty);
export const InRow: FixtureStory = story(s.InRow);

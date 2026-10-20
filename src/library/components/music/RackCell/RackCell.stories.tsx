import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, treeStory, withRenderer } from '../../../stories/story';
import { RackCell, type RackCellProps } from './RackCell';
import RackCellSvelte from './RackCell.svelte';
import { rackCellArgTypes, rackCellMarkSample, rackCellRowSample, rackCellStories as s } from './RackCell.fixtures';

// Every story is built from RackCell.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React's or Svelte's `Tree`. The stories that compose are view
// trees from the fixtures (`treeStory`).

/** The rack readout at the head of the sound row: "Rack · A1" over the rack's name; a click opens the Rack page. */
const meta = {
  title: 'Design OS/Components/Music/RackCell',
  component: RackCell,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { tip: 'nav.rack', onPress: fn() },
  argTypes: rackCellArgTypes,
} satisfies Meta<typeof RackCell>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(RackCell, RackCellSvelte);

/** A composed story's tree from the story's args: the data to the cell, its press as a handler. */
const composed = (sample: typeof rackCellMarkSample) =>
  treeStory(({ onPress, mark, ...data }: RackCellProps) => ({ tree: sample(data), handlers: { press: onPress } }));

/** The board's rack, without its modified dot (the sound row adds it): Rack · A1, Sunday drive. */
export const Board: Story = story(s.Board);

/** A rack not on a Quick Rack slot. */
export const NoSlot: Story = story(s.NoSlot);

/** Modified: the mark (PartMarks' edited dot) stays whole after the name. */
export const Modified: Story = story(s.Modified, composed(rackCellMarkSample));

/** A long name ends in an ellipsis; the slot and the mark stay whole. */
export const LongName: Story = story(s.LongName, composed(rackCellMarkSample));

/** No rack loaded: "No rack" in muted text. */
export const Empty: Story = story(s.Empty);

/** At the head of a sound row, to check the rack and the parts share a left edge and rhythm. */
export const InRow: Story = story(s.InRow, composed(rackCellRowSample));

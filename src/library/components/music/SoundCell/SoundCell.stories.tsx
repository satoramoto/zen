import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, treeStory, withRenderer } from '../../../stories/story';
import { SoundCell, type SoundCellProps } from './SoundCell';
import SoundCellSvelte from './SoundCell.svelte';
import {
  soundCellArgs,
  soundCellArgTypes,
  soundCellMarksSample,
  soundCellRowSample,
  soundCellStories as s,
} from './SoundCell.fixtures';

// Every story is built from SoundCell.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React's or Svelte's `Tree`. The stories that compose are view
// trees from the fixtures (`treeStory`).

/**
 * One part on a sound row: the short name in the part's hue slot (opens Channel) over the
 * sound's number and name (opens the quick sound list), with the part's marks after it. The
 * sample data is Yahaha's board, whose parts take hue slots 1–4.
 */
const meta = {
  title: 'Design OS/Components/Music/SoundCell',
  component: SoundCell,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { ...soundCellArgs, onPart: fn(), onSound: fn() },
  argTypes: soundCellArgTypes,
} satisfies Meta<typeof SoundCell>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(SoundCell, SoundCellSvelte);

/** A composed story's tree from the story's args: the data to the cells, the callbacks as handlers. */
const composed = (sample: typeof soundCellMarksSample) =>
  treeStory(({ onPart, onSound, marks, ...data }: SoundCellProps) => ({ tree: sample(data), handlers: { part: onPart, sound: onSound } }));

/** The board's Right 1: R1 in hue slot 1, 1 Stage Grand. */
export const Board: Story = story(s.Board);

/** The board's Right 3, off: R3 faded in its own hue, the number and name muted. */
export const Off: Story = story(s.Off);

/** A long sound name ends in an ellipsis; the short name and number stay whole. */
export const LongName: Story = story(s.LongName);

/** With the part's marks after the name (PartMarks, edited). */
export const WithMarks: Story = story(s.WithMarks, composed(soundCellMarksSample));

/** A sound with no number: the name starts on the cell's left edge. */
export const NoNumber: Story = story(s.NoNumber);

/** The five hue slots side by side (Yahaha's four parts, then a fifth), one of them off, to check left edges and hues under each pack. */
export const Row: Story = story({ args: s.Row.args }, composed(soundCellRowSample));

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { StatusDot } from '../../core/StatusDot/StatusDot';
import { withLibraryTheme } from '../../../storybook';
import { SoundCell } from './SoundCell';
import { soundCellArgs, soundCellArgTypes, soundCellStories } from './SoundCell.fixtures';
import type { SoundCellModelProps } from './SoundCell.model';

/** The fixtures, each story's args whole (every one names its part and sound). */
type Data = Omit<SoundCellModelProps, 'onPart' | 'onSound'>;
const s = soundCellStories as Record<keyof typeof soundCellStories, { args: Data; items?: Data[] }>;

/**
 * One part on a sound row: the short name in the part's hue slot (opens Channel) over the
 * sound's number and name (opens the quick sound list), with the part's marks after it. The
 * sample data is Yahaha's board, whose parts take hue slots 1–4.
 */
const meta = {
  title: 'Design OS/Components/Music/SoundCell',
  component: SoundCell,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { ...soundCellArgs, onPart: fn(), onSound: fn() },
  argTypes: soundCellArgTypes,
} satisfies Meta<typeof SoundCell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board's Right 1: R1 in hue slot 1, 1 Stage Grand. */
export const Board: Story = {
  args: s.Board.args,
};

/** The board's Right 3, off: R3 faded in its own hue, the number and name muted. */
export const Off: Story = {
  args: s.Off.args,
};

/** A long sound name ends in an ellipsis; the short name and number stay whole. */
export const LongName: Story = {
  args: s.LongName.args,
};

/** With the part's marks after the name (a lamp stands in for PartMarks). */
export const WithMarks: Story = {
  args: { ...s.WithMarks.args, marks: <StatusDot hue="ok" size="sm" name="Held" /> },
};

/** A sound with no number: the name starts on the cell's left edge. */
export const NoNumber: Story = {
  args: s.NoNumber.args,
};

/** The five hue slots side by side (Yahaha's four parts, then a fifth), one of them off, to check left edges and hues under each pack. */
export const Row: Story = {
  args: s.Row.args,
  render: (args) => (
    <div className="lib-row" style={{ gap: 'var(--space-4)', alignItems: 'flex-start' }}>
      {s.Row.items!.map((item) => (
        <SoundCell key={item.part} {...args} {...item} />
      ))}
    </div>
  ),
};

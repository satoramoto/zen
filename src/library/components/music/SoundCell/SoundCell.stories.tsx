import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { StatusDot } from '../../core/StatusDot/StatusDot';
import { withLibraryTheme } from '../../../storybook';
import { SoundCell } from './SoundCell';

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
  args: {
    partTip: 'mixer.strip.select',
    soundTip: 'launchkey.fader_sound',
    onPart: fn(),
    onSound: fn(),
  },
  argTypes: {
    part: { control: 'text' },
    partName: { control: 'text' },
    hue: { control: 'inline-radio', options: [1, 2, 3, 4, 5] },
    number: { control: 'text' },
    sound: { control: 'text' },
    off: { control: 'boolean' },
    soundName: { control: 'text' },
    partTip: { control: 'text' },
    soundTip: { control: 'text' },
  },
} satisfies Meta<typeof SoundCell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board's Right 1: R1 in hue slot 1, 1 Stage Grand. */
export const Board: Story = {
  args: {
    part: 'R1',
    partName: 'Right 1',
    hue: 1,
    number: '1',
    sound: 'Stage Grand',
    off: false,
  },
};

/** The board's Right 3, off: R3 faded in its own hue, the number and name muted. */
export const Off: Story = {
  args: { part: 'R3', partName: 'Right 3', hue: 3, number: '57', sound: 'Brass Section', off: true },
};

/** A long sound name ends in an ellipsis; the short name and number stay whole. */
export const LongName: Story = {
  args: { part: 'L', partName: 'Left', hue: 4, number: '208', sound: 'Concert Grand Piano Bright Stereo' },
};

/** With the part's marks after the name (a lamp stands in for PartMarks). */
export const WithMarks: Story = {
  args: {
    part: 'R2',
    partName: 'Right 2',
    hue: 2,
    number: '41',
    sound: 'Warm Strings',
    marks: <StatusDot hue="ok" size="sm" name="Held" />,
  },
};

/** A sound with no number: the name starts on the cell's left edge. */
export const NoNumber: Story = {
  args: { part: 'R1', partName: 'Right 1', hue: 1, sound: 'User Piano' },
};

/** The five hue slots side by side (Yahaha's four parts, then a fifth), one of them off, to check left edges and hues under each pack. */
export const Row: Story = {
  args: { part: 'R1', partName: 'Right 1', sound: 'Stage Grand' },
  render: (args) => (
    <div className="lib-row" style={{ gap: 'var(--space-4)', alignItems: 'flex-start' }}>
      <SoundCell {...args} part="R1" partName="Right 1" hue={1} number="1" sound="Stage Grand" />
      <SoundCell {...args} part="R2" partName="Right 2" hue={2} number="41" sound="Warm Strings" />
      <SoundCell {...args} part="R3" partName="Right 3" hue={3} number="57" sound="Brass Section" off />
      <SoundCell {...args} part="L" partName="Left" hue={4} number="208" sound="Concert Grand Piano Bright Stereo" />
      <SoundCell {...args} part="5" partName="Slot 5" hue={5} number="12" sound="Jazz Organ" />
    </div>
  ),
};

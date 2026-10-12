import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { StatusDot } from '../../core/StatusDot/StatusDot';
import { withLibraryTheme } from '../../../storybook';
import { SoundCell } from '../SoundCell/SoundCell';
import { RackCell } from './RackCell';

/** The rack readout at the head of the sound row: "Rack · A1" over the rack's name; a click opens the Rack page. */
const meta = {
  title: 'Design OS/Components/Music/RackCell',
  component: RackCell,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { tip: 'nav.rack', onPress: fn() },
  argTypes: {
    rack: { control: 'text' },
    slot: { control: 'text' },
    label: { control: 'text' },
    name: { control: 'text' },
    tip: { control: 'text' },
  },
} satisfies Meta<typeof RackCell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board's rack, without its modified dot (the sound row adds it): Rack · A1, Sunday drive. */
export const Board: Story = {
  args: { rack: 'Sunday drive', slot: 'A1', label: 'Rack', tip: 'nav.rack' },
};

/** A rack not on a Quick Rack slot. */
export const NoSlot: Story = {
  args: { rack: 'Ballad night', slot: '' },
};

/** Modified: the mark (a lamp stands in for the modified dot) stays whole after the name. */
export const Modified: Story = {
  args: { rack: 'Sunday drive', slot: 'A1', mark: <StatusDot hue="t" size="sm" name="Modified" /> },
};

/** A long name ends in an ellipsis; the slot and the mark stay whole. */
export const LongName: Story = {
  args: {
    rack: 'Saturday wedding set, second half with horns',
    slot: 'B4',
    mark: <StatusDot hue="t" size="sm" name="Modified" />,
  },
};

/** No rack loaded: "No rack" in muted text. */
export const Empty: Story = {
  args: { rack: '', slot: '' },
};

/** At the head of a sound row, to check the rack and the parts share a left edge and rhythm. */
export const InRow: Story = {
  args: { rack: 'Sunday drive', slot: 'A1' },
  render: (args) => (
    <div className="lib-row" style={{ gap: 'var(--space-4)', alignItems: 'flex-start' }}>
      <RackCell {...args} />
      <SoundCell part="R1" partName="Right 1" hue={1} number="1" sound="Stage Grand" />
      <SoundCell part="R2" partName="Right 2" hue={2} number="41" sound="Warm Strings" />
      <SoundCell part="L" partName="Left" hue={4} number="208" sound="Concert Grand Piano Bright Stereo" />
    </div>
  ),
};

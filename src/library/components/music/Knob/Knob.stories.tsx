import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Knob } from './Knob';

const meta = {
  title: 'Design OS/Components/Music/Knob',
  component: Knob,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    label: 'Dynamics',
    code: 'DynCtrl',
    value: '127',
    unit: '',
    fraction: 1,
    unused: false,
    tip: 'knobs.knob',
    onpress: fn(),
    onstep: fn(),
    tipAction: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    code: { control: 'text' },
    value: { control: 'text' },
    unit: { control: 'text' },
    fraction: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    unused: { control: 'boolean' },
    hue: { control: 'select', options: [undefined, 1, 2, 3, 4] },
    name: { control: 'text' },
    tip: { control: 'text' },
  },
} satisfies Meta<typeof Knob>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Knob 1 on the board: Dynamics at 127, the arc full round. */
export const Board: Story = {};

/** Part way round: Retrig rate at 1/8. */
export const Partial: Story = {
  args: { label: 'Retrig rate', code: 'RtgRate', value: '1/8', fraction: 0.4 },
};

/** At zero, with a unit: Swing 0%. The arc is empty; the pointer sits at the start. */
export const Unit: Story = {
  args: { label: 'Swing', code: 'Swing', value: '0', unit: '%', fraction: 0 },
};

/** Nothing mapped: the dim "---" and a faint empty ring. */
export const Unused: Story = {
  args: { label: '---', code: '', value: '', fraction: 0, unused: true },
};

/** New: a knob with a hue slot (in Yahaha, the part that owns it) wears that hue on its arc, and only there. */
export const Hue: Story = {
  args: { label: 'Retrig rate', code: 'RtgRate', value: '1/8', fraction: 0.4, hue: 2 },
};

/** New: a row of eight as on the board, to check rhythm and alignment across values. */
export const BoardRow: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 'var(--space-2)' }}>
      <Knob {...args} label="Dynamics" code="DynCtrl" value="127" fraction={1} />
      <Knob {...args} label="Retrig rate" code="RtgRate" value="1/8" fraction={0.4} />
      <Knob {...args} label="Swing" code="Swing" value="0" unit="%" fraction={0} />
      <Knob {...args} label="Cutoff" code="Cutoff" value="64" fraction={0.5} />
      <Knob {...args} label="Resonance" code="Reso" value="Off" fraction={0} />
      <Knob {...args} label="Attack" code="EGAtk" value="12" fraction={0.1} />
      <Knob {...args} label="---" code="" value="" fraction={0} unused />
      <Knob {...args} label="---" code="" value="" fraction={0} unused />
    </div>
  ),
};

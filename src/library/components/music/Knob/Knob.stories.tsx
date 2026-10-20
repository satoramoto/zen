import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { instances } from '../../../fixtures';
import { Knob } from './Knob';
import { knobArgTypes, knobStories as s } from './Knob.fixtures';

// Every story's args come from Knob.fixtures.ts, which the Svelte stories and the parity test share.
const meta = {
  title: 'Design OS/Components/Music/Knob',
  component: Knob,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    label: 'Dynamics',
    onpress: fn(),
    onstep: fn(),
    tipAction: fn(),
  },
  argTypes: knobArgTypes,
} satisfies Meta<typeof Knob>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Knob 1 on the board: Dynamics at 127, the arc full round. */
export const Board: Story = { args: s.Board.args };

/** Part way round: Retrig rate at 1/8. */
export const Partial: Story = { args: s.Partial.args };

/** At zero, with a unit: Swing 0%. The arc is empty; the pointer sits at the start. */
export const Unit: Story = { args: s.Unit.args };

/** Nothing mapped: the dim "---" and a faint empty ring. */
export const Unused: Story = { args: s.Unused.args };

/** New: a knob with a hue slot (in Yahaha, the part that owns it) wears that hue on its arc, and only there. */
export const Hue: Story = { args: s.Hue.args };

/** New: a row of eight as on the board, to check rhythm and alignment across values. */
export const BoardRow: Story = {
  args: s.BoardRow.args,
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 'var(--space-2)' }}>
      {instances(s.BoardRow).map((item, i) => (
        <Knob key={i} {...args} {...item} />
      ))}
    </div>
  ),
};

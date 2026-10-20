import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { instances } from '../../../fixtures';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { Knob } from './Knob';
import KnobSvelte from './Knob.svelte';
import { knobArgTypes, knobStories as s } from './Knob.fixtures';

// Every story is built from Knob.fixtures.ts (`story(s.Name)`), which the tree snapshot shares; the
// toolbar's Renderer draws it with React's or Svelte's `Tree`.
const meta = {
  title: 'Design OS/Components/Music/Knob',
  component: Knob,
  decorators: [withRenderer, withLibraryTheme],
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
const story = fixtureStories<Story>(Knob, KnobSvelte);

/** Knob 1 on the board: Dynamics at 127, the arc full round. */
export const Board: Story = story(s.Board);

/** Part way round: Retrig rate at 1/8. */
export const Partial: Story = story(s.Partial);

/** At zero, with a unit: Swing 0%. The arc is empty; the pointer sits at the start. */
export const Unit: Story = story(s.Unit);

/** Nothing mapped: the dim "---" and a faint empty ring. */
export const Unused: Story = story(s.Unused);

/** New: a knob with a hue slot (in Yahaha, the part that owns it) wears that hue on its arc, and only there. */
export const Hue: Story = story(s.Hue);

/** New: a row of eight as on the board, to check rhythm and alignment across values (a grid, so React draws it). */
export const BoardRow: Story = story(s.BoardRow, {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 'var(--space-2)' }}>
      {instances(s.BoardRow).map((item, i) => (
        <Knob key={i} {...args} {...item} />
      ))}
    </div>
  ),
});

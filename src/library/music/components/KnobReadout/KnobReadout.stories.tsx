import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { instances } from '../../../fixtures';
import { fixtureStories, withRenderer } from '../../../foundation/stories/story';
import { KnobReadout } from './KnobReadout';
import KnobSvelte from './KnobReadout.svelte';
import { knobArgTypes, knobStories as s } from './KnobReadout.fixtures';

// Every story is built from KnobReadout.fixtures.ts (`story(s.Name)`), which the tree snapshot shares; the
// toolbar's Renderer draws it with React's or Svelte's `Tree`.
const meta = {
  title: 'Music/Components/KnobReadout',
  component: KnobReadout,
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
} satisfies Meta<typeof KnobReadout>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(KnobReadout, KnobSvelte);

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
/** `origin="center"`: a value with a middle fills from the top of the ring, and is empty at the middle. */
export const Center: Story = {
  ...story(s.Center),
  play: async ({ canvasElement }) => {
    const knobs = [...canvasElement.querySelectorAll('[data-part="root"]')];
    await expect(knobs).toHaveLength(5);
    for (const knob of knobs) await expect(knob).toHaveAttribute('data-origin', 'center');
    // At the middle there is no arc; either side of it there is one.
    await expect(knobs[2].querySelector('[data-part="arc"]')).toBeNull();
    await expect(knobs[0].querySelector('[data-part="arc"]')).not.toBeNull();
    await expect(knobs[4].querySelector('[data-part="arc"]')).not.toBeNull();
  },
};

export const BoardRow: Story = story(s.BoardRow, {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 'var(--space-2)' }}>
      {instances(s.BoardRow).map((item, i) => (
        <KnobReadout key={i} {...args} {...item} />
      ))}
    </div>
  ),
});

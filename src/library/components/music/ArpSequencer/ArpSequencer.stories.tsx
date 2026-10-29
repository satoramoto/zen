import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { FormProvider } from '../../../layout/assembly';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { ArpSequencer } from './ArpSequencer';
import ArpSequencerSvelte from './ArpSequencer.svelte';
import { arpSequencerArgTypes, arpSequencerBoard, arpSequencerStories as s } from './ArpSequencer.fixtures';

// Every story but Dense and Live is built from ArpSequencer.fixtures.ts (`story(s.Name)`), which the
// toolbar's Renderer draws with React's or Svelte's `Tree`.

/**
 * The chord-degree arpeggiator: the chord it follows and what each degree sounds as, a sixteen-step
 * by eight-degree grid (highest degree at the top, root at the bottom) with each on step's velocity
 * as a stalk and its tie drawn into the next column, and the mode with the four knobs (Rate, Oct,
 * Gate, Swing) underneath. A cell press asks for its step's next value; a degree label swaps its
 * degree with the row beside it; the mode and knobs ask with the whole next state. Pure: the story
 * (or an app) owns the arp.
 */
const meta = {
  title: 'Design OS/Components/Music/ArpSequencer',
  component: ArpSequencer,
  // A sequencer fills its region: give it the room it has on a live screen (900 px, or a story's
  // own `parameters.frameWidth`).
  decorators: [
    withRenderer,
    (Story, { parameters }) => (
      <div style={{ width: (parameters.frameWidth as number | undefined) ?? 900 }}>
        <Story />
      </div>
    ),
    withLibraryTheme,
  ],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { ...arpSequencerBoard, onStep: fn(), onState: fn() },
  argTypes: arpSequencerArgTypes,
} satisfies Meta<typeof ArpSequencer>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(ArpSequencer, ArpSequencerSvelte);

/**
 * Am7, updown, two octaves: R 3 5 7 9 7 5 twice with a tie into the next column, the degree
 * legend reading `R = A`, `3 = C` … and the four knobs under the mode.
 */
export const Default: Story = story(s.Default, {
  play: async ({ args, canvasElement }) => {
    const cell = canvasElement.querySelector<HTMLElement>('[data-part="cell"][data-step="2"][data-degree="1"]');
    if (!cell) throw new Error('ArpSequencer: no cell for step 2 degree 1');
    await userEvent.click(cell);
    await expect(args.onStep).toHaveBeenLastCalledWith(2, expect.objectContaining({ degree: 1, on: true }));
  },
});

/** Every degree from the root to +15, on and off, ties at 3 and 11 and velocities from 0.2 to 1, over C (a three-note chord). */
export const EveryState: Story = story(s.EveryState);

/**
 * The compact form at a 900 px window: no degree labels and no degree readout, the same 16 × 8 grid,
 * the mode and all four knobs (a compact form scope, so React draws it).
 */
export const Dense: Story = story(s.Dense, {
  render: (args) => (
    <FormProvider form="compact">
      <ArpSequencer {...args} />
    </FormProvider>
  ),
});

/** No chord and every step off: the grid at rest and "—" where the chord would be. */
export const Empty: Story = story(s.Empty);

/** Read-only: the grid, the degree labels, the mode and the knobs are drawn, and nothing calls back. */
export const Disabled: Story = story(s.Disabled);

/** Wired to state: a cell toggles or moves a step, a degree label swaps two rows, the mode and knobs replace the state (local state, so React draws it). */
export const Live: Story = story(s.Default, {
  render: function Live(args) {
    const [state, setState] = useState(args.state);
    return (
      <ArpSequencer
        {...args}
        state={state}
        onStep={(index, next) => {
          args.onStep?.(index, next);
          setState((was) => ({ ...was, steps: was.steps.map((step, i) => (i === index ? next : step)) }));
        }}
        onState={(next) => {
          args.onState?.(next);
          setState(next);
        }}
      />
    );
  },
});

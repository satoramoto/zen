import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { FormProvider } from '../../../layout/assembly';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { ChordStrip } from './ChordStrip';
import ChordStripSvelte from './ChordStrip.svelte';
import { chordStripArgTypes, chordStripBoard, chordStripStories as s } from './ChordStrip.fixtures';

// Every story but Dense and Live is built from ChordStrip.fixtures.ts (`story(s.Name)`), which the
// toolbar's Renderer draws with React's or Svelte's `Tree`.

/**
 * A song's progression as one strip: a key block per chord across the width, the chord that sounds
 * now lit and ringed, the one after it edged as next, the active chord's notes beneath its name,
 * and a small MUTATE / KEEP / REVERT row under the strip when the app passes those handlers. A
 * block press asks to follow its chord; the strip holds no state of its own.
 */
const meta = {
  title: 'Design OS/Components/Music/ChordStrip',
  component: ChordStrip,
  // A progression strip fills its region: give it the room it has on a live screen (900 px, or a
  // story's own `parameters.frameWidth`).
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
  args: { ...chordStripBoard, onFollow: fn(), onMutate: fn(), onKeep: fn(), onRevert: fn() },
  argTypes: chordStripArgTypes,
} satisfies Meta<typeof ChordStrip>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(ChordStrip, ChordStripSvelte);

/**
 * Bar 3 of a ii–V–I: G7 is now (lit, ringed, its notes under the name), Cmaj7 is next (a strong
 * dashed edge) and selected by the editor (the accent mark), and the three mutation actions sit
 * under the strip.
 */
export const Default: Story = story(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^Dm7$/ }));
    await expect(args.onFollow).toHaveBeenLastCalledWith('dm7');
  },
});

/** One row with every state at once: Am7 now, Dm7 next, Cmaj7 selected, the rest idle. */
export const EveryState: Story = story(s.EveryState);

/**
 * The compact form at a 900 px window: names only, the notes line gone, the actions as short
 * labels — the same eight blocks (a compact form scope, so React draws it).
 */
export const Dense: Story = story(s.Dense, {
  render: (args) => (
    <FormProvider form="compact">
      <ChordStrip {...args} />
    </FormProvider>
  ),
});

/** No progression: one quiet well, and the actions still there because the handlers are. */
export const Empty: Story = story(s.Empty);

/** Read-only: the strip and its action row are drawn but every press is inert. */
export const Disabled: Story = story(s.Disabled);

/** Wired to state: a block press follows that chord, the mutation actions keep or revert it (local state, so React draws it). */
export const Live: Story = story(s.Default, {
  render: function Live(args) {
    const [index, setIndex] = useState(args.index);
    const [selected, setSelected] = useState(args.selected);
    return (
      <ChordStrip
        {...args}
        index={index}
        selected={selected}
        onFollow={(id) => {
          args.onFollow?.(id);
          const at = args.chords?.findIndex((chord) => chord.id === id) ?? -1;
          if (at >= 0) setIndex(at);
          setSelected(id);
        }}
      />
    );
  },
});

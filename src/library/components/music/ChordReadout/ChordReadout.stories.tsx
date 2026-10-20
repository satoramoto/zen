import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { ChordReadout } from './ChordReadout';
import ChordReadoutSvelte from './ChordReadout.svelte';
import { chordReadoutArgTypes, chordReadoutArgs, chordReadoutStories as s } from './ChordReadout.fixtures';

// Every story is built from ChordReadout.fixtures.ts (`story(s.Name)`), which the tree snapshot
// shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`.
const meta = {
  title: 'Design OS/Components/Music/ChordReadout',
  component: ChordReadout,
  decorators: [
    withRenderer,
    // A third of the display's content width, as the original sizes itself.
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
    withLibraryTheme,
  ],
  parameters: { layout: 'centered' },
  args: chordReadoutArgs,
  argTypes: chordReadoutArgTypes,
} satisfies Meta<typeof ChordReadout>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(ChordReadout, ChordReadoutSvelte);

/** The board: Am7, A · C · E · G, Fingered On Bass. */
export const Board: Story = {
  ...story(s.Board),
  play: async ({ canvasElement }) => {
    const readout = within(canvasElement).getByRole('img', { name: 'Chord Am7: A C E G, Fingered On Bass' });
    await expect(readout).toHaveAttribute('data-held', 'false');
  },
};

/** Held: detection is unsure, so the last chord stays, a dashed rule under it, with a "held" tag on the small line. */
export const Held: Story = {
  ...story(s.Held),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'Chord Cmaj7, held: C E G B, Fingered' })).toHaveAttribute('data-held', 'true');
  },
};

/** A long chord (C♯mmaj9(♯11)/G♯) steps down the hero sizes until it fits. */
export const Long: Story = story(s.Long);

/** A long fingering with Keyboard transpose: the small line wraps to a second line. */
export const LongFingering: Story = story(s.LongFingering);

/** New: a larger hero by `size` (set as `--yh-chord-readout-hero`); the fit steps scale from it. */
export const HeroSize: Story = {
  ...story(s.HeroSize),
  play: async ({ canvasElement }) => {
    const readout = canvasElement.querySelector<HTMLElement>('.yh-chord-readout')!;
    await expect(readout.style.getPropertyValue('--yh-chord-readout-hero')).toBe('calc(var(--size-display) * 1.4)');
  },
};

/** No chord yet: a dim dash, no notes. */
export const Empty: Story = {
  ...story(s.Empty),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'Chord none, Fingered' })).toHaveTextContent('—');
  },
};

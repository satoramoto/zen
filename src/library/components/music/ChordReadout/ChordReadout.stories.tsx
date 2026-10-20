import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { ChordReadout } from './ChordReadout';
import { chordReadoutArgTypes, chordReadoutArgs, chordReadoutStories as s } from './ChordReadout.fixtures';

// Every story's args come from ChordReadout.fixtures.ts, which the Svelte stories and the parity test share.
const meta = {
  title: 'Design OS/Components/Music/ChordReadout',
  component: ChordReadout,
  decorators: [
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

/** The board: Am7, A · C · E · G, Fingered On Bass. */
export const Board: Story = {
  args: s.Board.args,
  play: async ({ canvasElement }) => {
    const readout = within(canvasElement).getByRole('img', { name: 'Chord Am7: A C E G, Fingered On Bass' });
    await expect(readout).toHaveAttribute('data-held', 'false');
  },
};

/** Held: detection is unsure, so the last chord stays, a dashed rule under it, with a "held" tag on the small line. */
export const Held: Story = {
  args: s.Held.args,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'Chord Cmaj7, held: C E G B, Fingered' })).toHaveAttribute('data-held', 'true');
  },
};

/** A long chord (C♯mmaj9(♯11)/G♯) steps down the hero sizes until it fits. */
export const Long: Story = { args: s.Long.args };

/** A long fingering with Keyboard transpose: the small line wraps to a second line. */
export const LongFingering: Story = { args: s.LongFingering.args };

/** New: a larger hero by `size` (set as `--yh-chord-readout-hero`); the fit steps scale from it. */
export const HeroSize: Story = {
  args: s.HeroSize.args,
  play: async ({ canvasElement }) => {
    const readout = canvasElement.querySelector<HTMLElement>('.yh-chord-readout')!;
    await expect(readout.style.getPropertyValue('--yh-chord-readout-hero')).toBe('calc(var(--size-display) * 1.4)');
  },
};

/** No chord yet: a dim dash, no notes. */
export const Empty: Story = {
  args: s.Empty.args,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'Chord none, Fingered' })).toHaveTextContent('—');
  },
};

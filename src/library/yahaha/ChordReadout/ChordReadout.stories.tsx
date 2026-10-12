import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { ChordReadout, type ChordReadoutProps } from './ChordReadout';

// The original's fixtures (yahaha/src/ui/NowPlaying/NowPlaying.fixtures.ts), copied so the pairs compare one to one.
const chordBoard = {
  chord: 'Am',
  extension: '7',
  notes: [
    { note: 'A', interval: 'R' },
    { note: 'C', interval: 'm3' },
    { note: 'E', interval: '5' },
    { note: 'G', interval: 'm7' },
  ],
  fingering: 'Fingered On Bass',
  held: false,
} satisfies ChordReadoutProps;

const chordStopped = {
  chord: 'C',
  extension: 'maj7',
  notes: [
    { note: 'C', interval: 'R' },
    { note: 'E', interval: '3' },
    { note: 'G', interval: '5' },
    { note: 'B', interval: '7' },
  ],
  fingering: 'Fingered',
  held: true,
} satisfies ChordReadoutProps;

const chordLong = {
  chord: 'C♯m',
  extension: 'maj9(♯11)/G♯',
  notes: [
    { note: 'C♯', interval: 'R' },
    { note: 'E', interval: 'm3' },
    { note: 'G♯', interval: '5' },
    { note: 'C', interval: 'M7' },
    { note: 'D♯', interval: '9' },
    { note: 'G', interval: '♯11' },
  ],
  fingering: 'AI Full Keyboard',
  held: false,
} satisfies ChordReadoutProps;

const chordLongFingering = {
  ...chordBoard,
  notes: [
    { note: 'A', interval: 'R' },
    { note: 'C', interval: 'm3' },
    { note: 'E', interval: '5' },
    { note: 'G', interval: 'm7' },
    { note: 'B', interval: '9' },
    { note: 'D', interval: '4' },
  ],
  fingering: 'AI Full Keyboard · played Cm7 (Keyboard transpose −3)',
} satisfies ChordReadoutProps;

const meta = {
  title: 'Library/Yahaha/Primitives/ChordReadout',
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
  args: { chord: '', tip: 'fingering.select' },
  argTypes: {
    chord: { control: 'text' },
    extension: { control: 'text' },
    notes: { control: 'object' },
    fingering: { control: 'text' },
    held: { control: 'boolean' },
    label: { control: 'text' },
    size: { control: 'text' },
  },
} satisfies Meta<typeof ChordReadout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board: Am7, A · C · E · G, Fingered On Bass. */
export const Board: Story = {
  args: { ...chordBoard, label: 'Chord' },
  play: async ({ canvasElement }) => {
    const readout = within(canvasElement).getByRole('img', { name: 'Chord Am7: A C E G, Fingered On Bass' });
    await expect(readout).toHaveAttribute('data-held', 'false');
  },
};

/** Held: detection is unsure, so the last chord stays, a dashed rule under it, with a "held" tag on the small line. */
export const Held: Story = {
  args: { ...chordStopped },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'Chord Cmaj7, held: C E G B, Fingered' })).toHaveAttribute('data-held', 'true');
  },
};

/** A long chord (C♯mmaj9(♯11)/G♯) steps down the hero sizes until it fits. */
export const Long: Story = { args: { ...chordLong } };

/** A long fingering with Keyboard transpose: the small line wraps to a second line. */
export const LongFingering: Story = { args: { ...chordLongFingering } };

/** New: a larger hero by `size` (set as `--yh-chord-readout-hero`); the fit steps scale from it. */
export const HeroSize: Story = {
  args: { ...chordBoard, size: 'calc(var(--size-display) * 1.4)' },
  play: async ({ canvasElement }) => {
    const readout = canvasElement.querySelector<HTMLElement>('.yh-chord-readout')!;
    await expect(readout.style.getPropertyValue('--yh-chord-readout-hero')).toBe('calc(var(--size-display) * 1.4)');
  },
};

/** No chord yet: a dim dash, no notes. */
export const Empty: Story = {
  args: { chord: '', notes: [], fingering: 'Fingered' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'Chord none, Fingered' })).toHaveTextContent('—');
  },
};

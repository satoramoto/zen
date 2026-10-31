import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { expectFits, host, withHost } from '../host.story';
import { ChordCompass, type ChordCompassProps } from './ChordCompass';
import ChordCompassSvelte from './ChordCompass.svelte';
import { chordCompassArgTypes, chordCompassBoard, chordCompassStories as s } from './ChordCompass.fixtures';

// Every story is built from ChordCompass.fixtures.ts (`story(s.Name)`); the toolbar's Renderer
// draws it with React's or Svelte's `Tree`. Disabled is the pane with no callbacks: read-only.

/**
 * The circle of fifths in mix[flow]'s face: the key a faint tint, the chord now the one solid
 * cell, the next outlined, the progression loop a thin line between its chords with the move
 * about to happen its one strong segment.
 */
const meta = {
  id: 'music-live-chord-compass',
  title: 'Music/Live/Chord compass',
  component: ChordCompass,
  decorators: [withRenderer, withStoryFrame, withHost, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 480, h: 320 } },
  args: chordCompassBoard,
  argTypes: chordCompassArgTypes,
} satisfies Meta<typeof ChordCompass>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(ChordCompass, ChordCompassSvelte);

/** A story with every spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onPick: fn(), onFollow: fn(), onBassLock: fn() },
});

/** Bar 3 in C: G7 now, Cmaj7 next. A wedge asks to pick its chord, by click or by Enter. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'G, playing' })).toHaveAttribute('data-state', 'now');
    const next = canvas.getByRole('button', { name: 'C, next' });
    await expect(next).toHaveAttribute('data-state', 'next');
    await userEvent.click(next);
    await expect(args.onPick).toHaveBeenCalledWith('C');
    canvas.getByRole('button', { name: 'Dm' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onPick).toHaveBeenCalledWith('Dm');
    await userEvent.keyboard(' ');
    await expect(args.onPick).toHaveBeenCalledTimes(3);
    await userEvent.click(canvas.getByRole('radio', { name: 'Keys' }));
    await expect(args.onFollow).toHaveBeenCalledWith('keys');
    await userEvent.click(canvas.getByRole('button', { name: 'Bass lock' }));
    await expect(args.onBassLock).toHaveBeenCalledWith(true);
  },
});

/** E7 now, outside the key; Am7 next, a long line back across the wheel. Keys followed, bass locked. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'E, playing' })).toHaveAttribute('data-state', 'now');
    await expect(canvas.getByRole('button', { name: 'Am, next' })).toHaveAttribute('data-key', 'true');
    await expect(canvas.getByRole('radio', { name: 'Keys' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByText('1 beat')).toBeTruthy();
    await userEvent.click(canvas.getByRole('button', { name: 'Bass lock' }));
    await expect(args.onBassLock).toHaveBeenCalledWith(false);
  },
});

/** The `dial` form in a small frame: the wheel alone, the chord and the next one in its hub. */
const dense = live(s.Dense, {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByText('then Cmaj7')).toBeTruthy();
      await expect(canvas.queryByRole('radio')).toBeNull();
      await expectFits(canvasElement);
    },
});
export const Dense: Story = { ...dense, parameters: { ...dense.parameters, frame: { w: 220, h: 220 } } };

/** No progression, no key: the bare wheel as a reference — nothing playing, nothing next, nothing to press. */
export const Empty: Story = story(s.Empty, {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[data-state="now"], [data-state="next"]')).toHaveLength(0);
    await expect(within(canvasElement).queryAllByRole('button', { name: /, (playing|next)$/ })).toHaveLength(0);
  },
});

/** No callbacks: no wedge is a button, the switch and the lock are disabled. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: 'C, next' })).toBeNull();
    for (const radio of canvas.getAllByRole('radio')) await expect(radio).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Bass lock' })).toBeDisabled();
  },
});

/** A host that takes the follow mode and the bass lock. It does nothing with a picked chord: harmony is not the compass's to execute. */
const compass = host<ChordCompassProps>({
  apply: {
    onFollow: (_, follow: ChordCompassProps['follow']) => ({ follow }),
    onBassLock: (_, bassLock: boolean) => ({ bassLock }),
  },
});

/**
 * Controlled readback: the follow switch and the bass lock read back the host's choice. A picked
 * wedge only asks: the chord playing and the next one stay where the host's progression has them.
 */
export const Hosted: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, ...compass },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Keys' }));
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Keys' })).toHaveAttribute('aria-checked', 'true'));
    await userEvent.click(canvas.getByRole('button', { name: 'Bass lock' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Bass lock' })).toHaveAttribute('aria-pressed', 'true'));
    await userEvent.click(canvas.getByRole('button', { name: 'Bass lock' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Bass lock' })).toHaveAttribute('aria-pressed', 'false'));
    await expect(args.onBassLock).toHaveBeenNthCalledWith(2, false);
    await userEvent.click(canvas.getByRole('button', { name: 'Dm' }));
    await expect(args.onPick).toHaveBeenCalledWith('Dm');
    await expect(canvas.getByRole('button', { name: 'G, playing' })).toHaveAttribute('data-state', 'now');
    await expect(canvas.getByRole('button', { name: 'C, next' })).toHaveAttribute('data-state', 'next');
  },
});

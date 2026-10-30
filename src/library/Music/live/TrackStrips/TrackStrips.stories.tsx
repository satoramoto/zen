import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { TrackStrips } from './TrackStrips';
import TrackStripsSvelte from './TrackStrips.svelte';
import { trackStripsArgTypes, trackStripsBoard, trackStripsStories as s } from './TrackStrips.fixtures';

// Every story is built from TrackStrips.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws
// it with React's or Svelte's `Tree`. Disabled is the mixer with no callbacks: read, not ridden.

/**
 * The looper's mixer in mix[flow]'s face: one narrow channel per track (letter and name, send
 * knobs, fader and meter in a well, M / S / ●) and the FX returns at the right.
 */
const meta = {
  id: 'music-live-track-strips',
  title: 'Music/Live/Track strips',
  component: TrackStrips,
  decorators: [withRenderer, withStoryFrame, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 900, h: 360 } },
  args: trackStripsBoard,
  argTypes: trackStripsArgTypes,
} satisfies Meta<typeof TrackStrips>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(TrackStrips, TrackStripsSvelte);

/** A story with every callback a spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onLevel: fn(), onSend: fn(), onReturn: fn(), onMute: fn(), onSolo: fn(), onArm: fn(), onSelect: fn() },
});

/** Keys selected and armed, vox soloed, gtr muted. Every fader, knob, toggle and name asks its callback. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Keys arm' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Gtr mute' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Drums mute' }));
    await expect(args.onMute).toHaveBeenCalledWith('drums');
    await userEvent.click(canvas.getByRole('button', { name: 'Bass solo' }));
    await expect(args.onSolo).toHaveBeenCalledWith('bass');
    await userEvent.click(canvas.getByRole('button', { name: 'Vox arm' }));
    await expect(args.onArm).toHaveBeenCalledWith('vox');
    await userEvent.click(canvas.getByRole('button', { name: 'Select Bass' }));
    await expect(args.onSelect).toHaveBeenCalledWith('bass');
    await fireEvent.keyDown(canvas.getByRole('slider', { name: 'Drums level' }), { key: 'ArrowUp' });
    await expect(args.onLevel).toHaveBeenCalledWith({ track: 'drums', level: expect.closeTo(0.81, 5) });
    await fireEvent.keyDown(canvas.getByRole('slider', { name: 'Drums send B' }), { key: 'ArrowDown' });
    await expect(args.onSend).toHaveBeenCalledWith({ track: 'drums', send: 1, level: expect.closeTo(0.74, 5) });
    await fireEvent.keyDown(canvas.getByRole('slider', { name: 'FX A level' }), { key: 'ArrowUp' });
    await expect(args.onReturn).toHaveBeenCalledWith({ id: 'fxa', level: expect.closeTo(0.71, 5) });
    await expect(canvas.getAllByText('-1.9 dB')).toHaveLength(2);
  },
});

/** Every lamp lit somewhere, a fader at the bottom (-inf dB) and one at unity with a full meter. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('-inf dB')).toBeTruthy();
    await expect(canvas.getByText('0.0 dB')).toBeTruthy();
    for (const name of ['Vox mute', 'Vox solo', 'Vox arm']) await expect(canvas.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true');
  },
});

/** The `short` form in a smaller frame: no send knobs. */
export const Dense: Story = (() => {
  const base = live(s.Dense, {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.queryByRole('slider', { name: 'Drums send A' })).toBeNull();
      await expect(canvas.getAllByRole('slider')).toHaveLength(5);
    },
  });
  return { ...base, parameters: { ...base.parameters, frame: { w: 420, h: 240 } } };
})();

/** No tracks and no returns. */
export const Empty: Story = story(s.Empty, {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No tracks')).toBeTruthy();
  },
});

/** No callbacks: every name and toggle is disabled, every fader and knob inert. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
    for (const slider of canvas.getAllByRole('slider')) await expect(slider).toHaveAttribute('aria-disabled', 'true');
  },
});

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { ProgressionStrip } from './ProgressionStrip';
import ProgressionStripSvelte from './ProgressionStrip.svelte';
import { progressionBoard, progressionStripArgTypes, progressionStripStories as s } from './ProgressionStrip.fixtures';

// Every story is built from ProgressionStrip.fixtures.ts (`story(s.Name)`); the toolbar's Renderer
// draws it with React's or Svelte's `Tree`. Disabled is the strip with no callbacks: read-only.

/**
 * The progression loop the band follows, in mix[flow]'s face: chord cells as wide as their beats,
 * now filled, next outlined, a thin bar for where the loop is; Follow and the mutation buttons in
 * the head.
 */
const meta = {
  id: 'music-live-progression-strip',
  title: 'Music/Live/Progression strip',
  component: ProgressionStrip,
  decorators: [withRenderer, withStoryFrame, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 960, h: 96 } },
  args: progressionBoard,
  argTypes: progressionStripArgTypes,
} satisfies Meta<typeof ProgressionStrip>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(ProgressionStrip, ProgressionStripSvelte);

/** A story in its own frame, keeping the fixture's Svelte parameters. */
const framed = (st: Story, w: number, h: number): Story => ({ ...st, parameters: { ...st.parameters, frame: { w, h } } });

/** A story with every callback a spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onFollow: fn(), onSelect: fn(), onMutate: fn(), onKeep: fn(), onRevert: fn() },
});

/** Bar 3: G7 now, Cmaj7 next, Fmaj7 selected. A chord press selects; the buttons and Follow ask. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /^G7, now/ })).toHaveAttribute('data-state', 'now');
    await expect(canvas.getByRole('button', { name: /^Cmaj7, next/ })).toHaveAttribute('data-state', 'next');
    await userEvent.click(canvas.getByRole('button', { name: /^Dm7/ }));
    await expect(args.onSelect).toHaveBeenCalledWith('dm7');
    await userEvent.click(canvas.getByRole('button', { name: 'Mutate' }));
    await expect(args.onMutate).toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Revert' }));
    await expect(args.onRevert).toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('radio', { name: 'Loop' }));
    await expect(args.onFollow).toHaveBeenCalledWith('loop');
  },
});

/** The last chord now, so next wraps to the first; following the loop. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const states = canvas.getByRole('group', { name: 'Chords' }).querySelectorAll('[data-part="chord"]');
    await expect(new Set([...states].map((c) => c.getAttribute('data-state')))).toEqual(new Set(['now', 'next', 'idle']));
    await expect(states[0]).toHaveAttribute('data-state', 'next');
    await expect(canvas.getByRole('radio', { name: 'Loop' })).toHaveAttribute('aria-checked', 'true');
  },
});

/** The `compact` form in a narrow frame: names in 24px cells, no notes. */
export const Dense: Story = framed(live(s.Dense), 640, 84);

/** Four long chords with no voicings. */
export const Sparse: Story = live(s.Sparse);

/** No chords: one quiet well. */
export const Empty: Story = story(s.Empty);

/** No callbacks: the strip is read, not pressed. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
  },
});

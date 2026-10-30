import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { SignalSpine } from './SignalSpine';
import SignalSpineSvelte from './SignalSpine.svelte';
import { signalSpineArgTypes, signalSpineBoard, signalSpineStories as s } from './SignalSpine.fixtures';

// Every story is built from SignalSpine.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws
// it with React's or Svelte's `Tree`. Disabled is the spine with no callbacks: read-only.

/**
 * One track as its signal path in mix[flow]'s face: cartridges like the mixer's FX units on one
 * cable, the looper's layers as rings, Out as a meter in a well.
 */
const meta = {
  id: 'music-live-signal-spine',
  title: 'Music/Live/Signal spine',
  component: SignalSpine,
  decorators: [withRenderer, withStoryFrame, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 1240, h: 300 } },
  args: signalSpineBoard,
  argTypes: signalSpineArgTypes,
} satisfies Meta<typeof SignalSpine>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(SignalSpine, SignalSpineSvelte);

/** A story with every callback a spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onPrev: fn(), onNext: fn(), onStage: fn(), onUndo: fn(), onMuteLayer: fn(), onParam: fn(), onLevel: fn() },
});

/** Keys. The arrows, a cartridge's head, a ring (by click and by key) and Undo each ask their callback. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Previous track' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Next track' }));
    await expect(args.onPrev).toHaveBeenCalledTimes(1);
    await expect(args.onNext).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Generator: Arp · up-down' }));
    await expect(args.onStage).toHaveBeenCalledWith('gen');
    const muted = canvas.getByRole('button', { name: 'Mute layer 2, dub at 0:18' });
    await expect(muted).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(muted);
    await expect(args.onMuteLayer).toHaveBeenCalledWith('l2');
    canvas.getByRole('button', { name: 'Mute layer 3, dub at 0:32' }).focus();
    await userEvent.keyboard(' ');
    await expect(args.onMuteLayer).toHaveBeenLastCalledWith('l3');
    await userEvent.click(canvas.getByRole('button', { name: 'Undo last layer' }));
    await expect(args.onUndo).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('meter', { name: 'Keys output level' })).toHaveAttribute('aria-valuenow', '62');
  },
});

/** Vox: two stages thru, five layers with two muted, knobs and readings, a hot level. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('button', { name: /: thru$/ })).toHaveLength(2);
    const rings = [...canvasElement.querySelectorAll('.live-spine-ring')];
    await expect(rings.map((r) => r.getAttribute('data-kind'))).toEqual(['base', 'dub', 'dub', 'dub', 'dub']);
    await expect(rings.filter((r) => r.hasAttribute('data-muted'))).toHaveLength(2);
    await expect(canvasElement.querySelectorAll('.live-spine-cart[data-bypass]')).toHaveLength(2);
  },
});

/** Only the base take: nothing for Undo to peel. */
export const BaseOnly: Story = live(s.BaseOnly, {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Undo last layer' })).toBeDisabled();
  },
});

/** The `column` form in a narrow frame: the cartridges stacked, the cable running down. */
const dense = live(s.Dense, {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-form="column"]')).toBeTruthy();
    await expect(within(canvasElement).getByRole('meter')).toBeTruthy();
  },
});
export const Dense: Story = { ...dense, parameters: { ...dense.parameters, frame: { w: 300, h: 1000 } } };

/** Nothing caught yet: the looper's rings empty. */
export const Empty: Story = story(s.Empty);

/** No callbacks: every head, arrow and Undo disabled, the rings aren't buttons. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
    await expect(canvasElement.querySelector('.live-spine-ring[role="button"]')).toBeNull();
  },
});

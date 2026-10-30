import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { CutPads } from './CutPads';
import CutPadsSvelte from './CutPads.svelte';
import { cutPadsArgTypes, cutPadsBoard, cutPadsStories as s } from './CutPads.fixtures';

// Every story is built from CutPads.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws it
// with React's or Svelte's `Tree`. Disabled is the pads with no `onFire`: inert.

/**
 * The transitions as the biggest cells on the page, in mix[flow]'s launch-cell face: idle, armed
 * (caution outline, slow blink), fired (accent fill), held (caution fill, ringed), the current pad on a
 * foot rule.
 */
const meta = {
  id: 'music-live-cut-pads',
  title: 'Music/Live/Cut pads',
  component: CutPads,
  decorators: [withRenderer, withStoryFrame, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 960, h: 64 } },
  args: { pads: cutPadsBoard, form: 'row' },
  argTypes: cutPadsArgTypes,
} satisfies Meta<typeof CutPads>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(CutPads, CutPadsSvelte);

/** A story in its own frame, keeping the fixture's Svelte parameters. */
const framed = (st: Story, w: number, h: number): Story => ({ ...st, parameters: { ...st.parameters, frame: { w, h } } });

/** A story with a fire spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onFire: fn() },
});

/** The row at rest. A press asks to fire that pad. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^DROP/ }));
    await expect(args.onFire).toHaveBeenCalledWith('drop');
    canvas.getByRole('button', { name: /^HOLD B/ }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onFire).toHaveBeenCalledWith('hold-b');
  },
});

/** Every state in one row: armed, fired (and selected), held, idle. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const states = canvas.getAllByRole('button').map((b) => b.getAttribute('data-state'));
    await expect(new Set(states)).toEqual(new Set(['idle', 'armed', 'fired', 'held']));
    await expect(canvas.getByRole('button', { name: /^DROP/ })).toHaveAttribute('aria-current', 'true');
  },
});

/** The `grid` form: two rows of three under the head. */
export const Grid: Story = framed(live(s.Grid), 480, 160);

/** Eight pads in the grid: two rows of four. */
export const More: Story = framed(live(s.More), 560, 160);

/** The grid in a small frame. */
export const Dense: Story = framed(live(s.Dense), 320, 130);

/** No pads: one quiet well. */
export const Empty: Story = story(s.Empty);

/** No `onFire`: dashed and inert, the states still read. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
  },
});

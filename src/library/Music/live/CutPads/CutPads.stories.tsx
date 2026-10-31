import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { expectFits, host, withHost } from '../host.story';
import { CutPads, type CutPadsProps } from './CutPads';
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
  decorators: [withRenderer, withStoryFrame, withHost, withLibraryTheme],
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
export const Grid: Story = framed(live(s.Grid, { play: async ({ canvasElement }) => expectFits(canvasElement) }), 480, 160);

/** Eight pads in the grid: two rows of four. */
export const More: Story = framed(live(s.More, { play: async ({ canvasElement }) => expectFits(canvasElement) }), 560, 160);

/** The grid in a small frame. */
export const Dense: Story = framed(live(s.Dense, { play: async ({ canvasElement }) => expectFits(canvasElement) }), 320, 130);

/** No pads: one quiet well, nothing to fire. */
export const Empty: Story = story(s.Empty, {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryAllByRole('button')).toHaveLength(0);
  },
});

/** No `onFire`: dashed and inert, the states still read. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
  },
});

/** A host that marks a fired pad fired (and selected), and the pad it fired before idle again. */
const cuts = host<CutPadsProps>({
  apply: {
    onFire: (p, id: string) => ({ selected: id, pads: p.pads.map((pad) => (pad.id === id ? { ...pad, state: 'fired' } : pad.state === 'fired' ? { ...pad, state: 'idle' } : pad)) }),
  },
});

/** Controlled readback: a press (or Enter) asks to fire; the pad reads fired and selected only when the host says so. */
export const Hosted: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, ...cuts },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^DROP/ }));
    await waitFor(() => expect(canvas.getByRole('button', { name: /^DROP/ })).toHaveAttribute('data-state', 'fired'));
    await expect(canvas.getByRole('button', { name: /^DROP/ })).toHaveAttribute('aria-current', 'true');
    canvas.getByRole('button', { name: /^CUT/ }).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByRole('button', { name: /^CUT/ })).toHaveAttribute('data-state', 'fired'));
    await expect(canvas.getByRole('button', { name: /^DROP/ })).toHaveAttribute('data-state', 'idle');
    await expect(canvas.getByRole('button', { name: /^DROP/ })).not.toHaveAttribute('aria-current');
    await expect(args.onFire).toHaveBeenNthCalledWith(1, 'drop');
    await expect(args.onFire).toHaveBeenNthCalledWith(2, 'cut');
  },
});

/** A press without a host change reads nothing back: the pane never marks a pad fired on its own. */
export const Unconfirmed: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const drop = canvas.getByRole('button', { name: /^DROP/ });
    const before = drop.getAttribute('data-state');
    await userEvent.click(drop);
    await expect(args.onFire).toHaveBeenCalledWith('drop');
    await expect(canvas.getByRole('button', { name: /^DROP/ })).toHaveAttribute('data-state', before!);
  },
});

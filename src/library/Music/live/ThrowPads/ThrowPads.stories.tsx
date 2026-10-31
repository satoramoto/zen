import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { expectFits, host, withHost } from '../host.story';
import { ThrowPads, type ThrowMove, type ThrowPadsProps } from './ThrowPads';
import ThrowPadsSvelte from './ThrowPads.svelte';
import { throwPads, throwPadsArgTypes, throwPadsStories as s } from './ThrowPads.fixtures';

// Every story is built from ThrowPads.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws
// it with React's or Svelte's `Tree`. Disabled is the pads with no `onMove`: read-only.

/**
 * Named XY throws in mix[flow]'s face: each a well with the waveform grid, a 1px crosshair, the
 * finger's fading trail and a mono reading, in its stem ink.
 */
const meta = {
  id: 'music-live-throw-pads',
  title: 'Music/Live/Throw pads',
  component: ThrowPads,
  decorators: [withRenderer, withStoryFrame, withHost, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 640, h: 280 } },
  args: { pads: throwPads, form: 'two-up' },
  argTypes: throwPadsArgTypes,
} satisfies Meta<typeof ThrowPads>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(ThrowPads, ThrowPadsSvelte);

/** A story in its own frame, keeping the fixture's Svelte parameters. */
const framed = (st: Story, w: number, h: number): Story => ({ ...st, parameters: { ...st.parameters, frame: { w, h } } });

/** A story with a move spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onMove: fn() },
});

/** A pointer event at a fraction of `el`'s box (y up). */
function pointer(el: Element, type: string, fx: number, fy: number) {
  const box = el.getBoundingClientRect();
  el.dispatchEvent(
    new PointerEvent(type, { bubbles: true, pointerId: 1, button: 0, clientX: box.left + fx * box.width, clientY: box.top + (1 - fy) * box.height }),
  );
}

/** The delay throw beside the filter. A drag asks for the point under the finger; an arrow key nudges. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const delay = canvas.getByRole('group', { name: /^Delay throw/ });
    pointer(delay, 'pointerdown', 0.25, 0.75);
    pointer(delay, 'pointermove', 0.5, 0.5);
    pointer(delay, 'pointerup', 0.5, 0.5);
    await waitFor(() => expect(args.onMove).toHaveBeenCalledTimes(2));
    const [first, second] = (args.onMove as ReturnType<typeof fn>).mock.calls.map(([move]) => move as { id: string; x: number; y: number });
    await expect(first.id).toBe('delay');
    await expect(first.x).toBeCloseTo(0.25, 1);
    await expect(first.y).toBeCloseTo(0.75, 1);
    await expect(second.x).toBeCloseTo(0.5, 1);
    const filter = canvas.getByRole('group', { name: /^Filter/ });
    filter.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onMove).toHaveBeenLastCalledWith({ id: 'filter', x: 0.67, y: 0.7 });
  },
});

/** A pad in a corner with no trail beside one with no ink (the accent). */
export const EveryState: Story = live(s.EveryState);

/** The `one` form: the first pad alone. */
export const Dense: Story = framed(
  live(s.Dense, {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getAllByRole('group', { name: /XY|throw|Filter/ }).filter((g) => g.getAttribute('aria-roledescription') === 'XY pad')).toHaveLength(1);
    },
  }),
  320,
  280,
);

/** No pads: one quiet well, nothing to drag. */
export const Empty: Story = story(s.Empty, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No throws')).toBeTruthy();
    await expect(canvas.queryAllByRole('group', { name: /:/ })).toHaveLength(0);
  },
});

/** No `onMove`: the pads are read, not dragged. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('group', { name: /^Delay throw/ });
    await expect(field).toHaveAttribute('aria-disabled', 'true');
    await expect(field).not.toHaveAttribute('tabindex');
    // A drag on a read-only pad moves nothing: the reading keeps the host's point.
    pointer(field, 'pointerdown', 0.1, 0.1);
    pointer(field, 'pointerup', 0.1, 0.1);
    await expect(reading(field)).toBe('x 76%  y 60%');
  },
});

/** A host that sets the point a pad asked for and adds it to the pad's trail. */
const moved = host<ThrowPadsProps>({
  apply: {
    onMove: (args, { id, x, y }: ThrowMove) => ({
      pads: args.pads.map((p) => (p.id === id ? { ...p, x, y, trail: [...(p.trail ?? []), { x, y }] } : p)),
    }),
  },
});

/** The reading a pad shows: `x 25%  y 75%`. */
const reading = (pad: HTMLElement) => pad.closest('[data-part="pad"]')!.querySelector('[data-part="reading"]')!.textContent;

/**
 * Controlled readback: the host applies each ask, and the pad redraws from its props. A drag lands
 * the crosshair under the finger (0–1, y up, so the top-left quarter reads x 25% y 75%); each arrow
 * press steps 5% from the point the host confirmed, not from where the pad started.
 */
export const Hosted: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, ...moved },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const delay = canvas.getByRole('group', { name: /^Delay throw/ });
    pointer(delay, 'pointerdown', 0.25, 0.75);
    pointer(delay, 'pointerup', 0.25, 0.75);
    await waitFor(() => expect(reading(canvas.getByRole('group', { name: /^Delay throw/ }))).toBe('x 25%  y 75%'));
    await expect(canvas.getByRole('group', { name: /^Delay throw/ })).toHaveAccessibleName('Delay throw: Time 25%, Feedback 75%');
    const filter = canvas.getByRole('group', { name: /^Filter/ });
    filter.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(reading(canvas.getByRole('group', { name: /^Filter/ }))).toBe('x 67%  y 70%'));
    await userEvent.keyboard('{ArrowRight}{ArrowUp}');
    await waitFor(() => expect(reading(canvas.getByRole('group', { name: /^Filter/ }))).toBe('x 72%  y 75%'));
    await expect(canvas.getByRole('group', { name: /^Filter/ })).toHaveFocus();
    // Only the pad asked about moved: the delay keeps the point the host gave it.
    await expect(reading(canvas.getByRole('group', { name: /^Delay throw/ }))).toBe('x 25%  y 75%');
    await expect((args.onMove as ReturnType<typeof fn>).mock.calls.map(([m]) => (m as ThrowMove).id)).toEqual(['delay', 'filter', 'filter', 'filter']);
  },
});

/** A second pair a host could bind the pane to: the drums' space and drive. */
const OTHER_PADS = s.EveryState.args!.pads!;

/** Rebinding: the host hands the pane other pads. The old ones are gone, and an ask carries the new pad's id. */
export const Rebound: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, host: { ...moved.host, presets: { 'Bind drums': { pads: OTHER_PADS } } } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Bind drums' }));
    await waitFor(() => expect(canvas.queryByRole('group', { name: /^Delay throw/ })).toBeNull());
    const space = canvas.getByRole('group', { name: /^Space/ });
    pointer(space, 'pointerdown', 0.5, 0.5);
    pointer(space, 'pointerup', 0.5, 0.5);
    await waitFor(() => expect(reading(canvas.getByRole('group', { name: /^Space/ }))).toBe('x 50%  y 50%'));
    await expect(args.onMove).toHaveBeenCalledTimes(1);
    await expect(args.onMove).toHaveBeenCalledWith({ id: 'space', x: 0.5, y: 0.5 });
  },
});

/** Removal: a drag cut off by removing the pane asks nothing more; remounted, the pad drags again. */
export const Remounted: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, host: { ...moved.host, removable: true } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const delay = canvas.getByRole('group', { name: /^Delay throw/ });
    pointer(delay, 'pointerdown', 0.1, 0.1);
    await waitFor(() => expect(args.onMove).toHaveBeenCalledTimes(1));
    await userEvent.click(canvas.getByRole('button', { name: 'Remove pane' }));
    await waitFor(() => expect(canvas.queryByRole('group', { name: 'Throws' })).toBeNull());
    pointer(delay, 'pointermove', 0.9, 0.9);
    pointer(delay, 'pointerup', 0.9, 0.9);
    await expect(args.onMove).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Mount pane' }));
    const again = await canvas.findByRole('group', { name: /^Delay throw/ });
    await expect(reading(again)).toBe('x 10%  y 10%');
    pointer(again, 'pointerdown', 0.6, 0.4);
    pointer(again, 'pointerup', 0.6, 0.4);
    await waitFor(() => expect(reading(canvas.getByRole('group', { name: /^Delay throw/ }))).toBe('x 60%  y 40%'));
    await expect(args.onMove).toHaveBeenCalledTimes(2);
  },
});

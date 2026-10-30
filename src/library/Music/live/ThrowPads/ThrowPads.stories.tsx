import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { ThrowPads } from './ThrowPads';
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
  decorators: [withRenderer, withStoryFrame, withLibraryTheme],
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

/** No pads: one quiet well. */
export const Empty: Story = story(s.Empty);

/** No `onMove`: the pads are read, not dragged. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('group', { name: /^Delay throw/ });
    await expect(field).toHaveAttribute('aria-disabled', 'true');
    await expect(field).not.toHaveAttribute('tabindex');
  },
});

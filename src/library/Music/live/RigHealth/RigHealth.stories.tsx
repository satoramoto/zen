import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { expectFits, host, withHost } from '../host.story';
import { RigHealth } from './RigHealth';
import RigHealthSvelte from './RigHealth.svelte';
import { rigHealthArgTypes, rigHealthBoard, rigHealthStories as s } from './RigHealth.fixtures';

// Every story is built from RigHealth.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws
// it with React's or Svelte's `Tree`. Disabled is the line with no `onOpen`: read-only.

/**
 * The rig's one status line in mix[flow]'s face: quantize, every input's signal, every
 * controller's link, the DSP load as a sparkline. Only a silent input asks for attention.
 */
const meta = {
  id: 'music-live-rig-health',
  title: 'Music/Live/Rig health',
  component: RigHealth,
  decorators: [withRenderer, withStoryFrame, withHost, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 1440, h: 48 } },
  args: rigHealthBoard,
  argTypes: rigHealthArgTypes,
} satisfies Meta<typeof RigHealth>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(RigHealth, RigHealthSvelte);

/** A story with an open spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onOpen: fn() },
});

/** Friday's rig: Gtr low, Bass silent, the footswitch unplugged. A press asks to open that input. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const bass = canvas.getByRole('button', { name: 'Bass input, no signal' });
    await expect(bass).toHaveAttribute('data-state', 'none');
    await userEvent.click(bass);
    await expect(args.onOpen).toHaveBeenCalledWith('bass');
  },
});

/** Every state: ok, low and silent inputs, a disconnected controller, xruns and a load spike. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const states = canvas.getAllByRole('button').map((b) => b.getAttribute('data-state'));
    await expect(new Set(states)).toEqual(new Set(['ok', 'low', 'none']));
    await expect(canvas.getByText(/3 xruns/)).toBeTruthy();
  },
});

/** Everything fine: no trouble words, no outline. */
export const AllGood: Story = live(s.AllGood);

/** The `dots` form in a narrow frame: the dots, the trouble words and the load. */
const dense = live(s.Dense, {
  play: async ({ canvasElement }) => {
    const pane = canvasElement.querySelector<HTMLElement>('.live-rig')!;
    await expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth + 1);
    await expect(within(canvasElement).queryAllByText(/^(In|Control)$/)).toHaveLength(0);
  },
});
export const Dense: Story = { ...dense, parameters: { ...dense.parameters, frame: { w: 640, h: 48 } } };

/** No inputs, no controllers and no load sample: nothing to press, and no reading invented. */
export const Empty: Story = story(s.Empty, {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryAllByRole('button')).toHaveLength(0);
    await expect(canvasElement.querySelector('[data-part="load-reading"]')).toHaveTextContent(/^cpu —$/);
  },
});

/** No `onOpen`: the line is read, not pressed. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
  },
});

/** The engine reports no load or xruns: `cpu —` and no xrun count, never a made-up 0%. The inputs it does know still open. */
export const Unreported: Story = live(s.Unreported, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const load = canvasElement.querySelector('[data-part="load-reading"]')!;
    await expect(load).toHaveTextContent(/^cpu —$/);
    await expect(load).not.toHaveAttribute('data-trouble');
    await userEvent.click(canvas.getByRole('button', { name: 'Bass input, no signal' }));
    await expect(args.onOpen).toHaveBeenCalledWith('bass');
  },
});

/** Rebinding: the host hands the line another rig. The old inputs are gone; a press opens the new one, by its id. */
export const Rebound: Story = live(s.Default, {
  parameters: {
    ...story(s.Default).parameters,
    host: { presets: { 'Bind spare rig': { inputs: [{ id: 'spare-mic', name: 'Spare mic', state: 'low', level: 0.1 }], devices: [], load: [0.2], xruns: 1 } } },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Bind spare rig' }));
    await waitFor(() => expect(canvas.queryByRole('button', { name: 'Bass input, no signal' })).toBeNull());
    await expect(canvasElement.querySelector('[data-part="load-reading"]')).toHaveTextContent('cpu 20% · 1 xrun');
    await userEvent.click(canvas.getByRole('button', { name: 'Spare mic input, low' }));
    await expect(args.onOpen).toHaveBeenCalledTimes(1);
    await expect(args.onOpen).toHaveBeenCalledWith('spare-mic');
  },
});

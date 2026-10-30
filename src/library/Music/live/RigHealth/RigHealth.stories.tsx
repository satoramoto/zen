import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
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
  decorators: [withRenderer, withStoryFrame, withLibraryTheme],
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
const dense = live(s.Dense);
export const Dense: Story = { ...dense, parameters: { ...dense.parameters, frame: { w: 640, h: 48 } } };

/** No inputs and no controllers: the load alone. */
export const Empty: Story = story(s.Empty);

/** No `onOpen`: the line is read, not pressed. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
  },
});

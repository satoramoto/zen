import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { PushTwin } from './PushTwin';
import PushTwinSvelte from './PushTwin.svelte';
import { pushTwinArgTypes, pushTwinBoard, pushTwinStories as s } from './PushTwin.fixtures';

// Every story is built from PushTwin.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws
// it with React's or Svelte's `Tree`. Disabled is the twin with no callbacks: read-only.

/**
 * The Push on screen in mix[flow]'s face: the display's scribble strips over the 8×8 pads, the
 * row bands down the left and the scene buttons down the right, all one grid.
 */
const meta = {
  id: 'music-live-push-twin',
  title: 'Music/Live/Push twin',
  component: PushTwin,
  decorators: [withRenderer, withStoryFrame, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 600, h: 560 } },
  args: pushTwinBoard,
  argTypes: pushTwinArgTypes,
} satisfies Meta<typeof PushTwin>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(PushTwin, PushTwinSvelte);

/** A story with pad and scene spies. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onPad: fn(), onScene: fn() },
});

/** The verse, on +bass, Keys recording. A clip, a stop, a section and a scene each ask. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const pads = within(canvas.getByRole('group', { name: 'Pads' })).getAllByRole('button');
    await expect(pads).toHaveLength(64);
    await userEvent.click(canvas.getByRole('button', { name: 'Gtr clip 1, Riff, stopped' }));
    await expect(args.onPad).toHaveBeenCalledWith({ row: 'clips', column: 4, slot: 0 });
    await userEvent.click(canvas.getByRole('button', { name: 'Stop Keys, playing' }));
    await expect(args.onPad).toHaveBeenLastCalledWith({ row: 'stop', column: 2 });
    await userEvent.click(canvas.getByRole('button', { name: 'Section CHORUS, ready' }));
    await expect(args.onPad).toHaveBeenLastCalledWith({ row: 'sections', column: 2 });
    await userEvent.click(canvas.getByRole('button', { name: 'Scene 3, full' }));
    await expect(args.onScene).toHaveBeenCalledWith(2);
    await expect(canvas.getByRole('button', { name: 'Section VERSE, playing' })).toHaveAttribute('data-state', 'on');
  },
});

/** Every pad state: playing, queued, stopped, recording, empty; a queued section; a held transition. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const states = within(canvas.getByRole('group', { name: 'Pads' }))
      .getAllByRole('button')
      .map((b) => b.getAttribute('data-state'));
    await expect(new Set(states)).toEqual(new Set(['playing', 'queued', 'stopped', 'recording', 'empty', 'on', 'held']));
    await expect(canvas.getByRole('button', { name: 'Section CHORUS, queued' })).toHaveAttribute('data-state', 'queued');
    const held = canvas.getByRole('button', { name: 'Transition RISER, held' });
    await userEvent.click(held);
    await expect(args.onPad).toHaveBeenCalledWith({ row: 'transitions', column: 0 });
  },
});

/** The bands, pads and scenes share rows: each band's edges are its rows' edges. */
export const SharedRows: Story = live(s.Default, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pads = within(canvas.getByRole('group', { name: 'Pads' })).getAllByRole('button');
    const scenes = within(canvas.getByRole('group', { name: 'Scenes' })).getAllByRole('button');
    const bands = [...canvasElement.querySelectorAll('.live-push-band')];
    const top = (el: Element) => Math.round(el.getBoundingClientRect().top);
    const bottom = (el: Element) => Math.round(el.getBoundingClientRect().bottom);
    for (let r = 0; r < 8; r++) await expect(top(scenes[r])).toBe(top(pads[r * 8]));
    await expect([top(bands[0]), bottom(bands[0])]).toEqual([top(pads[0]), bottom(pads[4 * 8])]);
    await expect([top(bands[3]), bottom(bands[3])]).toEqual([top(pads[7 * 8]), bottom(pads[7 * 8])]);
    const { width, height } = pads[0].getBoundingClientRect();
    await expect(Math.abs(width - height)).toBeLessThan(1);
  },
});

/** Four tracks and two scenes: the other columns' pads are dark and inert. */
export const FewTracks: Story = live(s.FewTracks, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Column 8 clip 1, no track' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Scene 5, empty' })).toBeDisabled();
  },
});

const dense = live(s.Dense, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('group', { name: 'Scenes' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Drums clip 2, Break, stopped' }));
    await expect(args.onPad).toHaveBeenCalledWith({ row: 'clips', column: 0, slot: 1 });
  },
});
/** The `grid` form in a small square frame: the 64 pads alone, still square. */
export const Dense: Story = { ...dense, parameters: { ...dense.parameters, frame: { w: 320, h: 320 } } };

/** No tracks, sections, transitions or scenes: every pad an empty well. */
export const Empty: Story = story(s.Empty);

/** No callbacks: the twin mirrors the hardware and nothing more. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
  },
});

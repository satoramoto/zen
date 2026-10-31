import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { expectFits, host, withHost } from '../host.story';
import { SetlistRiver, type SetlistRiverProps } from './SetlistRiver';
import SetlistRiverSvelte from './SetlistRiver.svelte';
import { setlistRiverArgTypes, setlistRiverBoard, setlistRiverStories as s } from './SetlistRiver.fixtures';

// Every story is built from SetlistRiver.fixtures.ts (`story(s.Name)`); the toolbar's Renderer
// draws it with React's or Svelte's `Tree`. Disabled is the river with no callbacks: read-only.

/**
 * The night as one timeline in mix[flow]'s face: the tempo contour as a waveform lane, the songs
 * as cells as wide as their minutes, the song now opened into its scenes, a minute ruler, and one
 * playhead through all of them.
 */
const meta = {
  id: 'music-live-setlist-river',
  title: 'Music/Live/Setlist river',
  component: SetlistRiver,
  decorators: [withRenderer, withStoryFrame, withHost, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 1200, h: 220 } },
  args: setlistRiverBoard,
  argTypes: setlistRiverArgTypes,
} satisfies Meta<typeof SetlistRiver>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(SetlistRiver, SetlistRiverSvelte);

/** A story with pick and scene spies. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onPick: fn(), onScene: fn() },
});

/** Friday: Hidden Signals now on +bass, Wire cued in 6 bars. A song asks to be cued, a scene to launch. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const now = canvas.getByRole('button', { name: /^3 Hidden Signals/ });
    await expect(now).toHaveAttribute('aria-current', 'step');
    await userEvent.click(canvas.getByRole('button', { name: /^4 Wire.*cued, in 6 bars$/ }));
    await expect(args.onPick).toHaveBeenCalledWith('wire');
    const full = canvas.getByRole('button', { name: 'full, chorus, ahead' });
    await userEvent.click(full);
    await expect(args.onScene).toHaveBeenCalledWith('full');
    await expect(canvas.getByRole('button', { name: '+bass, verse, playing' })).toHaveAttribute('data-state', 'on');
  },
});

/** Every state: played, now, cued, a jam and ahead; played, playing and ahead scenes; the cue a bar away. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const songs = within(canvas.getByRole('list', { name: 'Songs' })).getAllByRole('listitem');
    await expect(new Set(songs.map((li) => li.getAttribute('data-state')))).toEqual(new Set(['done', 'now', 'cued', 'jam', 'ahead']));
    const scenes = within(canvas.getByRole('group', { name: 'Hidden Signals scenes' })).getAllByRole('button');
    await expect(new Set(scenes.map((b) => b.getAttribute('data-scene')))).toEqual(new Set(['played', 'playing', 'ahead']));
    await expect(canvas.getByRole('button', { name: /^4 Wire.*cued, in 1 bar$/ })).toBeTruthy();
  },
});

/** The closer now, everything before it played, nothing cued. */
export const Closing: Story = live(s.Closing);

const dense = live(s.Dense, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('group', { name: /scenes/ })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: /^7 Closer/ }));
    await expect(args.onPick).toHaveBeenCalledWith('closer');
  },
});
/** The `strip` form in a short frame: the songs and the playhead only. */
export const Dense: Story = { ...dense, parameters: { ...dense.parameters, frame: { w: 900, h: 40 } } };

/** No songs: an empty lane and ruler. */
export const Empty: Story = story(s.Empty);

/** No callbacks: the river is read, not pressed. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
  },
});

/** A host that cues a picked song (the one cued before goes back ahead) and plays a pressed scene. */
const river = host<SetlistRiverProps>({
  apply: {
    onPick: (p, id: string) => ({ songs: p.songs.map((s) => (s.id === id && s.state !== 'now' ? { ...s, state: 'cued' } : s.state === 'cued' ? { ...s, state: 'ahead' } : s)) }),
    onScene: (p, id: string) => ({
      songs: p.songs.map((s) => (!s.scenes ? s : { ...s, scenes: s.scenes.map((sc) => (sc.id === id ? { ...sc, state: 'playing' } : sc.state === 'playing' ? { ...sc, state: 'played' } : sc)) })),
    }),
  },
});

/** Controlled readback: a song (by click or Enter) reads cued once the host cues it, the old cue goes back ahead; a scene reads playing. */
export const Hosted: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, ...river },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: /^7 Closer/ }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onPick).toHaveBeenCalledWith('closer');
    await waitFor(() => expect(canvas.getByRole('button', { name: /^7 Closer.*cued/ })).toBeTruthy());
    await expect(canvas.queryByRole('button', { name: /^4 Wire.*cued/ })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'full, chorus, ahead' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'full, chorus, playing' })).toHaveAttribute('aria-current', 'true'));
    await expect(canvas.getByRole('button', { name: '+bass, verse, played' })).not.toHaveAttribute('aria-current');
  },
});

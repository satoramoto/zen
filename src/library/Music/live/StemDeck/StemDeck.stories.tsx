import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { expectFits, host, withHost } from '../host.story';
import { StemDeck, type StemDeckProps } from './StemDeck';
import StemDeckSvelte from './StemDeck.svelte';
import { deckStems, stemDeckArgTypes, stemDeckBoard, stemDeckStories as s } from './StemDeck.fixtures';

// Every story is built from StemDeck.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws it
// with React's or Svelte's `Tree`. Disabled is the deck with no `onMute`: read-only.

/**
 * A song's separated stems on one deck in mix[flow]'s face: a lane per stem over the host's
 * measured waveform, its route, an M toggle and its gain; the section marks and the playhead are
 * the host's. A lane without an envelope says so.
 */
const meta = {
  id: 'music-live-stem-deck',
  title: 'Music/Live/Stem deck',
  component: StemDeck,
  decorators: [withRenderer, withStoryFrame, withHost, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 640, h: 360 } },
  args: stemDeckBoard,
  argTypes: stemDeckArgTypes,
} satisfies Meta<typeof StemDeck>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(StemDeck, StemDeckSvelte);

/** A story in its own frame, keeping the fixture's Svelte parameters. */
const framed = (st: Story, w: number, h: number): Story => ({ ...st, parameters: { ...st.parameters, frame: { w, h } } });

/** A story with a mute spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onMute: fn() },
});

/** The drums muted (the drummer plays them), the rest routed on. A toggle asks by stem id; the lanes keep the host's state. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('group', { name: /^\w+ stem(, muted)?$/ })).toHaveLength(4);
    await expect(canvas.getByRole('button', { name: 'Mute Drums' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('group', { name: 'Drums stem, muted' })).toHaveAttribute('data-muted', 'true');
    await expect(canvas.getByRole('img', { name: 'Bass: measured stem envelope' })).toBeTruthy();
    await expect(canvas.getByText('→ PLAYBACK (bv)')).toBeTruthy();
    await expect(within(canvas.getByRole('list', { name: 'Sections' })).getAllByRole('listitem').map((m) => m.textContent)).toEqual(['INTRO', 'VERSE', 'CHORUS', 'BRIDGE', 'OUT']);
    await userEvent.click(canvas.getByRole('button', { name: 'Mute Bass' }));
    await expect(args.onMute).toHaveBeenCalledWith('bass');
    canvas.getByRole('button', { name: 'Mute Vocals' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onMute).toHaveBeenLastCalledWith('vocals');
    // Nothing mutes until the host says so.
    await expect(canvas.getByRole('button', { name: 'Mute Bass' })).toHaveAttribute('aria-pressed', 'false');
    // The playhead sits where the host put it: 30% across the lanes.
    const lanes = canvasElement.querySelector('[data-part="lanes"]')!.getBoundingClientRect();
    const head = canvasElement.querySelector('[data-part="playhead"]')!.getBoundingClientRect();
    await expect((head.left - lanes.left) / lanes.width).toBeCloseTo(0.3, 1);
  },
});

/**
 * Every state: a stem with no envelope says so (no waveform drawn), one not separated yet is
 * disabled with the host's reason and asks nothing, a stem with no gain reads a dash, and with no
 * position there is no playhead.
 */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('img', { name: /^Bass:/ })).toBeNull();
    await expect(within(canvas.getByRole('group', { name: 'Bass stem' })).getByText('no waveform')).toBeTruthy();
    const other = canvas.getByRole('button', { name: 'Mute Other, unavailable: separating…' });
    await expect(other).toBeDisabled();
    await userEvent.click(other, { pointerEventsCheck: 0 });
    await expect(args.onMute).not.toHaveBeenCalled();
    await expect(within(canvas.getByRole('group', { name: 'Other stem' })).getByText('separating…')).toBeTruthy();
    await expect(canvas.getByRole('group', { name: 'Vocals stem' }).querySelector('[data-part="gain"]')).toHaveTextContent('—');
    await expect(canvasElement.querySelector('[data-part="playhead"]')).toBeNull();
  },
});

/** The `toggles` form: the ONE board's strip, one inked toggle per stem, its first letter, lit while the stem plays (the drums are muted). */
export const Dense: Story = framed(
  live(s.Dense, {
    play: async ({ args, canvasElement }) => {
      const canvas = within(canvasElement);
      const toggles = canvas.getAllByRole('button');
      await expect(toggles.map((t) => t.textContent)).toEqual(['D', 'B', 'V', 'O']);
      await expect(toggles.map((t) => t.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'true', 'true']);
      await expect(canvas.queryByRole('img')).toBeNull();
      await userEvent.click(canvas.getByRole('button', { name: 'Other audible' }));
      await expect(args.onMute).toHaveBeenCalledWith('other');
      await expectFits(canvasElement);
    },
  }),
  200,
  40,
);

/** Nothing on the deck: one quiet well, nothing to press. */
export const Empty: Story = story(s.Empty, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No stems')).toBeTruthy();
    await expect(canvas.queryAllByRole('button')).toHaveLength(0);
  },
});

/** No `onMute`: the deck is read, not pressed. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
  },
});

/** A host that mutes and unmutes the stem asked about. */
const mixer = host<StemDeckProps>({ apply: { onMute: (p, id: string) => ({ stems: p.stems.map((st) => (st.id === id ? { ...st, muted: !st.muted } : st)) }) } });

/** Controlled readback: a toggle mutes its lane once the host does, and unmutes it again; the other lanes keep the host's state. */
export const Hosted: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, ...mixer },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Mute Bass' }));
    await waitFor(() => expect(canvas.getByRole('group', { name: 'Bass stem, muted' })).toHaveAttribute('data-muted', 'true'));
    await expect(canvas.getByRole('button', { name: 'Mute Bass' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Mute Drums' }));
    await waitFor(() => expect(canvas.getByRole('group', { name: 'Drums stem' })).not.toHaveAttribute('data-muted'));
    await userEvent.click(canvas.getByRole('button', { name: 'Mute Bass' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Mute Bass' })).toHaveAttribute('aria-pressed', 'false'));
    await expect(canvas.getByRole('button', { name: 'Mute Vocals' })).toHaveAttribute('aria-pressed', 'false');
    await expect((args.onMute as ReturnType<typeof fn>).mock.calls.map(([id]) => id)).toEqual(['bass', 'drums', 'bass']);
  },
});

/** Rebinding: the host loads the next song's stems. The old lanes are gone, and a toggle asks about the new song's stem. */
export const Rebound: Story = live(s.Default, {
  parameters: {
    ...story(s.Default).parameters,
    host: {
      ...mixer.host,
      presets: { 'Load Wire': { title: 'Wire', sub: '128 · E · warped', stems: deckStems.slice(0, 2).map((st) => ({ ...st, id: `wire-${st.id}`, muted: false })), position: 0 } },
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Load Wire' }));
    await waitFor(() => expect(canvas.getByRole('group', { name: 'Wire stems' })).toBeTruthy());
    await expect(canvas.queryByRole('group', { name: /^Vocals stem/ })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Mute Drums' }));
    await expect(args.onMute).toHaveBeenCalledTimes(1);
    await expect(args.onMute).toHaveBeenCalledWith('wire-drums');
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Mute Drums' })).toHaveAttribute('aria-pressed', 'true'));
  },
});

/** Removal: the waveforms' painters let go with the deck, and a remounted deck draws and toggles again. */
export const Remounted: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, host: { ...mixer.host, removable: true } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove pane' }));
    await waitFor(() => expect(canvas.queryAllByRole('img')).toHaveLength(0));
    await userEvent.click(canvas.getByRole('button', { name: 'Mount pane' }));
    await waitFor(() => expect(canvas.getAllByRole('img', { name: /measured stem envelope/ })).toHaveLength(4));
    await userEvent.click(canvas.getByRole('button', { name: 'Mute Other' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Mute Other' })).toHaveAttribute('aria-pressed', 'true'));
    await expect(args.onMute).toHaveBeenCalledTimes(1);
  },
});

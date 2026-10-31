import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { expectFits, host, withHost } from '../host.story';
import { TrackStrips, type TrackStripsProps } from './TrackStrips';
import { dbText } from './TrackStrips.model';
import TrackStripsSvelte from './TrackStrips.svelte';
import { trackStripsArgTypes, trackStripsBoard, trackStripsStories as s } from './TrackStrips.fixtures';

// Every story is built from TrackStrips.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws
// it with React's or Svelte's `Tree`. Disabled is the mixer with no callbacks: read, not ridden.

/**
 * The looper's mixer in mix[flow]'s face: one narrow channel per track (letter and name, send
 * knobs, fader and meter in a well, M / S / ●) and the FX returns at the right.
 */
const meta = {
  id: 'music-live-track-strips',
  title: 'Music/Live/Track strips',
  component: TrackStrips,
  decorators: [withRenderer, withStoryFrame, withHost, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 900, h: 360 } },
  args: trackStripsBoard,
  argTypes: trackStripsArgTypes,
} satisfies Meta<typeof TrackStrips>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(TrackStrips, TrackStripsSvelte);

/** A story with every callback a spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onLevel: fn(), onSend: fn(), onReturn: fn(), onMute: fn(), onSolo: fn(), onArm: fn(), onSelect: fn() },
});

/** Keys selected and armed, vox soloed, gtr muted. Every fader, knob, toggle and name asks its callback. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Keys arm' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Gtr mute' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Drums mute' }));
    await expect(args.onMute).toHaveBeenCalledWith('drums');
    await userEvent.click(canvas.getByRole('button', { name: 'Bass solo' }));
    await expect(args.onSolo).toHaveBeenCalledWith('bass');
    await userEvent.click(canvas.getByRole('button', { name: 'Vox arm' }));
    await expect(args.onArm).toHaveBeenCalledWith('vox');
    await userEvent.click(canvas.getByRole('button', { name: 'Select Bass' }));
    await expect(args.onSelect).toHaveBeenCalledWith('bass');
    await fireEvent.keyDown(canvas.getByRole('slider', { name: 'Drums level' }), { key: 'ArrowUp' });
    await expect(args.onLevel).toHaveBeenCalledWith({ track: 'drums', level: expect.closeTo(0.81, 5) });
    await fireEvent.keyDown(canvas.getByRole('slider', { name: 'Drums send B' }), { key: 'ArrowDown' });
    await expect(args.onSend).toHaveBeenCalledWith({ track: 'drums', send: 1, level: expect.closeTo(0.74, 5) });
    await fireEvent.keyDown(canvas.getByRole('slider', { name: 'FX A level' }), { key: 'ArrowUp' });
    await expect(args.onReturn).toHaveBeenCalledWith({ id: 'fxa', level: expect.closeTo(0.71, 5) });
    await expect(canvas.getAllByText('-1.9 dB')).toHaveLength(2);
  },
});

/** Every lamp lit somewhere, a fader at the bottom (-inf dB) and one at unity with a full meter. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('-inf dB')).toBeTruthy();
    await expect(canvas.getByText('0.0 dB')).toBeTruthy();
    for (const name of ['Vox mute', 'Vox solo', 'Vox arm']) await expect(canvas.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true');
  },
});

/** The `short` form in a smaller frame: no send knobs. */
export const Dense: Story = (() => {
  const base = live(s.Dense, {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.queryByRole('slider', { name: 'Drums send A' })).toBeNull();
      await expect(canvas.getAllByRole('slider')).toHaveLength(5);
    },
  });
  return { ...base, parameters: { ...base.parameters, frame: { w: 420, h: 240 } } };
})();

/** No tracks and no returns. */
export const Empty: Story = story(s.Empty, {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No tracks')).toBeTruthy();
  },
});

/** No callbacks: every name and toggle is disabled, every fader and knob inert. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
    for (const slider of canvas.getAllByRole('slider')) await expect(slider).toHaveAttribute('aria-disabled', 'true');
  },
});

/** A host that keeps every strip's state: it sets what each control asked for. */
const mixer = host<TrackStripsProps>({
  apply: {
    onLevel: (p, { track, level }: { track: string; level: number }) => ({ tracks: p.tracks.map((t) => (t.id === track ? { ...t, level } : t)) }),
    onSend: (p, { track, send, level }: { track: string; send: 0 | 1; level: number }) => ({
      tracks: p.tracks.map((t) => (t.id === track ? { ...t, sends: (send === 0 ? [level, t.sends?.[1] ?? 0] : [t.sends?.[0] ?? 0, level]) as [number, number] } : t)),
    }),
    onReturn: (p, { id, level }: { id: string; level: number }) => ({ returns: p.returns.map((r) => (r.id === id ? { ...r, level } : r)) }),
    onMute: (p, id: string) => ({ tracks: p.tracks.map((t) => (t.id === id ? { ...t, muted: !t.muted } : t)) }),
    onSolo: (p, id: string) => ({ tracks: p.tracks.map((t) => (t.id === id ? { ...t, soloed: !t.soloed } : t)) }),
    onArm: (p, id: string) => ({ tracks: p.tracks.map((t) => (t.id === id ? { ...t, armed: !t.armed } : t)) }),
    onSelect: (_, id: string) => ({ selected: id }),
  },
});

const strip = (el: HTMLElement) => el.closest('[data-part="strip"]') as HTMLElement;
const db = (canvas: ReturnType<typeof within>, name: string) => strip(canvas.getByRole('slider', { name: `${name} level` })).querySelector('[data-part="db"]')!.textContent;

/**
 * Controlled readback. A fader dragged up (the shared parameter gesture, anchored at its value)
 * rises, and its slider and dB reading follow the host; an arrow steps from the host's level. A
 * send knob reads back as a percentage, a toggle as its lamp, a name as the selected strip. Every
 * ask names its own track and leaves the others alone.
 */
export const Hosted: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, ...mixer },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const drums = canvas.getByRole('slider', { name: 'Drums level' });
    const before = Number(drums.getAttribute('aria-valuenow'));
    await fireEvent.pointerDown(drums, { pointerId: 3, button: 0, clientX: 10, clientY: 200 });
    await fireEvent.pointerMove(drums, { pointerId: 3, clientX: 10, clientY: 140 });
    await fireEvent.pointerUp(drums, { pointerId: 3 });
    const asked = (args.onLevel as ReturnType<typeof fn>).mock.calls.at(-1)![0] as { track: string; level: number };
    await expect(asked.track).toBe('drums');
    await expect(asked.level).toBeGreaterThan(before);
    await expect(asked.level).toBeLessThanOrEqual(1);
    await waitFor(() => expect(Number(canvas.getByRole('slider', { name: 'Drums level' }).getAttribute('aria-valuenow'))).toBeCloseTo(asked.level, 5));
    await expect(db(canvas, 'Drums')).toBe(dbText(asked.level));
    // Bass was never asked about: its fader and reading keep the host's value.
    await expect(db(canvas, 'Bass')).toBe('-2.5 dB');
    const bass = canvas.getByRole('slider', { name: 'Bass level' });
    bass.focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await waitFor(() => expect(Number(canvas.getByRole('slider', { name: 'Bass level' }).getAttribute('aria-valuenow'))).toBeCloseTo(0.73, 5));
    await expect(canvas.getByRole('slider', { name: 'Bass level' })).toHaveFocus();
    const send = canvas.getByRole('slider', { name: 'Keys send A' });
    send.focus();
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(canvas.getByRole('slider', { name: 'Keys send A' })).toHaveAttribute('aria-valuetext', '61 %'));
    await expect(args.onSend).toHaveBeenLastCalledWith({ track: 'keys', send: 0, level: expect.closeTo(0.61, 5) });
    await userEvent.click(canvas.getByRole('button', { name: 'Drums mute' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Drums mute' })).toHaveAttribute('aria-pressed', 'true'));
    await userEvent.click(canvas.getByRole('button', { name: 'Drums mute' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Drums mute' })).toHaveAttribute('aria-pressed', 'false'));
    await userEvent.click(canvas.getByRole('button', { name: 'Select Bass' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Select Bass' })).toHaveAttribute('aria-current', 'true'));
    await expect(canvas.getByRole('button', { name: 'Select Keys' })).not.toHaveAttribute('aria-current', 'true');
  },
});

/** No meter readings (one non-finite): every fader, lamp and dB reading, and no meter drawn as silence. */
export const Unmetered: Story = live(s.Unmetered, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryAllByRole('meter')).toHaveLength(0);
    await expect(canvasElement.querySelectorAll('[data-part="db"]').length).toBeGreaterThanOrEqual(4);
    await expect(canvas.getAllByRole('slider', { name: / level$/ }).length).toBeGreaterThanOrEqual(4);
  },
});

/** Removal: a drag cut off by removing the strips asks nothing more; remounted, the fader moves again. */
export const Remounted: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, host: { ...mixer.host, removable: true } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const drums = canvas.getByRole('slider', { name: 'Drums level' });
    await fireEvent.pointerDown(drums, { pointerId: 4, button: 0, clientX: 10, clientY: 200 });
    await fireEvent.pointerMove(drums, { pointerId: 4, clientX: 10, clientY: 150 });
    await waitFor(() => expect(args.onLevel).toHaveBeenCalled());
    const calls = (args.onLevel as ReturnType<typeof fn>).mock.calls.length;
    await userEvent.click(canvas.getByRole('button', { name: 'Remove pane' }));
    await waitFor(() => expect(canvas.queryByRole('slider', { name: 'Drums level' })).toBeNull());
    await fireEvent.pointerMove(drums, { pointerId: 4, clientX: 10, clientY: 100 });
    await fireEvent.pointerMove(window, { pointerId: 4, clientX: 10, clientY: 60 });
    await fireEvent.pointerUp(window, { pointerId: 4 });
    await expect(args.onLevel).toHaveBeenCalledTimes(calls);
    await userEvent.click(canvas.getByRole('button', { name: 'Mount pane' }));
    const again = await canvas.findByRole('slider', { name: 'Drums level' });
    again.focus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(args.onLevel).toHaveBeenCalledTimes(calls + 1);
  },
});

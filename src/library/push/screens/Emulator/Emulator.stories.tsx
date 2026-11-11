import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../foundation/stories/story';
import { Emulator } from './Emulator';
import EmulatorSvelte from './Emulator.svelte';
import { emulatorStories as s } from './Emulator.fixtures';
import { actions, app, cell, down, feel, go, hit, lampState, lists, pads, press, rowTexts, screenKind, turn, wait, waitFor } from '../play';
import type { PlayContext } from '../scenario';

/** A Push 3 emulator: the device over the sample Set, with a stand-in host answering it. */
const meta = {
  title: 'Push/Screens/Emulator',
  component: Emulator,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { onIntent: fn(), onInput: fn(), onState: fn() },
} satisfies Meta<typeof Emulator>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Emulator, EmulatorSvelte);

/** Press Play: the device asks, the stand-in host starts the Set, and the Play lamp lights. */
export const Sample: Story = {
  ...story(s.Sample),
  play: async ({ canvasElement, args }) => {
    await expect(lampState(canvasElement, 'play')).toBe('dim');
    await press(canvasElement, 'play');
    await expect(args.onIntent).toHaveBeenCalledWith({ kind: 'transport', action: 'play' });
    await waitFor(() => expect(lampState(canvasElement, 'play')).toBe('lit'));
    await expect(canvasElement.querySelector('[data-intent="play"]')).not.toBeNull();
  },
};
/** Control Mode: the User button can be pressed. */
export const ControlMode: Story = story(s.ControlMode);
/** A host that refuses: Play is asked and its lamp does not light. */
export const Refusing: Story = {
  ...story(s.Refusing),
  play: async ({ canvasElement, args }) => {
    await press(canvasElement, 'play');
    await expect(args.onIntent).toHaveBeenCalledTimes(1);
    await expect(lampState(canvasElement, 'play')).toBe('dim');
    await expect(cell(canvasElement, 'play')).not.toHaveAttribute('data-held');
  },
};
export const Bare: Story = story(s.Bare);

/**
 * A whole session, start to finish, on the surface: a drum track is added from the browser, a beat
 * is put in on the steps, a bass line is recorded, a scene is launched, a track is mixed and the
 * Set is saved. The stand-in host sees every step, and the device shows what the host kept.
 */
export const ASession: Story = {
  ...story(s.Bare),
  play: async (context) => {
    const c = context.canvasElement;
    const asked = () => actions(context as unknown as PlayContext);
    const since = (from: number) => asked().slice(from);
    const tracks = () => app(c).getSet().tracks;

    // Add a drum track from the browser: Add, MIDI Track, Drums, the first kit.
    const before = tracks().length;
    await press(c, 'add');
    await go(c, 'down', 'centre');
    await go(c, 'down', 'down', 'centre');
    await expect(lists(c).at(-1)!.rows[0]).toBe('808 Core Kit');
    await go(c, 'centre');
    await waitFor(() => expect(tracks().length).toBe(before + 1));
    const kit = tracks().find((t) => t.id === app(c).getSet().selection.track)!;
    await expect(kit.devices[0]?.kind).toBe('drum-rack');
    // One intent asked for both: a MIDI track, with that kit on it.
    await expect(asked().filter((a) => a === 'add-track')).toHaveLength(1);
    await waitFor(() => expect(screenKind(c)).not.toBe('browse'));

    // Sequence a beat: the kick is selected, and four steps of the top row take it.
    let mark = asked().length;
    await hit(c, 8, 1);
    for (const col of [1, 3, 5, 7]) await hit(c, 1, col);
    await expect(since(mark).filter((a) => a === 'add-note')).toHaveLength(4);
    await waitFor(() => expect(tracks().find((t) => t.id === kit.id)!.clips.some((clip) => (clip?.notes?.length ?? 0) >= 4)).toBe(true));

    // Record a melody on the Pad track: select it by its name in the track row, record, play three notes, stop recording.
    mark = asked().length;
    const column = rowTexts(c, 'bottom').findIndex((name) => /Pad$/.test(name)) + 1;
    await expect(column).toBeGreaterThan(0);
    await press(c, `lower-${column}`);
    await waitFor(() => expect(app(c).getSet().selection.track).toBe('t-pad'));
    await press(c, 'record');
    for (const col of [1, 3, 5]) await hit(c, 8, col, 60);
    await press(c, 'record');
    await expect(since(mark)).toContain('select-track');
    await expect(since(mark).filter((a) => a === 'note-on')).toHaveLength(3);
    await expect(since(mark).filter((a) => a === 'note-off')).toHaveLength(3);
    await expect(since(mark).some((a) => /record/.test(a))).toBe(true);

    // Launch a scene from the Session pads.
    mark = asked().length;
    await press(c, 'session');
    await press(c, 'scene-2');
    await expect(since(mark)).toContain('launch-scene');
    await waitFor(() => expect(app(c).getSet().transport.playing).toBe(true));

    // Mix: the second track's volume, down a little.
    mark = asked().length;
    await press(c, 'mix');
    const volume = tracks()[1].volume.value;
    await turn(c, 'encoder-2', -4);
    await expect(since(mark).filter((a) => a === 'set-parameter')).toHaveLength(4);
    await waitFor(() => expect(tracks()[1].volume.value).toBeLessThan(volume));

    // Save.
    mark = asked().length;
    await press(c, 'save');
    await expect(since(mark).some((a) => /^save/.test(a))).toBe(true);

    // The host saw every one of them, in order: its log ends as the device's asking does.
    const log = app(c).intents().map((i) => i.action);
    await expect(asked().slice(-log.length)).toEqual(log);
  },
};

/**
 * Only what changed is drawn again. A harder press on one held pad writes a property on that pad
 * and touches no other; a level arriving for the meters redraws no cell of the screen.
 */
export const OnlyWhatChanged: Story = {
  ...story(s.Bare),
  play: async ({ canvasElement: c }) => {
    // Every change to the device's own DOM, from here on.
    const changed: { target: Node; type: string; name: string | null }[] = [];
    const observer = new MutationObserver((records) => {
      for (const r of records) changed.push({ target: r.target, type: r.type, name: r.attributeName });
    });
    const watch = () => observer.observe(c.querySelector('.push-surface')!, { subtree: true, childList: true, attributes: true, characterData: true });

    // One pad held with a pen, pressed harder.
    await press(c, 'lower-2');
    await wait(80);
    const held = await down(c, 'pad-8-1', { pointerType: 'pen', pressure: 0.3 });
    await wait(80);
    const before = feel(c, 'pad-8-1').style.getPropertyValue('--push-pressure');
    watch();
    await held.move(0.5, 0.5, { pressure: 0.9 });
    await wait(80);
    observer.disconnect();
    await expect(Number(feel(c, 'pad-8-1').style.getPropertyValue('--push-pressure'))).toBeGreaterThan(Number(before));
    const others = pads(c).filter((p) => p.dataset.control !== 'pad-8-1');
    await expect(changed.length).toBeGreaterThan(0);
    await expect(changed.filter((m) => others.some((p) => p.contains(m.target)))).toEqual([]);
    // Nothing was put in or taken out of the page, anywhere.
    await expect(changed.filter((m) => m.type === 'childList')).toEqual([]);
    await held.up();

    // A level for the meters, on the mix screen.
    await press(c, 'mix');
    await wait(120);
    changed.length = 0;
    watch();
    const levels = Object.fromEntries(app(c).getSet().tracks.map((t) => [t.id, [0.8, 0.7] as [number, number]]));
    (globalThis as { pushFrame?: unknown }).pushFrame = { levels };
    await wait(200);
    observer.disconnect();
    delete (globalThis as { pushFrame?: unknown }).pushFrame;
    const meters = [...c.querySelectorAll<HTMLElement>('.push-display__meter')];
    await expect(meters.length).toBeGreaterThan(0);
    await expect(meters.every((m) => !m.hasAttribute('data-unmeasured'))).toBe(true);
    // The meters moved by properties and attributes of their own; no cell was rebuilt and nothing outside a meter changed.
    await expect(changed.length).toBeGreaterThan(0);
    await expect(changed.filter((m) => m.type === 'childList')).toEqual([]);
    await expect(changed.filter((m) => !meters.some((meter) => meter.contains(m.target)))).toEqual([]);
  },
};

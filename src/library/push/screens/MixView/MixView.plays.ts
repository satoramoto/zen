// What each push-mix-view scenario does and checks. The words are in MixView.stories.tsx.
import { lampVar } from '../../../foundation/themes/lamps';
import { param } from '../../model/sample';
import { initialState } from '../../model/state';
import type { PushSet, Track } from '../../model/types';
import { all, app, bodyTexts, cell, column, columns, display, expect, forget, given, holding, intent, lamp, lampState, onTrack, overlay, press, rowTexts, screenKind, tab, turn, wait, waitFor } from '../play';
import type { Play } from '../scenario';

const none = async () => {};
const inMix = { initialState: { ...initialState(), display: 'mix' as const } };
const inTrackMix = { initialState: { ...initialState(), display: 'mix' as const, mix: { mode: 'track' as const, parameter: 0, page: 0 } } };
/** Give a Set `n` return tracks, with a send on every track for each. */
const returns = (n: number) => (set: PushSet) => {
  const letters = 'ABCDEFGH';
  const base = set.returns[0];
  set.returns = Array.from({ length: n }, (_, i): Track => ({ ...base, id: `r-${i}`, name: `${letters[i]} Return`, devices: [], volume: { ...base.volume, id: `r-${i}.volume` }, pan: { ...base.pan, id: `r-${i}.pan` } }));
  for (const t of set.tracks) t.sends = set.returns.map((r, i) => param(`${t.id}.send${i}`, r.name, 0.1 * i, `${-40 + i} dB`));
};
type Frame = { pushFrame?: { levels: Record<string, [number, number]> } };

export const plays = {
  TwoPresses: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'mix');
      cell(c, 'mix').dataset.first = screenKind(c);
      await press(c, 'mix');
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'mix').dataset.first).toBe('mix-global');
      expect(screenKind(c)).toBe('mix-track');
      expect(lampState(c, 'mix')).toBe('lit');
    },
  },

  Volumes: {
    args: inMix,
    act: none,
    check: ({ canvasElement: c }) => {
      expect(tab(c, 'top', 1)).toHaveTextContent('Volumes');
      expect(tab(c, 'top', 1)).toHaveAttribute('data-selected', 'true');
      expect(columns(c)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      for (let col = 1; col <= 8; col++) {
        const el = column(c, col)!;
        expect(el).toHaveAttribute('data-type', 'meter');
        expect(el.querySelectorAll('[role="meter"]')).toHaveLength(2);
        expect(el.querySelector('[role="slider"]')).not.toBeNull();
        expect(el).toHaveTextContent(/-?\d+\.\d dB/);
      }
      // In the track's colour: the drums are colour 14.
      expect(column(c, 1)!.style.getPropertyValue('--push-lamp')).toBe(lampVar(14));
    },
  },

  Pans: {
    args: inMix,
    act: async ({ canvasElement: c }) => {
      await press(c, 'upper-2');
      await turn(c, 'encoder-3', 2);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(tab(c, 'top', 2)).toHaveAttribute('data-selected', 'true');
      for (let col = 1; col <= 8; col++) expect(column(c, col)).toHaveAttribute('data-style', 'bipolar');
      expect(intent(context, 'set-parameter')).toMatchObject({ parameter: 't-keys.pan', track: 't-keys' });
    },
  },

  RidingAVolume: {
    args: inMix,
    act: async ({ canvasElement: c }) => {
      await turn(c, 'encoder-2', -3);
    },
    check: (context) => {
      const asked = all(context, 'set-parameter');
      expect(asked).toHaveLength(3);
      for (const i of asked) {
        expect(i).toMatchObject({ parameter: 't-bass.volume', track: 't-bass' });
        expect(i.delta as number).toBeLessThan(0);
      }
      expect(app(context.canvasElement).getSet().tracks[1].volume.value).toBeLessThan(0.85);
    },
  },

  ALoudHit: {
    args: inMix,
    act: async ({ canvasElement: c }) => {
      const meter = column(c, 1)!.querySelector<HTMLElement>('.wdg-meter')!;
      const fill = () => Number(meter.style.getPropertyValue('--wdg-meter-fill') || 0);
      const peak = () => Number(meter.style.getPropertyValue('--wdg-meter-peak') || 0);
      (globalThis as Frame).pushFrame = { levels: { 't-drums': [0.95, 0.95] } };
      await wait(350);
      meter.dataset.loud = `${fill()} ${peak()} ${display(c).dataset.kind}`;
      (globalThis as Frame).pushFrame = { levels: { 't-drums': [0.05, 0.05] } };
      await wait(450);
      meter.dataset.after = `${fill()} ${peak()}`;
      // The rest of the screen was not redrawn for any of it: the same element is still there.
      meter.dataset.same = String(column(c, 1)!.querySelector('.wdg-meter') === meter);
      await wait(900);
      meter.dataset.later = `${fill()} ${peak()}`;
      delete (globalThis as Frame).pushFrame;
    },
    check: ({ canvasElement: c }) => {
      const meter = column(c, 1)!.querySelector<HTMLElement>('.wdg-meter')!;
      const [loud, loudPeak] = meter.dataset.loud!.split(' ').map(Number);
      const [after, afterPeak] = meter.dataset.after!.split(' ').map(Number);
      const [, laterPeak] = meter.dataset.later!.split(' ').map(Number);
      expect(loud).toBeGreaterThan(0.8);
      expect(after).toBeLessThan(0.3);
      // The peak mark stayed where the hit reached, a moment longer than the level.
      expect(afterPeak).toBeGreaterThan(0.8);
      expect(afterPeak).toBeCloseTo(loudPeak, 1);
      expect(laterPeak).toBeLessThan(0.3);
      expect(meter.dataset.same).toBe('true');
    },
  },

  EightReturns: {
    args: inMix,
    set: returns(8),
    act: async ({ canvasElement: c }) => {
      cell(c, 'upper-8').dataset.before = rowTexts(c, 'top').join('|');
      await press(c, 'upper-8');
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'upper-8').dataset.before).toBe('Volumes|Pans|A Return|B Return|C Return|D Return|E Return|›');
      expect(rowTexts(c, 'top')).toEqual(['Volumes', 'Pans', 'F Return', 'G Return', 'H Return', '', '', '›']);
      expect(tab(c, 'top', 8).querySelector('[role="img"]')).toHaveAccessibleName('more to the right');
    },
  },

  OneTracksSends: {
    args: inTrackMix,
    set: onTrack('t-bass'),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(rowTexts(c, 'top').slice(0, 2)).toEqual(['Mix', 'Input & Output']);
      expect(columns(c)).toEqual([1, 2, 3, 4]);
      const texts = bodyTexts(c);
      expect(texts[1]).toContain('Volume');
      expect(texts[2]).toContain('Pan');
      expect(texts[3]).toContain('A Reverb');
      expect(texts[4]).toContain('B Delay');
      expect(texts[3]).toContain('-24 dB');
    },
  },

  ChoosingInput2: {
    args: inTrackMix,
    set: onTrack('t-vocals'),
    act: async ({ canvasElement: c }) => {
      await press(c, 'upper-2');
      // The Input Channel is the fourth encoder; a choice moves once every four steps.
      await turn(c, 'encoder-4', 4);
    },
    check: (context) => {
      expect(tab(context.canvasElement, 'top', 2)).toHaveAttribute('data-selected', 'true');
      expect(intent(context, 'set-routing')).toEqual({ kind: 'edit', action: 'set-routing', track: 't-vocals', inputChannel: '2' });
    },
  },

  MonitoringOff: {
    args: inTrackMix,
    set: onTrack('t-vocals'),
    act: async ({ canvasElement: c }) => {
      await press(c, 'upper-2');
      await turn(c, 'encoder-1', 4);
    },
    check: (context) => {
      expect(intent(context, 'set-monitor')).toEqual({ kind: 'edit', action: 'set-monitor', track: 't-vocals', monitor: 'off' });
      expect(bodyTexts(context.canvasElement)[1]).toContain('Off');
    },
  },

  NoADAT: {
    args: { initialState: { ...initialState(), display: 'mix', mix: { mode: 'track', parameter: 0, page: 0, io: true } } },
    set: onTrack('t-vocals', (set) => void (set.tracks[4].routing!.inputChannels = ['1', '2', '1/2'])),
    act: async ({ canvasElement: c }) => {
      await turn(c, 'encoder-4', 40);
    },
    check: (context) => {
      const c = context.canvasElement;
      const offered = [...column(c, 4)!.querySelectorAll('button')].map((b) => b.textContent?.trim().replace(/\s.*$/, ''));
      expect(offered).toEqual(['1', '2', '1/2']);
      // However far it is turned, only what the Set lists is asked for.
      expect([...new Set(all(context, 'set-routing').map((i) => i.inputChannel))]).toEqual(['2', '1/2']);
    },
  },

  ThereAndBack: {
    set: onTrack('t-keys'),
    act: async ({ canvasElement: c }) => {
      await press(c, 'main');
      await waitFor(() => expect(app(c).getSet().selection.track).toBe('main'));
      cell(c, 'main').dataset.shown = `${screenKind(c)} ${bodyTexts(c)[1]} ${lampState(c, 'main')}`;
      await press(c, 'main');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'main').dataset.shown).toContain('mix-track Volume');
      expect(cell(c, 'main').dataset.shown).toContain('lit');
      expect(all(context, 'select-track').map((i) => i.track)).toEqual(['main', 't-keys']);
      await waitFor(() => expect(app(c).getSet().selection.track).toBe('t-keys'));
    },
  },

  ANinthTrack: {
    args: inMix,
    set: onTrack('t-pad'),
    act: async ({ canvasElement: c }) => {
      cell(c, 'dpad-right').dataset.before = rowTexts(c, 'bottom').join('|');
      await press(c, 'dpad-right');
      await wait(50);
    },
    check: (context) => {
      const c = context.canvasElement;
      // Pad is the eighth track in view; Lead is the ninth.
      expect(cell(c, 'dpad-right').dataset.before!.split('|')[7]).toContain('Pad');
      expect(intent(context, 'select-track')).toMatchObject({ track: 't-lead' });
      expect(rowTexts(c, 'bottom')[7]).toContain('Lead');
      expect(tab(c, 'bottom', 8)).toHaveAttribute('data-selected', 'true');
    },
  },

  MixingAKit: {
    args: inMix,
    act: async ({ canvasElement: c }) => {
      await press(c, 'lower-1');
      await turn(c, 'encoder-3', 1);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(rowTexts(c, 'bottom').map((t) => t.replace(/^[^A-Za-z0-9]+/, ''))).toEqual(['Drums', 'Kick', 'Rim', 'Snare', 'Clap', 'Snare 2', 'Tom Low', 'Hat Closed']);
      for (const col of [2, 3, 4]) expect(tab(c, 'bottom', col)).toHaveAttribute('data-fold', 'child');
      expect(tab(c, 'bottom', 1)).toHaveAttribute('data-fold', 'open');
      for (let col = 1; col <= 8; col++) expect(column(c, col)).toHaveAttribute('data-type', 'meter');
      // Each pad has its own volume: the third encoder asks for the Rim's.
      expect(intent(context, 'set-parameter')).toMatchObject({ parameter: 'd-kit.pad37.volume', track: 't-drums', pad: 37 });
    },
  },

  JumpingToAPad: {
    args: { initialState: { ...initialState(), display: 'mix', unfoldedTrack: 't-drums' } },
    act: async ({ canvasElement: c }) => {
      // The Crash is pad 13 of the kit: well off the end of the row.
      await holding(c, 'select', async () => {
        await press(c, 'pad-5-1');
      });
      await wait(50);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(all(context, 'note-on')).toEqual([]);
      expect(intent(context, 'select-drum-pad')).toMatchObject({ track: 't-drums', note: 48 });
      const selected = [1, 2, 3, 4, 5, 6, 7, 8].filter((col) => tab(c, 'bottom', col).hasAttribute('data-selected'));
      expect(selected).toHaveLength(1);
      expect(tab(c, 'bottom', selected[0])).toHaveTextContent('Crash');
    },
  },

  MutingAnotherTrack: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'mute', async () => {
        await press(c, 'lower-5');
      });
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(all(context, 'mute')).toEqual([{ kind: 'edit', action: 'mute', track: 't-vocals', on: true }]);
      expect(all(context, 'select-track')).toEqual([]);
      expect(app(c).getSet().selection.track).toBe('t-drums');
      // Once the app has muted it, its button is unlit and its name grey.
      expect(lampState(c, 'lower-5')).toBe('off');
      expect(tab(c, 'bottom', 5)).toHaveAttribute('data-dim', 'true');
    },
  },

  TheMuteLamp: {
    act: async ({ canvasElement: c }) => {
      cell(c, 'mute').dataset.before = lampState(c, 'mute');
      await press(c, 'mute');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'mute').dataset.before).toBe('dim');
      expect(intent(context, 'mute')).toMatchObject({ track: 't-drums', on: true });
      await waitFor(() => expect(lampState(c, 'mute')).toBe('lit'));
    },
  },

  TwoArmedTracks: {
    set: (set) => void (set.unit.preferences['Exclusive Arm'].value = 'Off'),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'record', async () => {
        await press(c, 'lower-2');
        await press(c, 'lower-3');
      });
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(all(context, 'arm')).toEqual([{ kind: 'edit', action: 'arm', track: 't-bass', on: true }, { kind: 'edit', action: 'arm', track: 't-keys', on: true }]);
      expect(app(c).getSet().tracks.filter((t) => t.armed).map((t) => t.id)).toEqual(['t-bass', 't-keys']);
      for (const col of [2, 3]) expect(tab(c, 'bottom', col).querySelector('[data-part="armed"]')).not.toBeNull();
      // Record was a modifier here: nothing was recorded.
      expect(all(context, 'record')).toEqual([]);
    },
  },

  SoloLocked: {
    act: async (context) => {
      const c = context.canvasElement;
      await holding(c, 'lock', async () => {
        await press(c, 'solo');
      });
      cell(c, 'solo').dataset.locked = `${lampState(c, 'solo')} ${lampState(c, 'lock')}`;
      forget(context);
      await press(c, 'lower-2');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'solo').dataset.locked).toBe('blink blink');
      expect(all(context, 'solo')).toEqual([{ kind: 'edit', action: 'solo', track: 't-bass', on: true, exclusive: true }]);
      expect(all(context, 'select-track')).toEqual([]);
      expect(app(c).getSet().selection.track).toBe('t-drums');
    },
  },

  Unlocking: {
    args: { initialState: { ...initialState(), lock: 'solo' } },
    act: async (context) => {
      const c = context.canvasElement;
      cell(c, 'lock').dataset.before = lampState(c, 'lock');
      await press(c, 'lock');
      forget(context);
      await press(c, 'lower-2');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'lock').dataset.before).toBe('blink');
      expect(lampState(c, 'lock')).not.toBe('blink');
      expect(lampState(c, 'solo')).not.toBe('blink');
      expect(all(context, 'solo')).toEqual([]);
      expect(intent(context, 'select-track')).toMatchObject({ track: 't-bass' });
    },
  },

  ADoublePress: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'lower-3');
      await press(c, 'lower-3');
    },
    check: (context) => {
      expect(all(context, 'arm')).toEqual([{ kind: 'edit', action: 'arm', track: 't-keys', on: true, exclusive: true }]);
      expect(tab(context.canvasElement, 'bottom', 3).querySelector('[data-part="armed"]')).toHaveAccessibleName('armed');
    },
  },

  DeletingATrack: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'delete', async () => {
        await press(c, 'lower-4');
      });
    },
    check: (context) => {
      expect(all(context, 'delete-track')).toEqual([{ kind: 'edit', action: 'delete-track', track: 't-sampler' }]);
      expect(all(context, 'select-track')).toEqual([]);
    },
  },

  Renaming: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await press(c, 'lower-2');
      });
      cell(c, 'lower-1').dataset.options = rowTexts(c, 'bottom').slice(0, 4).join('|');
      await press(c, 'lower-1');
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'lower-1').dataset.options).toBe('Rename|Group|Freeze|Flatten');
      expect(screenKind(c)).toBe('text-entry');
      expect(overlay(c, 'text-entry')).toHaveAccessibleName('Rename Track');
      expect(overlay(c, 'text-entry')!.querySelector('[data-part="entry"]')).toHaveAccessibleName('Text: Bass');
    },
  },

  ANewColour: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await press(c, 'lower-2');
      });
      // The pads show the lamp table in its order; teal is colour 20: row 3, column 5.
      cell(c, 'pad-3-5').dataset.shown = lamp(c, 'pad-3-5').colour;
      await press(c, 'pad-3-5');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'pad-3-5').dataset.shown).toBe(lampVar(20));
      expect(lamp(c, 'pad-1-1').colour).toBe(lampVar(0));
      expect(intent(context, 'set-colour')).toEqual({ kind: 'edit', action: 'set-colour', of: 'track', track: 't-bass', colour: 20 });
      expect(all(context, 'note-on')).toEqual([]);
      // The app colours the track: its pad is now the marked one.
      await waitFor(() => expect(lampState(c, 'pad-3-5')).toBe('pulse'));
    },
  },

  GroupingThreeTracks: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await press(c, 'lower-2');
        await press(c, 'lower-3');
        await press(c, 'lower-4');
      });
      await press(c, 'lower-2');
    },
    check: (context) => {
      expect(all(context, 'group-tracks')).toEqual([{ kind: 'edit', action: 'group-tracks', tracks: ['t-bass', 't-keys', 't-sampler'] }]);
      expect(all(context, 'select-track')).toEqual([]);
    },
  },

  FlattenNeedsAFrozenTrack: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await press(c, 'lower-2');
      });
      await press(c, 'lower-4');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(tab(c, 'bottom', 4)).toHaveTextContent('Flatten');
      expect(tab(c, 'bottom', 4)).toHaveAttribute('data-dim', 'true');
      expect(lampState(c, 'lower-4')).toBe('off');
      expect(all(context, 'flatten-track')).toEqual([]);
      // Freeze is offered, and once the track is frozen Flatten is.
      expect(tab(c, 'bottom', 3)).not.toHaveAttribute('data-dim');
      await press(c, 'lower-3');
      expect(intent(context, 'freeze-track')).toMatchObject({ track: 't-bass' });
      await holding(c, 'shift', async () => {
        await press(c, 'lower-2');
      });
      expect(tab(c, 'bottom', 4)).not.toHaveAttribute('data-dim');
      expect(tab(c, 'bottom', 3)).toHaveAttribute('data-dim', 'true');
    },
  },
} satisfies Record<string, Play>;

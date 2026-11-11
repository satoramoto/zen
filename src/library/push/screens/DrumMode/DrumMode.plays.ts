// What each push-drum-mode scenario does and checks. The words are in DrumMode.stories.tsx. The
// sample Set's first track holds a Drum Rack of sixteen filled pads from C1 (36): the bottom left
// pad is the Kick, then Rim, Snare, Clap along the row. Its first clip has a one-bar beat.
import { DRUM_KINDS } from '../../model/sample';
import { initialState } from '../../model/state';
import type { PushSet } from '../../model/types';
import { all, cell, expect, GREY, hit, holdDown, holding, intent, lampState, onTrack, overlay, padColour, press, tableLamp, wait, waitFor, whiteLamp, HOLD } from '../play';
import type { Play } from '../scenario';

const none = async () => {};
const kit = (set: PushSet) => set.tracks[0].devices[0];
const layout = (name: string, more: object = {}) => ({ args: { initialState: { ...initialState(), ...more, notes: { ...initialState().notes, layout: { 't-drums': name } } } } });
const pitches = (context: Parameters<Play['check']>[0]) => all(context, 'note-on').map((i) => i.pitch);
/** The drum quarter's sixteen pads, the loop quarter's and the steps', as row and column. */
const quarter = (rows: number[], cols: number[]) => rows.flatMap((r) => cols.map((c) => [r, c] as const));
const DRUMS = quarter([5, 6, 7, 8], [1, 2, 3, 4]);
const RIGHT = quarter([5, 6, 7, 8], [5, 6, 7, 8]);
const STEPS = quarter([1, 2, 3, 4], [1, 2, 3, 4, 5, 6, 7, 8]);

export const plays = {
  Cycling: {
    act: async ({ canvasElement: c }) => {
      const seen: string[] = [];
      for (let i = 0; i < 2; i++) {
        await press(c, 'layout');
        seen.push(overlay(c, 'notice')?.textContent ?? '');
      }
      cell(c, 'layout').dataset.seen = seen.join('|');
    },
    check: ({ canvasElement: c }) => {
      const [first, second] = cell(c, 'layout').dataset.seen!.split('|');
      expect(first).toContain('16 Velocities');
      expect(second).toContain('64 Pads');
    },
  },

  ThreeSections: {
    act: async ({ canvasElement: c }) => {
      await hit(c, 8, 1);
    },
    check: (context) => {
      const c = context.canvasElement;
      // Lower left: drums, each in its pad's colour (the Kick is selected, so white). It plays.
      expect(pitches(context)).toEqual([36]);
      expect(padColour(c, 7, 3)).toBe(tableLamp(5));
      for (const [r, col] of DRUMS) expect(lampState(c, `pad-${r}-${col}`)).toBe('lit');
      // Lower right: loop pages. The clip is one page: the first pad is the page in view, the rest are outside the loop.
      expect(padColour(c, 5, 5)).toBe(whiteLamp());
      for (const [r, col] of RIGHT.slice(1)) expect(lampState(c, `pad-${r}-${col}`)).toBe('off');
      // Upper half: steps. The kick is on the beats: every fourth sixteenth.
      for (const [r, col] of STEPS) expect(padColour(c, r, col) === GREY, `step ${r},${col}`).toBe(!((r === 1 || r === 2) && (col === 1 || col === 5)));
    },
  },

  AnEmptyPad: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'octave-up');
    },
    check: ({ canvasElement: c }) => {
      // The next bank up holds two sounds and fourteen empty pads.
      expect(padColour(c, 8, 1)).toBe(tableLamp(11));
      expect(padColour(c, 8, 2)).toBe(tableLamp(11));
      for (const [r, col] of DRUMS.filter(([r, col]) => !(r === 8 && col <= 2))) expect(padColour(c, r, col)).toBe(GREY);
    },
  },

  AMutedPad: {
    set: (set) => {
      for (const note of [38, 42, 48]) kit(set).pads!.find((p) => p.note === note)!.muted = true;
    },
    act: none,
    check: ({ canvasElement: c }) => {
      // Three pads of three colours, each a darker version of its own.
      expect(padColour(c, 8, 3)).toBe(tableLamp(3, 'dark'));
      expect(padColour(c, 7, 3)).toBe(tableLamp(5, 'dark'));
      expect(padColour(c, 5, 1)).toBe(tableLamp(12, 'dark'));
      expect(padColour(c, 8, 2)).toBe(tableLamp(1));
    },
  },

  TheSelectedPad: {
    act: async ({ canvasElement: c }) => {
      cell(c, 'pad-8-3').dataset.before = padColour(c, 8, 3);
      await hit(c, 8, 3);
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'pad-8-3').dataset.before).toBe(tableLamp(3));
      expect(intent(context, 'select-drum-pad')).toMatchObject({ track: 't-drums', device: 'd-kit', note: 38 });
      await waitFor(() => expect(padColour(c, 8, 3)).toBe(whiteLamp()));
      // The Kick is no longer the selected one.
      expect(padColour(c, 8, 1)).toBe(tableLamp(14));
    },
  },

  SelectWithoutSound: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'select', async () => {
        await hit(c, 8, 4);
      });
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(all(context, 'note-on')).toEqual([]);
      expect(intent(context, 'select-drum-pad')).toMatchObject({ note: 39 });
      await waitFor(() => expect(padColour(c, 8, 4)).toBe(whiteLamp()));
    },
  },

  UpABank: {
    act: async ({ canvasElement: c }) => {
      await hit(c, 8, 1);
      await press(c, 'octave-up');
      await hit(c, 8, 1);
    },
    check: (context) => {
      expect(pitches(context)).toEqual([36, 52]);
    },
  },

  UpARow: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await press(c, 'octave-up');
      });
      await hit(c, 8, 1);
    },
    check: (context) => {
      expect(pitches(context)).toEqual([40]);
    },
  },

  QuietAndLoud: {
    ...layout('16-velocities'),
    act: async ({ canvasElement: c }) => {
      await hit(c, 8, 5);
      await hit(c, 5, 8);
    },
    check: (context) => {
      const struck = all(context, 'note-on');
      expect(struck.map((i) => i.pitch)).toEqual([36, 36]);
      expect(struck.map((i) => i.velocity)).toEqual([7, 127]);
    },
  },

  MomentaryVelocities: {
    act: async ({ canvasElement: c }) => {
      const corner = () => `${padColour(c, 8, 5)}|${lampState(c, 'pad-8-5')}`;
      cell(c, 'layout').dataset.before = corner();
      await holdDown(c, 'layout', async () => {
        cell(c, 'layout').dataset.during = corner();
      }, HOLD);
      await wait(40);
      cell(c, 'layout').dataset.after = `${corner()}|${overlay(c, 'notice')?.textContent ?? ''}`;
    },
    check: ({ canvasElement: c }) => {
      const { before, during: held, after } = cell(c, 'layout').dataset;
      // Before: a loop page outside the loop. Held: the lowest velocity pad, in the track's colour.
      expect(before).toBe('|off');
      expect(held).toBe(`${tableLamp(14, 'dark')}|lit`);
      // Let go: the loop pages again, and the layout has not been stepped.
      expect(after).toBe('|off|');
    },
  },

  Locked: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await press(c, 'layout');
      });
      cell(c, 'layout').dataset.locked = padColour(c, 8, 5);
      await press(c, 'layout');
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'layout').dataset.locked).toBe(tableLamp(14, 'dark'));
      // Layout pressed again: the loop pages are back, and the layout is still Loop Selector.
      expect(lampState(c, 'pad-8-5')).toBe('off');
      expect(overlay(c, 'notice')).toBeNull();
    },
  },

  ALargeKit: {
    ...layout('64-pads'),
    set: (set) => {
      kit(set).pads = Array.from({ length: 64 }, (_, i) => (i < 40 ? { note: 36 + i, name: `Pad ${i + 1}`, colour: i % 14 } : { note: 36 + i, name: '', empty: true }));
      kit(set).selectedPad = 127;
    },
    act: none,
    check: ({ canvasElement: c }) => {
      const colours = quarter([1, 2, 3, 4, 5, 6, 7, 8], [1, 2, 3, 4, 5, 6, 7, 8]).map(([r, col]) => padColour(c, r, col));
      expect(colours.filter((colour) => colour === GREY)).toHaveLength(24);
      expect(colours.filter((colour) => colour !== GREY && colour !== '')).toHaveLength(40);
      // The sixteen pads in view are still bottom left; the next sixteen bottom right.
      expect(padColour(c, 8, 1)).toBe(tableLamp(0));
      expect(padColour(c, 8, 5)).toBe(tableLamp(16 % 14));
    },
  },

  SoloingTheSnare: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'solo', async () => {
        await hit(c, 8, 3);
      });
    },
    check: (context) => {
      expect(all(context, 'set-drum-pad')).toEqual([{ kind: 'edit', action: 'set-drum-pad', track: 't-drums', device: 'd-kit', note: 38, soloed: true }]);
      expect(all(context, 'note-on')).toEqual([]);
      // Solo was a modifier: the track itself was not soloed.
      expect(all(context, 'solo')).toEqual([]);
      expect(padColour(context.canvasElement, 8, 3)).toContain('--push-solo');
    },
  },

  NotesFirst: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'delete', async () => {
        await hit(c, 8, 1);
      });
    },
    check: (context) => {
      expect(all(context, 'delete-notes')).toEqual([{ kind: 'edit', action: 'delete-notes', track: 't-drums', scene: 0, pitch: 36 }]);
      expect(all(context, 'delete-drum-pad')).toEqual([]);
      expect(all(context, 'delete-clip')).toEqual([]);
      expect(all(context, 'note-on')).toEqual([]);
      // The pad keeps its sound: it is still lit, and its steps are gone.
      expect(padColour(context.canvasElement, 8, 1)).not.toBe(GREY);
      expect(padColour(context.canvasElement, 1, 1)).toBe(GREY);
    },
  },

  ThenTheSound: {
    act: async ({ canvasElement: c }) => {
      // The Clap has no notes in the clip.
      await holding(c, 'delete', async () => {
        await hit(c, 8, 4);
      });
    },
    check: (context) => {
      expect(all(context, 'delete-drum-pad')).toEqual([{ kind: 'edit', action: 'delete-drum-pad', track: 't-drums', device: 'd-kit', note: 39 }]);
      expect(all(context, 'delete-notes')).toEqual([]);
    },
  },

  CopyingAHat: {
    set: (set) => void Object.assign(kit(set).pads!.find((p) => p.note === 51)!, { name: '', empty: true, devices: [], colour: undefined }),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'duplicate', async () => {
        await hit(c, 7, 3);
        await hit(c, 5, 4);
      });
    },
    check: (context) => {
      expect(all(context, 'duplicate-drum-pad')).toEqual([{ kind: 'edit', action: 'duplicate-drum-pad', track: 't-drums', device: 'd-kit', from: 42, to: 51 }]);
      expect(all(context, 'note-on')).toEqual([]);
    },
  },

  PickingAColour: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await hit(c, 8, 3);
      });
      // The outer ring holds the colours, clockwise from the top left: orange is the second.
      cell(c, 'pad-1-2').dataset.ring = `${padColour(c, 1, 2)}|${lampState(c, 'pad-4-4')}`;
      await hit(c, 1, 2);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'pad-1-2').dataset.ring).toBe(`${tableLamp(1)}|off`);
      expect(all(context, 'set-colour')).toEqual([{ kind: 'edit', action: 'set-colour', of: 'pad', track: 't-drums', note: 38, device: 'd-kit', colour: 1 }]);
      // The grid is the layout again: that pad is a step, and the Snare wears its new colour.
      expect(padColour(c, 1, 2)).toBe(GREY);
      expect(padColour(c, 8, 3)).toBe(tableLamp(1));
    },
  },

  QuantizingTheHats: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'quantize', async () => {
        await hit(c, 7, 3);
      });
    },
    check: (context) => {
      expect(all(context, 'quantize')).toEqual([{ kind: 'edit', action: 'quantize', track: 't-drums', scene: 0, pitch: 42 }]);
      expect(all(context, 'note-on')).toEqual([]);
    },
  },

  AnMPEKit: {
    // A kit that marks its pads by kind and gives them no colours of their own, on the red drum track.
    set: (set) => {
      kit(set).selectedPad = 127;
      kit(set).pads!.slice(0, 16).forEach((pad, i) => Object.assign(pad, { kind: DRUM_KINDS[i], colour: undefined }));
    },
    act: none,
    check: ({ canvasElement: c }) => {
      const red = tableLamp(14);
      const [kick, snare, tom, hat] = [padColour(c, 8, 1), padColour(c, 8, 3), padColour(c, 7, 2), padColour(c, 7, 3)];
      expect(kick).toBe(red);
      expect(tom).toBe(red);
      for (const shade of [snare, hat]) {
        expect(shade).toContain('--push-lamp-14');
        expect(shade).not.toBe(red);
      }
      expect(snare).not.toBe(hat);
    },
  },

  TenSlices: {
    set: onTrack('t-sampler', (set) => void (set.tracks[3].devices[0].sampler!.slices = Array.from({ length: 10 }, (_, i) => i / 10))),
    act: none,
    check: ({ canvasElement: c }) => {
      const lit = quarter([1, 2, 3, 4, 5, 6, 7, 8], [1, 2, 3, 4, 5, 6, 7, 8]).filter(([r, col]) => lampState(c, `pad-${r}-${col}`) !== 'off').map(([r, col]) => `${r}-${col}`);
      expect(lit.sort()).toEqual(['6-1', '6-2', '7-1', '7-2', '7-3', '7-4', '8-1', '8-2', '8-3', '8-4']);
    },
  },

  MoreThan32Slices: {
    set: onTrack('t-sampler', (set) => void (set.tracks[3].devices[0].sampler!.slices = Array.from({ length: 33 }, (_, i) => i / 33))),
    act: async ({ canvasElement: c }) => {
      await hit(c, 8, 5);
    },
    check: (context) => {
      const c = context.canvasElement;
      for (const [r, col] of quarter([1, 2, 3, 4, 5, 6, 7, 8], [1, 2, 3, 4])) expect(lampState(c, `pad-${r}-${col}`)).toBe('lit');
      // The thirty-third slice is on the bottom row of the right half, and nothing else of that half is lit.
      expect(lampState(c, 'pad-8-5')).toBe('lit');
      for (const [r, col] of quarter([1, 2, 3, 4, 5, 6, 7, 8], [5, 6, 7, 8]).slice(0, -4)) expect(lampState(c, `pad-${r}-${col}`)).toBe('off');
      expect(lampState(c, 'pad-8-6')).toBe('off');
      expect(pitches(context)).toEqual([36 + 32]);
      expect(intent(context, 'select-slice')).toMatchObject({ slice: 32 });
    },
  },

  BackFrom64Pads: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'octave-up');
      await press(c, 'layout');
      await press(c, 'layout');
      await hit(c, 8, 1);
      await press(c, 'layout');
      await hit(c, 8, 1);
    },
    check: (context) => {
      // The second bank's first pad is 52: bottom left in 64 Pads, and still bottom left back in Loop Selector.
      expect(pitches(context)).toEqual([52, 52]);
      expect(overlay(context.canvasElement, 'notice')).toHaveTextContent('Loop Selector');
    },
  },
} satisfies Record<string, Play>;

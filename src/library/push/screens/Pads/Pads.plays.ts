// What each push-pads scenario does and checks. The words are in Pads.stories.tsx. Every scenario
// plays the bass track's synth in the 64 Notes layout, where the bottom left pad is C1.
import { lampVar } from '../../../foundation/themes/lamps';
import { padPitch } from '../../model/scales';
import { initialState } from '../../model/state';
import type { Lamp, PushSet } from '../../model/types';
import { all, cell, down, expect, face, feel, fillOf, forget, given, intent, lamp, onTrack, pads, press, wait, wheel } from '../play';
import type { Play } from '../scenario';

const bass = (more: (set: PushSet) => void = () => {}) => onTrack('t-bass', more);
const C1 = 'pad-8-1';
const pen = { pointerType: 'pen' } as const;
const velocities = (context: Parameters<Play['check']>[0]) => all(context, 'note-on').map((i) => i.velocity as number);
const userLamps = (lamps: Record<string, Lamp>): Pick<Play, 'set' | 'args'> => ({
  set: (set) => {
    set.unit.mode = 'control';
    set.userLamps = lamps;
  },
  args: { initialState: { ...initialState(), user: true } },
});


export const plays = {
  APenPress: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await press(c, C1, 30, { ...pen, pressure: 0.5 });
    },
    check: (context) => {
      const on = intent(context, 'note-on');
      expect(on.pitch).toBe(36);
      expect(on.velocity as number).toBeGreaterThan(35);
      expect(on.velocity as number).toBeLessThan(95);
      expect(all(context, 'note-off').map((i) => i.pitch)).toEqual([36]);
    },
  },

  AMouseClick: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await press(c, C1);
    },
    check: (context) => {
      expect(velocities(context)).toEqual([100]);
    },
  },

  AHarderMouseClick: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await press(c, C1);
      await press(c, C1, 0, { altKey: true });
    },
    check: (context) => {
      const [plain, hard] = velocities(context);
      expect(hard).toBeGreaterThan(plain);
      expect(hard).toBe(127);
    },
  },

  PressingHarder: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      const touch = await down(c, C1, { ...pen, pressure: 0.4 });
      for (const pressure of [0.5, 0.7, 0.9]) await touch.move(0.5, 0.5, { pressure });
      await touch.up();
    },
    check: (context) => {
      const values = all(context, 'pressure').map((i) => i.value as number);
      expect(values).toEqual([0.5, 0.7, 0.9]);
      expect(all(context, 'pressure').every((i) => i.pitch === 36)).toBe(true);
      expect(all(context, 'note-off')).toHaveLength(1);
    },
  },

  PressureWithAMouse: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      const touch = await down(c, C1);
      await wheel(c, C1, 3);
      await wheel(c, C1, -1);
      await touch.up();
    },
    check: (context) => {
      const values = all(context, 'pressure').map((i) => Math.round((i.value as number) * 10) / 10);
      expect(values).toEqual([0.1, 0.2, 0.3, 0.2]);
    },
  },

  StrikingHighOnThePad: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await press(c, C1, 0, { y: 0.95 });
    },
    check: (context) => {
      expect(intent(context, 'note-on').slide as number).toBeGreaterThan(0.9);
    },
  },

  SlidingUp: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      const touch = await down(c, C1, { y: 0.2 });
      for (const y of [0.4, 0.6, 0.8]) await touch.move(0.5, y);
      await touch.up();
    },
    check: (context) => {
      const values = all(context, 'slide').map((i) => i.value as number);
      expect(values).toHaveLength(3);
      expect([...values].sort((a, b) => a - b)).toEqual(values);
      expect(values[2]).toBeGreaterThan(0.75);
    },
  },

  ASmallWobbleStaysInTune: {
    // The in-tune width is a quarter of a pad: an eighth either side of the centre.
    set: bass((set) => void (set.unit.expression.inTuneWidth = 0.25)),
    act: async ({ canvasElement: c }) => {
      const touch = await down(c, C1);
      for (const x of [0.56, 0.44, 0.6, 0.5]) await touch.move(x);
      await touch.up();
    },
    check: (context) => {
      expect(all(context, 'bend')).toEqual([]);
    },
  },

  BendingToTheNextPad: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      const touch = await down(c, C1);
      await touch.move(1.0);
      // The centre of the pad to the right: one pad's pitch across.
      const next = cell(c, 'pad-8-2').getBoundingClientRect();
      const own = cell(c, C1).getBoundingClientRect();
      await touch.move((next.left + next.width / 2 - own.left) / own.width);
      await touch.up();
    },
    check: (context) => {
      const bends = all(context, 'bend');
      expect(bends.length).toBeGreaterThanOrEqual(2);
      // C1 to D1.
      expect(bends.at(-1)!.semitones as number).toBeCloseTo(2, 1);
      expect(bends.every((b) => b.pitch === 36)).toBe(true);
      expect(all(context, 'note-on')).toHaveLength(1);
    },
  },

  Finger: {
    set: bass((set) => void (set.unit.expression.inTune = 'finger')),
    act: async ({ canvasElement: c }) => {
      await press(c, C1, 0, { x: 0.05 });
    },
    check: (context) => {
      expect(all(context, 'note-on')).toHaveLength(1);
      expect(all(context, 'bend')).toEqual([]);
    },
  },

  Pad: {
    set: bass((set) => void (set.unit.expression.inTune = 'pad')),
    act: async ({ canvasElement: c }) => {
      await press(c, C1, 0, { x: 0.05 });
    },
    check: (context) => {
      const bends = all(context, 'bend');
      expect(bends).toHaveLength(1);
      expect(bends[0].semitones as number).toBeLessThan(0);
    },
  },

  AutomaticOnAnInstrumentWithoutBend: {
    set: bass((set) => {
      set.tracks[1].devices[0].mpe = false;
      set.unit.expression.noteBend = 'auto';
    }),
    act: async ({ canvasElement: c }) => {
      const touch = await down(c, C1);
      await touch.move(1.5);
      await touch.up();
    },
    check: (context) => {
      const order = context.args.onIntent && all(context, 'note-on').length ? [...all(context, 'note-on'), ...all(context, 'note-off')] : [];
      expect(order.length).toBeGreaterThan(0);
      expect(all(context, 'bend')).toEqual([]);
      expect(all(context, 'note-on').map((i) => i.pitch)).toEqual([36, 38]);
      expect(all(context, 'note-off').map((i) => i.pitch)).toEqual([36, 38]);
      expect(all(context, 'note-on')[1].pad).toBe('pad-8-2');
    },
  },

  ForcedOff: {
    set: bass((set) => void (set.unit.expression.noteBend = 'off')),
    act: async ({ canvasElement: c }) => {
      const touch = await down(c, C1);
      await touch.move(1.5);
      await touch.up();
    },
    check: (context) => {
      expect(all(context, 'bend')).toEqual([]);
      expect(all(context, 'note-on')).toHaveLength(1);
    },
  },

  PolyAftertouch: {
    set: bass((set) => void (set.unit.expression.mode = 'poly-aftertouch')),
    act: async ({ canvasElement: c }) => {
      const touch = await down(c, C1, { ...pen, pressure: 0.4, y: 0.3 });
      await touch.move(1.2, 0.8, { pressure: 0.6 });
      await touch.up();
    },
    check: (context) => {
      expect(all(context, 'slide')).toEqual([]);
      expect(all(context, 'bend')).toEqual([]);
      expect(all(context, 'pressure')).toEqual([{ kind: 'note', action: 'pressure', pitch: 36, value: 0.6, track: 't-bass' }]);
      expect(intent(context, 'note-on').slide).toBeUndefined();
    },
  },

  MonoAftertouch: {
    set: bass((set) => void (set.unit.expression.mode = 'mono-aftertouch')),
    act: async ({ canvasElement: c }) => {
      const first = await down(c, C1, { ...pen, pressure: 0.3 });
      const second = await down(c, 'pad-8-3', { ...pen, pressure: 0.3 });
      await first.move(0.5, 0.5, { pressure: 0.8 });
      await second.move(0.5, 0.5, { pressure: 0.4 });
      await first.up();
      await second.up();
    },
    check: (context) => {
      const sent = all(context, 'pressure');
      expect(sent.map((i) => i.value)).toEqual([0.8, 0.8]);
      expect(sent.every((i) => i.pitch === undefined)).toBe(true);
    },
  },

  ARaisedThreshold: {
    set: bass((set) => void (set.unit.sensitivity.threshold = 0.9)),
    act: async ({ canvasElement: c }) => {
      await press(c, C1, 0, { ...pen, pressure: 0.2 });
    },
    check: (context) => {
      expect(all(context, 'note-on')).toEqual([]);
      expect(cell(context.canvasElement, C1)).not.toHaveAttribute('data-held');
    },
  },

  HighDrive: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await press(c, C1, 0, { ...pen, pressure: 0.5 });
      await given(c, (set) => void (set.unit.sensitivity.drive = 0.9));
      await press(c, C1, 0, { ...pen, pressure: 0.5 });
    },
    check: (context) => {
      const [plain, driven] = velocities(context);
      expect(driven).toBeGreaterThan(plain);
    },
  },

  NegativeCompand: {
    set: bass((set) => void (set.unit.sensitivity.compand = 0)),
    act: async ({ canvasElement: c }) => {
      await press(c, C1, 0, { ...pen, pressure: 0.3 });
      await press(c, C1, 0, { ...pen, pressure: 0.95 });
    },
    check: (context) => {
      for (const v of velocities(context)) {
        expect(v).toBeGreaterThan(55);
        expect(v).toBeLessThan(73);
      }
      expect(velocities(context)).toHaveLength(2);
    },
  },

  ALightPressWithAccent: {
    set: bass(),
    args: { initialState: { ...initialState(), accent: true } },
    act: async ({ canvasElement: c }) => {
      await press(c, C1, 0, { ...pen, pressure: 0.25 });
    },
    check: (context) => {
      expect(velocities(context)).toEqual([127]);
    },
  },

  AChord: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      const touches = [];
      for (const id of [C1, 'pad-8-3', 'pad-7-2']) touches.push(await down(c, id, { pointerType: 'touch', pressure: 0.31 }));
      await touches[1].move(0.5, 0.5, { pressure: 0.77 });
      for (const id of [C1, 'pad-8-3', 'pad-7-2']) cell(c, id).dataset.was = cell(c, id).hasAttribute('data-held') ? 'held' : 'up';
      for (const touch of touches) await touch.up();
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(all(context, 'note-on').map((i) => i.pitch)).toEqual([36, 40, 43]);
      expect(all(context, 'pressure')).toEqual([{ kind: 'note', action: 'pressure', pitch: 40, value: 0.77, track: 't-bass' }]);
      for (const id of [C1, 'pad-8-3', 'pad-7-2']) expect(cell(c, id).dataset.was).toBe('held');
    },
  },

  ATrackColouredPad: {
    ...userLamps({ 'pad-4-4': { state: 'lit', colour: 20 }, 'pad-4-5': { state: 'off' } }),
    act: async () => {},
    check: ({ canvasElement: c }) => {
      expect(lamp(c, 'pad-4-4')).toEqual({ state: 'lit', colour: lampVar(20) });
      // The table's colour 20 is a teal: far more green and blue than red, and far from the unlit pad beside it.
      const [r, g, b] = fillOf(face(c, 'pad-4-4'));
      expect(g).toBeGreaterThan(r * 3 + 60);
      expect(b).toBeGreaterThan(r * 3 + 60);
      const dark = fillOf(face(c, 'pad-4-5'));
      expect(g - dark[1]).toBeGreaterThan(100);
    },
  },

  ADimmedPad: {
    ...userLamps({ 'pad-4-4': { state: 'lit', colour: 20 }, 'pad-4-5': { state: 'dim', colour: 20 } }),
    act: async () => {},
    check: ({ canvasElement: c }) => {
      const full = fillOf(face(c, 'pad-4-4'));
      const dim = fillOf(face(c, 'pad-4-5'));
      // Plainly darker, and still the same teal: green and blue over red.
      expect(dim[1]).toBeLessThan(full[1] * 0.75);
      expect(dim[1]).toBeGreaterThan(dim[0] * 2);
      expect(dim[2]).toBeGreaterThan(dim[0] * 2);
    },
  },

  Holding: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      const el = cell(c, C1);
      const touch = await down(c, C1, { ...pen, pressure: 0.3 });
      el.dataset.first = `${el.hasAttribute('data-held')} ${feel(c, C1).style.getPropertyValue('--push-pressure')}`;
      await touch.move(0.5, 0.5, { pressure: 0.9 });
      el.dataset.second = `${el.hasAttribute('data-held')} ${feel(c, C1).style.getPropertyValue('--push-pressure')}`;
      await touch.up();
    },
    check: ({ canvasElement: c }) => {
      const el = cell(c, C1);
      expect(el.dataset.first).toBe('true 0.3');
      expect(el.dataset.second).toBe('true 0.9');
      expect(el).not.toHaveAttribute('data-held');
      expect(feel(c, C1).style.getPropertyValue('--push-pressure')).toBe('');
    },
  },

  TheTraceIsOn: {
    set: bass((set) => void (set.unit.expression.trace = true)),
    act: async ({ canvasElement: c }) => {
      const touch = await down(c, C1, { x: 0.5, y: 0.2 });
      await touch.move(0.9, 0.8);
      cell(c, C1).dataset.mark = `${getComputedStyle(feel(c, C1), '::after').content !== 'none'} ${feel(c, C1).style.getPropertyValue('--push-touch-x')} ${feel(c, C1).style.getPropertyValue('--push-touch-y')}`;
      await touch.up();
    },
    check: (context) => {
      const [shown, x, y] = cell(context.canvasElement, C1).dataset.mark!.split(' ');
      expect(shown).toBe('true');
      expect(Number(x)).toBeCloseTo(0.9, 1);
      expect(Number(y)).toBeCloseTo(0.8, 1);
      // What the mark shows is what was sent.
      expect(all(context, 'slide').at(-1)!.value as number).toBeCloseTo(0.8, 1);
      expect(all(context, 'bend').length).toBeGreaterThan(0);
    },
  },

  TheTraceIsOff: {
    set: bass((set) => void (set.unit.expression.trace = false)),
    act: async ({ canvasElement: c }) => {
      const touch = await down(c, C1);
      cell(c, C1).dataset.mark = `${getComputedStyle(feel(c, C1), '::after').content !== 'none'} ${cell(c, C1).hasAttribute('data-held')}`;
      await touch.up();
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, C1).dataset.mark).toBe('false true');
    },
  },

  AnExternalKeyboard: {
    set: bass(),
    act: async (context) => {
      await given(context.canvasElement, (set) => void (set.sounding = [60]));
      forget(context);
    },
    check: async ({ canvasElement: c }) => {
      // Middle C is C3, MIDI 60: every pad that plays it is green, and no other is.
      const scale = { root: 0, scale: 'Major', inKey: true, fixed: false, layout: '4ths' } as const;
      const playing = pads(c).filter((el) => padPitch(Number(el.dataset.row), Number(el.dataset.col), scale) === 60);
      expect(playing.length).toBeGreaterThan(1);
      for (const el of pads(c)) expect(el.style.getPropertyValue('--push-lamp') === 'var(--success)', el.dataset.control).toBe(playing.includes(el));
      await given(c, (set) => void (set.sounding = []));
      await wait(30);
      for (const el of playing) expect(el.style.getPropertyValue('--push-lamp')).not.toBe('var(--success)');
    },
  },
} satisfies Record<string, Play>;

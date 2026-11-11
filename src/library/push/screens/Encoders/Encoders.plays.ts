// What each push-encoders scenario does and checks. The words are in Encoders.stories.tsx.
import { initialState } from '../../model/state';
import type { PushInput, PushState } from '../../model/types';
import { all, cell, click, column, down, expect, go, holding, inputs, kinds, lampState, latch, lists, nudge, onTrack, overlay, screenText, touching, turn, waitFor } from '../play';
import type { Play } from '../scenario';

type Context = Parameters<typeof inputs>[0];
/** What a control reported, in order. */
const from = (context: Context, id: string): PushInput[] => inputs(context).filter((i) => i.control === id);
const steps = (context: Context, id: string) => from(context, id).filter((i) => i.kind === 'turn').reduce((sum, i) => sum + (i.value ?? 0), 0);
const browsing = (path: string[], highlight = 0) => ({ args: { initialState: { ...initialState(), display: 'browse' as const, browse: { path, highlight, places: {} } } } });
const withState = (more: Partial<PushState>) => ({ args: { initialState: { ...initialState(), ...more } } });
const last = (c: HTMLElement) => lists(c).at(-1)!;
const stripValue = (c: HTMLElement) => Number(cell(c, 'strip').querySelector('[role="slider"]')!.getAttribute('aria-valuenow'));

export const plays = {
  ADrag: {
    act: async ({ canvasElement: c }) => {
      // Up by one of the knob's own heights, then as far again.
      const drag = await down(c, 'encoder-2');
      await drag.move(0.5, 1.5);
      await drag.move(0.5, 2.5);
      await drag.up();
    },
    check: (context) => {
      const turned = from(context, 'encoder-2').filter((i) => i.kind === 'turn');
      expect(turned.length).toBeGreaterThanOrEqual(2);
      expect(turned.every((i) => (i.value ?? 0) > 0)).toBe(true);
      // Twice the drag is about twice the steps: the second half reports as many as the first.
      const half = Math.ceil(turned.length / 2);
      const sum = (list: PushInput[]) => list.reduce((n, i) => n + (i.value ?? 0), 0);
      expect(Math.abs(sum(turned.slice(0, half)) - sum(turned.slice(half)))).toBeLessThanOrEqual(Math.max(1, sum(turned) * 0.25));
      // Nothing else turned, and it is touched for as long as it is held.
      expect(kinds(context, 'encoder-2')[0]).toBe('touch');
      expect(kinds(context, 'encoder-2').at(-1)).toBe('release');
      expect(steps(context, 'encoder-1')).toBe(0);
    },
  },

  PastAFullTurn: {
    act: async ({ canvasElement: c }) => {
      await turn(c, 'encoder-3', 60);
    },
    check: (context) => {
      const turned = from(context, 'encoder-3').filter((i) => i.kind === 'turn');
      // No end stop: the sixtieth step is the same as the first.
      expect(turned).toHaveLength(60);
      expect(new Set(turned.map((i) => i.value))).toEqual(new Set([1]));
    },
  },

  ATouchWithoutATurn: {
    act: async ({ canvasElement: c }) => {
      await touching(c, 'encoder-5');
    },
    check: (context) => {
      expect(kinds(context, 'encoder-5')).toEqual(['touch', 'release']);
    },
  },

  HoverTouchWithAMouse: {
    act: async ({ canvasElement: c }) => {
      // The surface's hold gesture: a right-click latches the touch, another lets go.
      await latch(c, 'encoder-4');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(kinds(context, 'encoder-4')).toEqual(['touch']);
      expect(cell(c, 'encoder-4')).toHaveAttribute('data-latched');
      await turn(c, 'encoder-1', 2);
      expect(kinds(context, 'encoder-4')).toEqual(['touch']);
      await latch(c, 'encoder-4');
      expect(kinds(context, 'encoder-4')).toEqual(['touch', 'release']);
      expect(cell(c, 'encoder-4')).not.toHaveAttribute('data-latched');
    },
  },

  AFineTurn: {
    act: async ({ canvasElement: c }) => {
      await turn(c, 'encoder-1', 1);
      await holding(c, 'shift', async () => {
        await turn(c, 'encoder-1', 2);
      });
    },
    check: (context) => {
      const asked = all(context, 'set-parameter');
      expect(asked.map((i) => i.fine ?? false)).toEqual([false, true, true]);
      // A fine step moves the parameter less than a plain one.
      expect(Math.abs(Number(asked[1].delta))).toBeLessThan(Math.abs(Number(asked[0].delta)));
    },
  },

  PressingCyclesTheTarget: {
    act: async ({ canvasElement: c }) => {
      await click(c, 'volume');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(all(context, 'set-volume-target')).toEqual([{ kind: 'setting', action: 'set-volume-target', target: 'Phones' }]);
      await waitFor(() => expect(overlay(c, 'notice')!.textContent).toContain('Phones'));
    },
  },

  TouchingShowsTheTarget: {
    act: async ({ canvasElement: c }) => {
      expect(overlay(c, 'notice')).toBeNull();
      await touching(c, 'volume', async () => {
        cell(c, 'volume').dataset.shown = overlay(c, 'notice')?.textContent ?? '';
      });
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'volume').dataset.shown).toContain('Main Out');
      expect(cell(c, 'volume').dataset.shown).toContain('-6.0 dB');
      // Let go, it is gone; and a touch asks nothing.
      expect(overlay(c, 'notice')).toBeNull();
      expect(all(context, 'set-volume')).toEqual([]);
    },
  },

  AFineVolumeTurn: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await turn(c, 'volume', 1);
      });
    },
    check: (context) => {
      expect(all(context, 'set-volume')).toEqual([{ kind: 'setting', action: 'set-volume', target: 'Main Out', db: 0.1, fine: true }]);
    },
  },

  ATempoTurn: {
    act: async ({ canvasElement: c }) => {
      await turn(c, 'tempo', 3);
    },
    check: (context) => {
      const asked = all(context, 'set-tempo');
      expect(asked.reduce((sum, i) => sum + Number(i.delta), 0)).toBe(3);
      expect(asked.every((i) => !i.fine)).toBe(true);
      expect(all(context, 'set-swing')).toEqual([]);
    },
  },

  SwitchingToSwing: {
    act: async ({ canvasElement: c }) => {
      await click(c, 'tempo');
    },
    check: async (context) => {
      const c = context.canvasElement;
      await waitFor(() => expect(overlay(c, 'notice')!.textContent).toContain('Swing'));
      expect(overlay(c, 'notice')!.textContent).toMatch(/\d+ %/);
      // Now a turn is swing's.
      await turn(c, 'tempo', 1);
      expect(all(context, 'set-swing')).toHaveLength(1);
      expect(all(context, 'set-tempo')).toEqual([]);
    },
  },

  SwingStopsAtItsEnds: {
    ...withState({ tempoMode: 'swing' }),
    set: (set) => void (set.transport.swing = 100),
    act: async ({ canvasElement: c }) => {
      await turn(c, 'tempo', 3);
    },
    check: async (context) => {
      expect(all(context, 'set-swing')).toEqual([]);
      // Back down it moves again.
      await turn(context.canvasElement, 'tempo', -1);
      expect(all(context, 'set-swing')).toEqual([{ kind: 'transport', action: 'set-swing', delta: -1 }]);
    },
  },

  ANudge: {
    act: async ({ canvasElement: c }) => {
      await nudge(c, -1);
    },
    check: (context) => {
      expect(from(context, 'jog').map((i) => [i.kind, i.value])).toEqual([['nudge', -1]]);
    },
  },

  APressWhileTurned: {
    act: async ({ canvasElement: c }) => {
      await turn(c, 'jog', 2);
      await click(c, 'jog');
    },
    check: (context) => {
      const told = kinds(context, 'jog').filter((k) => k === 'turn' || k === 'down' || k === 'up');
      expect(told).toEqual(['turn', 'turn', 'down', 'up']);
      expect(steps(context, 'jog')).toBe(2);
    },
  },

  BackOutOfASubMenu: {
    ...browsing(['device', 'drums'], 2),
    act: async ({ canvasElement: c }) => {
      expect(lists(c)).toHaveLength(3);
      await nudge(c, -1);
    },
    check: ({ canvasElement: c }) => {
      expect(lists(c)).toHaveLength(2);
      // The highlight is on Drums, the menu that was open.
      expect(last(c).chosen).toBe('Drums');
      expect(last(c).enclosing).toBe(false);
    },
  },

  AContextMenu: {
    args: { initialState: { ...initialState(), display: 'sets' as const, sets: { highlight: 1, sort: 'date' as const } } },
    act: async ({ canvasElement: c }) => {
      await nudge(c, 1);
    },
    check: ({ canvasElement: c }) => {
      expect(last(c).rows).toEqual(['Delete', 'Rename']);
      expect(screenText(c)).toContain('Sketch 14');
    },
  },

  DownInAList: {
    ...browsing(['device'], 0),
    act: async ({ canvasElement: c }) => {
      cell(c, 'dpad-down').dataset.before = last(c).chosen;
      await go(c, 'down');
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'dpad-down').dataset.before).toBe(last(c).rows[0]);
      expect(last(c).chosen).toBe(last(c).rows[1]);
    },
  },

  AtTheTop: {
    ...browsing(['device'], 0),
    act: async () => {},
    check: async ({ canvasElement: c }) => {
      expect(lampState(c, 'dpad-up')).toBe('off');
      expect(lampState(c, 'dpad-down')).not.toBe('off');
      // One down, there is somewhere to go up to.
      await go(c, 'down');
      expect(lampState(c, 'dpad-up')).not.toBe('off');
    },
  },

  ASlide: {
    act: async ({ canvasElement: c }) => {
      const strip = await down(c, 'strip', { y: 0.5 });
      await strip.move(0.5, 0.75);
      await strip.move(0.5, 1);
      await strip.up();
    },
    check: (context) => {
      const told = from(context, 'strip');
      expect(told.map((i) => i.kind)).toEqual(['touch', 'move', 'move', 'release']);
      expect(told[0].value).toBeCloseTo(0.5, 1);
      expect(told[1].value).toBeCloseTo(0.75, 1);
      expect(told[2].value).toBeCloseTo(1, 1);
      expect(told[1].value!).toBeGreaterThan(told[0].value!);
    },
  },

  PitchBendSpringsBack: {
    set: onTrack('t-bass'),
    act: async ({ canvasElement: c }) => {
      const strip = await down(c, 'strip', { y: 0.5 });
      await strip.move(0.5, 0.7);
      await strip.move(0.5, 0.95);
      cell(c, 'strip').dataset.was = String(stripValue(c));
      await strip.up();
    },
    check: async (context) => {
      const c = context.canvasElement;
      const bends = all(context, 'pitch-bend').map((b) => Number(b.value));
      expect(bends.length).toBeGreaterThanOrEqual(3);
      expect(bends.at(-2)!).toBeGreaterThan(bends[0]);
      expect(bends.at(-2)!).toBeGreaterThan(0.8);
      expect(bends.at(-1)).toBe(0);
      // The lamps follow: up from the middle while held, back at the middle after.
      expect(Number(cell(c, 'strip').dataset.was)).toBeGreaterThan(0.8);
      await waitFor(() => expect(stripValue(c)).toBe(0));
    },
  },

  SwitchingToModWheel: {
    set: onTrack('t-bass'),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'select', async () => {
        const tap = await down(c, 'strip', { y: 0.5 });
        await tap.up();
      });
      const strip = await down(c, 'strip', { y: 0.7 });
      await strip.up();
    },
    check: async (context) => {
      const c = context.canvasElement;
      const wheel = all(context, 'modulation');
      expect(wheel.length).toBeGreaterThanOrEqual(1);
      expect(Number(wheel.at(-1)!.value)).toBeCloseTo(0.7, 1);
      expect(all(context, 'pitch-bend').filter((b) => Number(b.value) !== 0)).toEqual([]);
      // Let go, the value is held, drawn up from the bottom.
      await waitFor(() => expect(stripValue(c)).toBeCloseTo(0.7, 1));
    },
  },

  DrumRackPosition: {
    ...withState({ drums: { ...initialState().drums, base: { 't-drums': 52 } } }),
    act: async () => {},
    check: ({ canvasElement: c }) => {
      // Pads 52 to 67 of 128: the lit stretch starts where the bank does.
      expect(stripValue(c)).toBeCloseTo(52 / 128, 2);
      expect(lampState(c, 'strip')).toBe('lit');
    },
  },

  AnEmptyColumn: {
    set: onTrack('t-guitar'),
    act: async ({ canvasElement: c }) => {
      expect(column(c, 6)?.textContent ?? '').toBe('');
      await turn(c, 'encoder-6', 5);
    },
    check: (context) => {
      expect(all(context, 'set-parameter')).toEqual([]);
      // The turn itself was still reported.
      expect(steps(context, 'encoder-6')).toBe(5);
    },
  },

  ATouchedEncoderMarksItsColumn: {
    act: async ({ canvasElement: c }) => {
      expect(column(c, 3)).not.toHaveAttribute('data-touched');
      await touching(c, 'encoder-3', async () => {
        cell(c, 'encoder-3').dataset.marked = String(column(c, 3)!.hasAttribute('data-touched'));
        cell(c, 'encoder-3').dataset.others = String([1, 2, 4, 5, 6, 7, 8].some((n) => column(c, n)?.hasAttribute('data-touched')));
      });
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'encoder-3').dataset.marked).toBe('true');
      expect(cell(c, 'encoder-3').dataset.others).toBe('false');
      expect(column(c, 3)).not.toHaveAttribute('data-touched');
      expect(all(context, 'set-parameter')).toEqual([]);
    },
  },
} satisfies Record<string, Play>;

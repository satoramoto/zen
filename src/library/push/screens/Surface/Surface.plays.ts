// What each push-surface scenario does and checks. The words are in Surface.stories.tsx.
import { BODY, CONTROLS, REPEAT_INTERVALS, centre, control, displayArea } from '../../model/layout';
import { initialState } from '../../model/state';
import type { Lamp, PushSet } from '../../model/types';
import { actions, app, cell, display, down, expect, face, fillOf, given, inputs, key, kinds, lampState, latch, press, wait, waitFor } from '../play';
import type { Play, PlayContext } from '../scenario';

/** A device in User Mode, where the app sets every lamp: the way to hand the surface a lamp of our choosing. */
const lit = (lamps: Record<string, Lamp>, more: (set: PushSet) => void = () => {}): Pick<Play, 'set' | 'args'> => ({
  set: (set) => {
    set.unit.mode = 'control';
    set.userLamps = lamps;
    more(set);
  },
  args: { initialState: { ...initialState(), user: true } },
});

const count = (canvas: HTMLElement, selector: string) => canvas.querySelectorAll(selector).length;
const middle = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
};
const none = async () => {};
/** The ids in the order they sit, top to bottom. */
const topToBottom = (canvas: HTMLElement, ids: string[]) => [...ids].sort((a, b) => middle(cell(canvas, a)).y - middle(cell(canvas, b)).y);
const frame = (canvas: HTMLElement) => canvas.querySelector<HTMLElement>('.push-emulator__device')!;
const faceOf = (canvas: HTMLElement) => canvas.querySelector<HTMLElement>('.push-surface__face')!;
const setWidth = async (canvas: HTMLElement, px: number) => {
  frame(canvas).style.width = `${px}px`;
  await wait(60);
};
/** How bright an element's fill is. */
const light = (el: Element) => {
  const [r, g, b] = fillOf(el);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const plays = {
  TheInventoryIsComplete: {
    act: none,
    check: ({ canvasElement: c }) => {
      expect(count(c, '[data-kind="pad"]')).toBe(64);
      expect(count(c, '[data-kind="encoder"], [data-kind="wheel"]')).toBe(11);
      expect(count(c, '[data-kind="strip"]')).toBe(1);
      expect(count(c, '[data-cluster="upper"], [data-cluster="lower"]')).toBe(16);
      expect(count(c, '[data-cluster="scenes"]')).toBe(8);
      expect(count(c, '[data-cluster="dpad"]')).toBe(5);
      expect(count(c, '[data-kind="display"]')).toBe(1);
      const labelled = [...c.querySelectorAll<HTMLElement>('[data-kind="button"]')].filter((b) => !['upper', 'lower', 'scenes', 'dpad'].includes(b.dataset.cluster!));
      expect(labelled).toHaveLength(42);
      expect(count(c, '[data-control]')).toBe(CONTROLS.length);
    },
  },

  EveryControlHasAStableName: {
    act: async ({ canvasElement: c }) => {
      // Change what the display shows and what the pads do: the ids must not move.
      await press(c, 'mix');
      await press(c, 'session');
    },
    check: ({ canvasElement: c }) => {
      const ids = [...c.querySelectorAll<HTMLElement>('[data-control]')].map((el) => el.dataset.control);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toEqual(CONTROLS.map((x) => x.id));
      for (const id of ['pad-3-5', 'encoder-4', 'capture']) expect(cell(c, id)).toBeInTheDocument();
      expect(face(c, 'pad-3-5')).toHaveAccessibleName('Pad row 3 column 5');
    },
  },

  TheEightColumnsLineUp: {
    act: none,
    check: async ({ canvasElement: c }) => {
      for (const width of [1700, 1100]) {
        await setWidth(c, width);
        const screen = display(c).getBoundingClientRect();
        const third = screen.left + (screen.width / 8) * 2.5;
        const xs = ['encoder-3', 'upper-3', 'lower-3', 'pad-1-3', 'pad-8-3'].map((id) => middle(cell(c, id)).x);
        for (const x of [...xs, third]) expect(Math.abs(x - xs[0])).toBeLessThan(1.5);
      }
    },
  },

  TheClustersMatchTheFigure: {
    act: none,
    check: ({ canvasElement: c }) => {
      // The layout table is measured from the figure (model/layout.ts); here every control is where the table says, at the drawn scale.
      const body = faceOf(c).getBoundingClientRect();
      const mm = body.width / BODY.width;
      expect(body.height / mm).toBeCloseTo(BODY.height, 0);
      for (const part of CONTROLS) {
        const drawn = middle(cell(c, part.id));
        const want = centre(part);
        expect(Math.abs(drawn.x - body.left - want.x * mm), part.id).toBeLessThan(1);
        expect(Math.abs(drawn.y - body.top - want.y * mm), part.id).toBeLessThan(1);
        expect(Math.abs(drawn.w - part.w * mm), part.id).toBeLessThan(1);
      }
    },
  },

  TheLeftColumnReadsTopToBottom: {
    act: none,
    check: ({ canvasElement: c }) => {
      const ids = ['tempo', 'tap-tempo', 'metronome', 'quantize', 'fixed-length', 'automate', 'new', 'capture', 'record', 'play'];
      expect(topToBottom(c, ids)).toEqual(ids);
      expect(ids.map((id) => face(c, id).getAttribute('aria-label'))).toEqual(['Swing & Tempo', 'Tap Tempo', 'Metronome', 'Quantize', 'Fixed Length', 'Automate', 'New', 'Capture', 'Record', 'Play']);
      // The whole column is left of the touch strip.
      for (const id of ids) expect(middle(cell(c, id)).x).toBeLessThan(middle(cell(c, 'strip')).x);
    },
  },

  TheRightColumnReadsTopToBottom: {
    act: none,
    check: ({ canvasElement: c }) => {
      const rows = [['dpad-centre'], ['note', 'session'], ['scale', 'layout'], ['repeat', 'accent'], ['double-loop', 'duplicate'], ['convert', 'delete'], ['octave-up'], ['page-left', 'page-right'], ['octave-down'], ['shift', 'select']];
      const ys = rows.map((row) => middle(cell(c, row[0])).y);
      expect([...ys].sort((a, b) => a - b)).toEqual(ys);
      // Each pair shares a row, and all of it is right of the scene buttons.
      for (const row of rows) {
        if (row[1]) expect(Math.abs(middle(cell(c, row[0])).y - middle(cell(c, row[1])).y)).toBeLessThan(1);
        for (const id of row) expect(middle(cell(c, id)).x).toBeGreaterThan(middle(cell(c, 'scene-1')).x);
      }
    },
  },

  AnIconButtonIsNamed: {
    act: none,
    check: ({ canvasElement: c }) => {
      const plus = [...c.querySelectorAll('button')].filter((b) => b.textContent?.trim() === '+');
      expect(plus).toHaveLength(1);
      expect(plus[0]).toHaveAccessibleName('Add');
      expect(face(c, 'play')).toHaveAccessibleName('Play');
      expect(face(c, 'swap')).toHaveAccessibleName('Swap');
    },
  },

  TheSceneButtonsShowTheirIntervals: {
    act: none,
    check: ({ canvasElement: c }) => {
      const ids = topToBottom(c, [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `scene-${n}`));
      expect(ids.map((id) => cell(c, id).textContent?.trim())).toEqual([...REPEAT_INTERVALS]);
      expect(ids.map((id) => cell(c, id).textContent?.trim())).toEqual(['1/32t', '1/32', '1/16t', '1/16', '1/8t', '1/8', '1/4t', '1/4']);
    },
  },

  ALampFollowsTheModel: {
    ...lit({ metronome: { state: 'pulse' } }),
    act: none,
    check: async ({ canvasElement: c }) => {
      const root = c.querySelector<HTMLElement>('.push-surface')!;
      expect(lampState(c, 'metronome')).toBe('pulse');
      // It pulses: the beat's phase is being written, and it moves.
      const seen = new Set<string>();
      for (let i = 0; i < 8; i++) {
        seen.add(root.style.getPropertyValue('--push-pulse'));
        await wait(45);
      }
      expect(seen.size).toBeGreaterThan(2);
      await given(c, (set) => void (set.userLamps = { metronome: { state: 'lit' } }));
      await waitFor(() => expect(lampState(c, 'metronome')).toBe('lit'));
      await waitFor(() => expect(root.style.getPropertyValue('--push-pulse')).toBe(''));
      await given(c, (set) => void (set.userLamps = {}));
      await waitFor(() => expect(lampState(c, 'metronome')).toBe('off'));
    },
  },

  APressDoesNotLightAButtonByItself: {
    args: { host: false },
    act: async (context) => {
      const c = context.canvasElement;
      cell(c, 'mute').dataset.before = lampState(c, 'mute');
      cell(c, 'play').dataset.before = lampState(c, 'play');
      await press(c, 'mute');
      await press(c, 'play');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(kinds(context, 'mute')).toEqual(['down', 'up']);
      expect(lampState(c, 'mute')).toBe(cell(c, 'mute').dataset.before);
      // Play was asked, and refused: its lamp has not moved either.
      expect(actions(context)).toContain('play');
      expect(lampState(c, 'play')).toBe(cell(c, 'play').dataset.before);
    },
  },

  AQueuedClipBlinksOnTheBeat: {
    ...lit({ 'pad-1-1': { state: 'blink', colour: 'queue' } }, (set) => {
      set.transport.playing = true;
      set.transport.tempo = 120;
    }),
    act: none,
    check: async ({ canvasElement: c }) => {
      expect(lampState(c, 'pad-1-1')).toBe('blink');
      const root = c.querySelector<HTMLElement>('.push-surface')!;
      await waitFor(() => expect(root.style.getPropertyValue('--push-blink')).not.toBe(''));
      // At 120 BPM a beat is half a second: over two seconds the lamp goes dark four times.
      let last = root.style.getPropertyValue('--push-blink');
      let darkened = 0;
      const until = performance.now() + 2000;
      while (performance.now() < until) {
        await wait(15);
        const now = root.style.getPropertyValue('--push-blink');
        if (last === '1' && now === '0') darkened++;
        last = now;
      }
      expect(darkened).toBeGreaterThanOrEqual(3);
      expect(darkened).toBeLessThanOrEqual(5);
    },
  },

  PressAndRelease: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'play', 40);
    },
    check: (context) => {
      const reported = inputs(context).filter((i) => i.control === 'play');
      expect(reported.map((i) => i.kind)).toEqual(['down', 'up']);
      for (const i of reported) expect(typeof i.time).toBe('number');
      expect(reported[1].time).toBeGreaterThan(reported[0].time);
    },
  },

  AControlTakenAwayMidPress: {
    act: async ({ canvasElement: c }) => {
      await down(c, 'play');
      app(c).remove();
      await wait(80);
    },
    check: (context) => {
      expect(context.canvasElement.querySelector('.push-surface')).toBeNull();
      expect(kinds(context, 'play')).toEqual(['down', 'up']);
    },
  },

  TwoFingers: {
    act: async ({ canvasElement: c }) => {
      const shift = await down(c, 'shift', { pointerType: 'touch', pressure: 0.5 });
      await press(c, 'undo', 0, { pointerType: 'touch', pressure: 0.5 });
      await shift.up();
    },
    check: (context) => {
      const order = inputs(context).filter((i) => i.control === 'shift' || i.control === 'undo').map((i) => `${i.control} ${i.kind}`);
      expect(order).toEqual(['shift down', 'undo down', 'undo up', 'shift up']);
      expect(actions(context)).toEqual(['redo']);
    },
  },

  ALatchedHoldWithAMouse: {
    act: async ({ canvasElement: c }) => {
      await latch(c, 'delete');
      await press(c, 'pad-8-1');
    },
    check: async (context) => {
      const c = context.canvasElement;
      const order = () => inputs(context).filter((i) => (i.control === 'delete' || i.control === 'pad-8-1') && (i.kind === 'down' || i.kind === 'up')).map((i) => `${i.control} ${i.kind}`);
      expect(order()).toEqual(['delete down', 'pad-8-1 down', 'pad-8-1 up']);
      expect(cell(c, 'delete')).toHaveAttribute('data-latched');
      await latch(c, 'delete');
      expect(order()).toEqual(['delete down', 'pad-8-1 down', 'pad-8-1 up', 'delete up']);
      expect(cell(c, 'delete')).not.toHaveAttribute('data-latched');
    },
  },

  ArrowKeysMoveThroughTheGrid: {
    act: async ({ canvasElement: c }) => {
      face(c, 'pad-4-4').focus();
      await key(c, 'pad-4-4', 'ArrowRight');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(document.activeElement).toBe(face(c, 'pad-4-5'));
      expect(inputs(context).filter((i) => i.control.startsWith('pad-'))).toEqual([]);
      await key(c, 'pad-4-5', 'ArrowDown');
      expect(document.activeElement).toBe(face(c, 'pad-5-5'));
    },
  },

  ARotaryControlTurns: {
    act: async ({ canvasElement: c }) => {
      face(c, 'encoder-1').focus();
      await key(c, 'encoder-1', 'ArrowUp');
    },
    check: (context) => {
      const turns = inputs(context).filter((i) => i.control === 'encoder-1' && i.kind === 'turn');
      expect(turns).toHaveLength(1);
      expect(turns[0].value).toBe(1);
    },
  },

  ANarrowFrame: {
    act: async ({ canvasElement: c }) => {
      await setWidth(c, 1800);
      for (const id of ['pad-3-5', 'play', 'encoder-4', 'shift']) cell(c, id).dataset.before = JSON.stringify(middle(cell(c, id)));
      faceOf(c).dataset.before = JSON.stringify(faceOf(c).getBoundingClientRect());
      await setWidth(c, 900);
    },
    check: ({ canvasElement: c }) => {
      const was = JSON.parse(faceOf(c).dataset.before!) as DOMRect;
      const now = faceOf(c).getBoundingClientRect();
      expect(now.width / was.width).toBeCloseTo(0.5, 2);
      for (const id of ['pad-3-5', 'play', 'encoder-4', 'shift']) {
        const before = JSON.parse(cell(c, id).dataset.before!) as ReturnType<typeof middle>;
        const after = middle(cell(c, id));
        expect(after.w / before.w).toBeCloseTo(0.5, 1);
        expect((after.x - now.left) / now.width).toBeCloseTo((before.x - was.left) / was.width, 2);
        expect((after.y - now.top) / now.height).toBeCloseTo((before.y - was.top) / was.height, 2);
      }
      // The display is the same share of the face, and its smallest type is still a readable size.
      expect(display(c).getBoundingClientRect().width / now.width).toBeCloseTo(232 / BODY.width, 2);
      // Its label size is 12 of its 960 pixels.
      expect((display(c).getBoundingClientRect().width / 960) * 12).toBeGreaterThanOrEqual(6);
      void displayArea;
      void control;
    },
  },

  BelowTheSmallestSize: {
    act: async ({ canvasElement: c }) => {
      await setWidth(c, 2000);
      await setWidth(c, 360);
    },
    check: async ({ canvasElement: c }) => {
      const root = c.querySelector<HTMLElement>('.push-surface')!;
      const body = faceOf(c).getBoundingClientRect();
      expect(body.width).toBeGreaterThan(root.clientWidth);
      expect(root.scrollWidth).toBeGreaterThan(root.clientWidth);
      // A pad is still a comfortable target.
      expect(middle(cell(c, 'pad-1-1')).h).toBeGreaterThanOrEqual(24);
      // And it is the same smallest size however much narrower the frame gets.
      await setWidth(c, 200);
      expect(faceOf(c).getBoundingClientRect().width).toBeCloseTo(body.width, 0);
    },
  },

  TheDisplayRegionAlone: {
    args: { region: 'display' },
    act: async ({ canvasElement: c }) => {
      await press(c, 'upper-1');
      await key(c, 'encoder-2', 'ArrowUp');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(count(c, '[data-kind="encoder"]')).toBe(8);
      expect(count(c, '[data-cluster="upper"]')).toBe(8);
      expect(count(c, '[data-cluster="lower"]')).toBe(8);
      expect(count(c, '[data-kind="display"]')).toBe(1);
      expect(count(c, '[data-control]')).toBe(25);
      expect(kinds(context, 'upper-1')).toEqual(['down', 'up']);
      expect(kinds(context, 'encoder-2')).toEqual(['touch', 'turn', 'release']);
      // Still in line, each column under its encoder.
      expect(Math.abs(middle(cell(c, 'encoder-5')).x - middle(cell(c, 'lower-5')).x)).toBeLessThan(1.5);
    },
  },

  APedalIsPluggedIn: {
    args: { part: 'rear' },
    set: (set) => void (set.unit.jacks['Pedal 1'] = { plugged: 'footswitch', job: 'Record / New' }),
    act: none,
    check: ({ canvasElement: c }) => {
      const port = c.querySelector<HTMLElement>('[data-port="Pedal 1"]')!;
      expect(port).toHaveAttribute('data-plugged', 'footswitch');
      expect(port).toHaveAccessibleName('Pedal 1: a footswitch connected');
      expect(c.querySelector('[data-port="Pedal 2"]')).toHaveAttribute('data-plugged', 'none');
      expect(c.querySelectorAll('[data-port]')).toHaveLength(14);
    },
  },

  ThePowerButton: {
    args: { part: 'rear' },
    act: async ({ canvasElement: c }) => {
      await press(c, 'power', 3000);
    },
    check: (context) => {
      const reported = inputs(context).filter((i) => i.control === 'power');
      expect(reported.map((i) => i.kind)).toEqual(['down', 'up']);
      const held = reported[1].time - reported[0].time;
      expect(held).toBeGreaterThanOrEqual(2990);
      expect(held).toBeLessThan(3400);
    },
  },

  Off: {
    set: (set) => void (set.unit.power = 'off'),
    act: async ({ canvasElement: c }) => {
      await press(c, 'play');
    },
    check: (context) => {
      const c = context.canvasElement;
      const lit = [...c.querySelectorAll<HTMLElement>('[data-lamp]')].filter((el) => el.dataset.lamp !== 'off');
      expect(lit).toEqual([]);
      expect(display(c)).toHaveAttribute('data-kind', 'blank');
      expect(display(c).textContent).toBe('');
      // A press is still reported, and the device asks nothing.
      expect(kinds(context, 'play')).toEqual(['down', 'up']);
      expect(actions(context)).toEqual([]);
    },
  },

  LEDsAtHalf: {
    ...lit({ 'pad-1-1': { state: 'lit', colour: 20 }, 'upper-1': { state: 'lit', colour: 20 } }),
    act: async ({ canvasElement: c }) => {
      for (const id of ['pad-1-1', 'upper-1']) cell(c, id).dataset.before = String(light(face(c, id)));
      display(c).dataset.before = getComputedStyle(display(c).firstElementChild!).opacity;
      await given(c, (set) => void (set.unit.ledBrightness = 50));
      await wait(150);
    },
    check: ({ canvasElement: c }) => {
      expect(c.querySelector<HTMLElement>('.push-surface')!.style.getPropertyValue('--push-led')).toBe('0.5');
      for (const id of ['pad-1-1', 'upper-1']) expect(light(face(c, id))).toBeLessThan(Number(cell(c, id).dataset.before) * 0.85);
      expect(getComputedStyle(display(c).firstElementChild!).opacity).toBe(display(c).dataset.before);
    },
  },
} satisfies Record<string, Play>;

export type { PlayContext };

// What each push-recording scenario does and checks. The words are in Recording.stories.tsx.
import { initialState } from '../../model/state';
import type { PushSet, PushState } from '../../model/types';
import { actions, all, asked, cell, column, down, expect, forget, given, hit, holdDown, holding, intent, lamp, lampState, onTrack, press, RED, rowTexts, screenKind, tab, turn, wait, waitFor, HOLD } from '../play';
import type { Play } from '../scenario';

const start = (more: Partial<PushState>) => ({ args: { initialState: { ...initialState(), ...more } } });
const bass = (more: (set: PushSet) => void = () => {}) => onTrack('t-bass', more);
const repeating = (track: string, interval = 3) => start({ repeats: { [track]: { on: true, interval } } });
const pen = { pointerType: 'pen' } as const;

export const plays = {
  Stopping: {
    set: (set) => void (set.transport.playing = true),
    act: async ({ canvasElement: c }) => {
      cell(c, 'play').dataset.before = `${lampState(c, 'play')} ${lamp(c, 'play').colour}`;
      await press(c, 'play');
    },
    check: (context) => {
      expect(cell(context.canvasElement, 'play').dataset.before).toBe('lit var(--success)');
      expect(actions(context)).toEqual(['stop']);
    },
  },

  ThreePresses: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      for (let i = 0; i < 3; i++) {
        await press(c, 'record');
        await wait(40);
      }
    },
    check: (context) => {
      const three = asked(context).filter((i) => i.action === 'record' || i.action === 'overdub');
      expect(three).toEqual([
        { kind: 'transport', action: 'record', on: true, track: 't-bass', scene: 1 },
        { kind: 'transport', action: 'record', on: false, track: 't-bass' },
        { kind: 'transport', action: 'overdub', on: true, track: 't-bass' },
      ]);
    },
  },

  CountIn: {
    set: bass((set) => void (set.transport.countingIn = 0.25)),
    act: async ({ canvasElement: c }) => {
      cell(c, 'record').dataset.counting = `${lampState(c, 'record')} ${lamp(c, 'record').colour}`;
      await given(c, (set) => {
        delete set.transport.countingIn;
        set.transport.recording = 'session';
      });
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'record').dataset.counting).toBe(`blink ${RED}`);
      expect(lamp(c, 'record')).toEqual({ state: 'lit', colour: RED });
    },
  },

  SelectingAMIDITrackInNoteMode: {
    act: async ({ canvasElement: c }) => {
      cell(c, 'lower-2').dataset.before = String(!!tab(c, 'bottom', 2).querySelector('[data-part="armed"]'));
      await press(c, 'lower-2');
      await wait(60);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'lower-2').dataset.before).toBe('false');
      expect(tab(c, 'bottom', 2).querySelector('[data-part="armed"]')).toHaveAccessibleName('armed');
      // It was not armed by hand, and the track it left is no longer shown armed.
      expect(all(context, 'arm')).toEqual([]);
      expect(tab(c, 'bottom', 1).querySelector('[data-part="armed"]')).toBeNull();
    },
  },

  RecordingAGuitar: {
    set: onTrack('t-guitar', (set) => {
      set.tracks[5].armed = true;
      set.transport.playing = true;
    }),
    act: async ({ canvasElement: c }) => {
      await press(c, 'record');
      await wait(40);
      await press(c, 'record');
    },
    check: (context) => {
      expect(all(context, 'record')).toEqual([
        { kind: 'transport', action: 'record', on: true, track: 't-guitar', scene: 1, from: 'next-beat' },
        { kind: 'transport', action: 'record', on: false, track: 't-guitar' },
      ]);
    },
  },

  ArrangementFromSession: {
    set: (set) => {
      set.unit.mode = 'control';
      set.transport.view = 'session';
    },
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await press(c, 'record');
      });
    },
    check: (context) => {
      expect(all(context, 'record-arrangement')).toEqual([{ kind: 'transport', action: 'record-arrangement', on: true }]);
      expect(all(context, 'record')).toEqual([]);
    },
  },

  AFreshSlot: {
    set: bass((set) => {
      set.unit.preferences.Workflow.value = 'Clip';
      set.tracks[1].clips[0]!.state = 'playing';
      set.tracks[1].playing = 0;
      set.transport.playing = true;
    }),
    act: async ({ canvasElement: c }) => {
      await press(c, 'new');
    },
    check: (context) => {
      expect(all(context, 'new-clip')).toEqual([{ kind: 'edit', action: 'new-clip', track: 't-bass', stop: 0 }]);
    },
  },

  FourBars: {
    act: async ({ canvasElement: c }) => {
      await holdDown(c, 'fixed-length', async () => {
        cell(c, 'fixed-length').dataset.menu = rowTexts(c, 'top').join('|');
        await press(c, 'upper-5');
      }, HOLD);
    },
    check: (context) => {
      expect(cell(context.canvasElement, 'fixed-length').dataset.menu).toBe('1 Beat|2 Beats|1 Bar|2 Bars|4 Bars|8 Bars|16 Bars|32 Bars');
      expect(all(context, 'set-fixed-length')).toEqual([{ kind: 'transport', action: 'set-fixed-length', bars: '4 Bars' }]);
      // It was held, not pressed: Fixed Length itself was not switched.
      expect(all(context, 'fixed-length')).toEqual([]);
    },
  },

  PhraseSync: {
    act: async ({ canvasElement: c }) => {
      await holdDown(c, 'fixed-length', async () => {
        cell(c, 'fixed-length').dataset.menu = rowTexts(c, 'bottom')[0];
        await press(c, 'lower-1');
      }, HOLD);
      await press(c, 'fixed-length');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'fixed-length').dataset.menu).toBe('Phrase Sync');
      expect(all(context, 'set-fixed-length')).toEqual([{ kind: 'transport', action: 'set-fixed-length', phrase: true }]);
      // A quick press switches Fixed Length itself, and its lamp lights.
      expect(all(context, 'fixed-length')).toEqual([{ kind: 'transport', action: 'fixed-length', on: true }]);
      await waitFor(() => expect(lampState(c, 'fixed-length')).toBe('lit'));
    },
  },

  Latched: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      cell(c, 'repeat').dataset.before = lampState(c, 'repeat');
      await press(c, 'repeat', 40);
      await wait(HOLD);
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'repeat').dataset.before).toBe('dim');
      expect(lampState(c, 'repeat')).toBe('pulse');
      // The scene buttons are now the intervals: sixteenths, the default, is the green one.
      expect(lamp(c, 'scene-4')).toEqual({ state: 'lit', colour: 'var(--success)' });
    },
  },

  Momentary: {
    set: bass(),
    act: async (context) => {
      const c = context.canvasElement;
      const repeat = await down(c, 'repeat');
      await wait(HOLD);
      const pad = await down(c, 'pad-8-1');
      await wait(330);
      await repeat.up();
      cell(c, 'repeat').dataset.during = String(all(context, 'note-on').filter((i) => i.repeat).length);
      await wait(330);
      cell(c, 'repeat').dataset.after = String(all(context, 'note-on').filter((i) => i.repeat).length);
      await pad.up();
    },
    check: ({ canvasElement: c }) => {
      const { during, after } = cell(c, 'repeat').dataset;
      expect(Number(during)).toBeGreaterThanOrEqual(2);
      // No more once Repeat is let go, though the pad is still down.
      expect(after).toBe(during);
      expect(lampState(c, 'repeat')).toBe('dim');
    },
  },

  SixteenthHats: {
    ...repeating('t-drums'),
    set: (set) => void (set.transport.tempo = 120),
    act: async ({ canvasElement: c }) => {
      // One beat at 120 BPM is half a second, a sixteenth an eighth of one: the first note and three more, then let go before the fifth.
      await hit(c, 7, 3, 410);
    },
    check: (context) => {
      const notes = all(context, 'note-on');
      expect(notes.map((i) => i.pitch)).toEqual([42, 42, 42, 42]);
      expect(notes.slice(1).every((i) => i.repeat)).toBe(true);
      expect(all(context, 'note-off')).toHaveLength(4);
    },
  },

  PressingHarder: {
    ...repeating('t-bass', 1),
    set: bass((set) => void (set.transport.tempo = 120)),
    act: async ({ canvasElement: c }) => {
      const pad = await down(c, 'pad-8-1', { ...pen, pressure: 0.3 });
      await wait(160);
      await pad.move(0.5, 0.5, { pressure: 0.95 });
      await wait(160);
      await pad.up();
    },
    check: (context) => {
      const repeated = all(context, 'note-on').filter((i) => i.repeat).map((i) => i.velocity as number);
      expect(repeated.length).toBeGreaterThanOrEqual(3);
      expect(repeated.at(-1)!).toBeGreaterThan(repeated[0] + 40);
      expect(repeated.at(-1)).toBe(121);
    },
  },

  MomentaryAccent: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await holdDown(c, 'accent', async () => {
        cell(c, 'accent').dataset.during = lampState(c, 'accent');
        await press(c, 'pad-8-1', 0, { ...pen, pressure: 0.25 });
      }, HOLD);
      await press(c, 'pad-8-1', 0, { ...pen, pressure: 0.25 });
    },
    check: (context) => {
      const c = context.canvasElement;
      const [accented, plain] = all(context, 'note-on').map((i) => i.velocity as number);
      expect(accented).toBe(127);
      expect(plain).toBeLessThan(80);
      expect(cell(c, 'accent').dataset.during).toBe('lit');
      expect(lampState(c, 'accent')).toBe('dim');
    },
  },

  CapturingAnIdea: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await hit(c, 8, 1);
      await hit(c, 8, 3);
      cell(c, 'capture').dataset.armed = lampState(c, 'capture');
      await press(c, 'capture');
      // With nothing armed (Session Pad Mode arms nothing by itself) Capture is unlit.
      await press(c, 'session');
      cell(c, 'capture').dataset.unarmed = lampState(c, 'capture');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(all(context, 'capture')).toEqual([{ kind: 'transport', action: 'capture' }]);
      expect(all(context, 'record')).toEqual([]);
      expect(cell(c, 'capture').dataset.armed).not.toBe('off');
      expect(cell(c, 'capture').dataset.unarmed).toBe('off');
    },
  },

  RecordQuantization: {
    act: async ({ canvasElement: c }) => {
      await holdDown(c, 'quantize', async () => {
        cell(c, 'quantize').dataset.menu = `${rowTexts(c, 'top')[0]}|${[1, 2, 3].map((n) => column(c, n)?.textContent).join('|')}`;
        await press(c, 'upper-1');
      }, HOLD);
    },
    check: (context) => {
      const menu = cell(context.canvasElement, 'quantize').dataset.menu!;
      for (const word of ['Rec. Quantize', 'Swing Amount', 'Quantize To', 'Quantize Amount']) expect(menu).toContain(word);
      expect(all(context, 'set-quantize')).toEqual([{ kind: 'edit', action: 'set-quantize', record: '1/16' }]);
      // Quantize was held: nothing was quantized.
      expect(all(context, 'quantize')).toEqual([]);
    },
  },

  HalfStrength: {
    act: async ({ canvasElement: c }) => {
      await holdDown(c, 'quantize', async () => {
        await turn(c, 'encoder-3', -50);
      }, HOLD);
    },
    check: (context) => {
      expect(all(context, 'set-quantize').at(-1)).toEqual({ kind: 'edit', action: 'set-quantize', amount: 0.5 });
      // Let go, the menu has closed.
      expect(screenKind(context.canvasElement)).not.toBe('quantize');
    },
  },

  ATwoBarCountIn: {
    act: async ({ canvasElement: c }) => {
      await holdDown(c, 'metronome', async () => {
        cell(c, 'metronome').dataset.menu = [1, 2, 3, 4, 5].map((n) => column(c, n)?.textContent).join('|');
        await turn(c, 'encoder-1', 4);
      }, HOLD);
    },
    check: (context) => {
      const menu = cell(context.canvasElement, 'metronome').dataset.menu!;
      for (const word of ['Count-In', 'Sound', 'Classic', 'Rhythm', 'Numerator', 'Denominator']) expect(menu).toContain(word);
      expect(all(context, 'set-count-in')).toEqual([{ kind: 'transport', action: 'set-count-in', value: '2 bars' }]);
      expect(all(context, 'metronome')).toEqual([]);
    },
  },

  SevenEight: {
    act: async ({ canvasElement: c }) => {
      await holdDown(c, 'metronome', async () => {
        await turn(c, 'encoder-4', 12);
        await turn(c, 'encoder-5', 4);
      }, HOLD);
    },
    check: (context) => {
      expect(all(context, 'set-signature').at(-1)).toEqual({ kind: 'transport', action: 'set-signature', numerator: 7, denominator: 8 });
    },
  },

  LinkOn: {
    set: (set) => void (set.transport.link = { on: true, peers: 1 }),
    act: async ({ canvasElement: c }) => {
      await holdDown(c, 'metronome', async () => {
        cell(c, 'metronome').dataset.greyed = String(column(c, 1)?.getAttribute('data-disabled'));
        await turn(c, 'encoder-1', 8);
      }, HOLD);
    },
    check: (context) => {
      expect(cell(context.canvasElement, 'metronome').dataset.greyed).toBe('true');
      expect(all(context, 'set-count-in')).toEqual([]);
    },
  },

  FourTaps: {
    act: async ({ canvasElement: c }) => {
      for (let i = 0; i < 4; i++) {
        const at = performance.now();
        await press(c, 'tap-tempo');
        await wait(Math.max(0, 500 - (performance.now() - at)));
      }
    },
    check: (context) => {
      expect(all(context, 'tap-tempo')).toHaveLength(4);
      for (const tap of all(context, 'tap-tempo')) expect(typeof tap.time).toBe('number');
      const tempo = all(context, 'set-tempo').at(-1)!.value as number;
      expect(Math.abs(tempo - 120)).toBeLessThan(4);
      // Four taps are a bar of 4/4: the stopped Set is started.
      expect(all(context, 'play')).toHaveLength(1);
    },
  },

  ReEnabling: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await press(c, 'automate');
      });
      await press(c, 'automate');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(all(context, 're-enable-automation')).toEqual([{ kind: 'transport', action: 're-enable-automation' }]);
      // Alone, Automate arms automation recording, and its lamp turns red.
      expect(all(context, 'automation-arm')).toEqual([{ kind: 'transport', action: 'automation-arm', on: true }]);
      await waitFor(() => expect(lamp(c, 'automate')).toEqual({ state: 'lit', colour: RED }));
    },
  },

  RecordingASweep: {
    set: bass((set) => {
      set.transport.automationArm = true;
      set.transport.recording = 'session';
      set.transport.playing = true;
    }),
    ...start({ device: { ...initialState().device, banks: { 'd-bass': 1 } } }),
    act: async (context) => {
      const c = context.canvasElement;
      forget(context);
      const touch = await down(c, 'encoder-2');
      await turn(c, 'encoder-2', 3);
      await touch.up();
    },
    check: (context) => {
      const sweep = asked(context).filter((i) => i.parameter === 'd-bass.cutoff');
      expect(sweep.map((i) => i.action)).toEqual(['touch-parameter', 'set-parameter', 'set-parameter', 'set-parameter', 'release-parameter']);
      for (const i of sweep.slice(1, 4)) expect(i.automation).toBe(true);
    },
  },

  Undo: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'undo');
    },
    check: (context) => {
      expect(actions(context)).toEqual(['undo']);
    },
  },

  DeletingTheClip: {
    set: bass(),
    act: async ({ canvasElement: c }) => {
      await press(c, 'delete');
    },
    check: (context) => {
      expect(actions(context)).toEqual(['delete-clip']);
      expect(intent(context, 'delete-clip')).toEqual({ kind: 'edit', action: 'delete-clip', track: 't-bass', scene: 0 });
    },
  },

  SceneWorkflow: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'duplicate');
    },
    check: (context) => {
      expect(actions(context)).toEqual(['duplicate-scene']);
      expect(intent(context, 'duplicate-scene')).toEqual({ kind: 'edit', action: 'duplicate-scene', playing: true });
    },
  },
} satisfies Record<string, Play>;

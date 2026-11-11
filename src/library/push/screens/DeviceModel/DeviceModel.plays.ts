// What each push-device-model scenario does and checks. The words are in DeviceModel.stories.tsx.
// Where a scenario is about the model as data (JSON, purity, a scripted run), the play asks the
// model itself, beside the device on the page.
import { combinations } from '../../model/combos';
import { CONTROLS } from '../../model/layout';
import { project } from '../../model/project';
import { input, press as script, run, turn as scriptTurn } from '../../model/run';
import { sampleSet } from '../../model/sample';
import { initialState } from '../../model/state';
import { step } from '../../model/step';
import { DOUBLE_MS } from '../../model/timing';
import type { PushIntent, PushSet, PushState } from '../../model/types';
import { actions, all, app, asked, cell, display, expect, forget, given, hit, holdDown, holding, HOLD, kinds, lamp, lampState, onTrack, overlay, paramText, pedal, pedalTwice, press, RED, report, rowTexts, screenKind, screenText, tab, turn, wait, waitFor } from '../play';
import type { Play, PlayContext } from '../scenario';

const none = async () => {};
const withState = (more: Partial<PushState>) => ({ args: { initialState: { ...initialState(), ...more } } });
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
/** The states the device has reported, oldest first. */
const states = (context: PlayContext): PushState[] => (context.args.onState as unknown as { mock: { calls: [PushState][] } }).mock.calls.map((c) => c[0]);
/** Everything the device draws: each control's lamp, and the display. */
const drawn = (c: HTMLElement) => JSON.stringify([CONTROLS.map((x) => [x.id, lamp(c, x.id)]), display(c).innerHTML]);
const keep = (c: HTMLElement, name: string, value: string) => void ((c as unknown as Record<string, string>)[`kept-${name}`] = value);
const kept = (c: HTMLElement, name: string) => (c as unknown as Record<string, string>)[`kept-${name}`];
const padsOf = (c: HTMLElement) => c.querySelector<HTMLElement>('.push-device')!.dataset.pads;
const control = (set: PushSet) => void (set.unit.mode = 'control');

export const plays = {
  TheSetSurvivesJSON: {
    act: async ({ canvasElement: c }) => {
      keep(c, 'before', drawn(c));
      // The app's Set goes to text and back, and is given to the device again.
      const text = JSON.stringify(app(c).getSet());
      await given(c, (set) => void Object.assign(set, JSON.parse(text)));
    },
    check: ({ canvasElement: c }) => {
      expect(drawn(c)).toBe(kept(c, 'before'));
      expect(copy(sampleSet())).toEqual(sampleSet());
      expect(project(initialState(), copy(sampleSet()))).toEqual(project(initialState(), sampleSet()));
    },
  },

  TheDeviceDoesNotEditTheSet: {
    args: { host: false },
    act: async ({ canvasElement: c }) => {
      keep(c, 'before', paramText(c, 1));
      keep(c, 'set', JSON.stringify(app(c).getSet()));
      await turn(c, 'encoder-1', 3);
    },
    check: (context) => {
      const c = context.canvasElement;
      // It asked, and waits for the app.
      expect(all(context, 'set-parameter')).toHaveLength(3);
      expect(paramText(c, 1)).toBe(kept(c, 'before'));
      expect(JSON.stringify(app(c).getSet())).toBe(kept(c, 'set'));
    },
  },

  StateSurvivesJSON: {
    set: onTrack('t-bass'),
    act: async ({ canvasElement: c }) => {
      await press(c, 'mix');
      await press(c, 'octave-up');
      await press(c, 'session');
      await press(c, 'lower-3');
      await wait(60);
    },
    check: (context) => {
      const c = context.canvasElement;
      const state = states(context).at(-1)!;
      const set = app(c).getSet();
      expect(state.display).toBe('mix');
      expect(state.pads).toBe('session');
      const restored = copy(state);
      expect(restored).toEqual(state);
      const before = project(state, set);
      expect(project(restored, set)).toEqual(before);
      // And that projection is what is on the page.
      expect(screenKind(c)).toBe(before.screen.kind);
      for (const x of CONTROLS) if (lampState(c, x.id) !== 'none') expect([x.id, lampState(c, x.id)]).toEqual([x.id, before.lamps[x.id].state]);
    },
  },

  TwoDevicesOnOneSet: {
    act: none,
    check: ({ canvasElement: c }) => {
      const set = app(c).getSet();
      const whole = JSON.stringify(set);
      const one = project(initialState(), set);
      const other = project({ ...initialState(), display: 'mix', pads: 'session' }, set);
      expect(one.screen.kind).toBe('device');
      expect(other.screen.kind).toBe('mix-global');
      expect(one.lamps.mix.state).not.toBe(other.lamps.mix.state);
      expect(one.lamps['pad-1-1']).not.toEqual(other.lamps['pad-1-1']);
      // Neither wrote to the Set they share; the one on the page is the first.
      expect(JSON.stringify(set)).toBe(whole);
      expect(screenKind(c)).toBe('device');
    },
  },

  TheSameInputTwice: {
    act: none,
    check: () => {
      const state = { ...initialState(), pads: 'session' as const };
      const set = sampleSet();
      const before = [JSON.stringify(state), JSON.stringify(set)];
      for (const given of [input('pad-1-1', 'down', 1000, { velocity: 90 }), input('encoder-1', 'turn', 1000, { value: 3 }), input('mix', 'down', 1000)]) {
        const first = step(state, set, given);
        const second = step(state, set, given);
        expect(second).toEqual(first);
        expect(first.state).not.toBe(state);
      }
      // Neither argument was written to.
      expect([JSON.stringify(state), JSON.stringify(set)]).toEqual(before);
    },
  },

  TimeComesWithTheInput: {
    act: none,
    check: () => {
      // The second track's button, twice. A quick second press arms the track; a slow one does not.
      const twice = (gap: number) => run(sampleSet(), [...script('lower-2', 5000, 40), ...script('lower-2', 5000 + gap, 40)]).flatMap((s) => s.intents.map((i) => i.action));
      const quick = twice(DOUBLE_MS - 100);
      const slow = twice(DOUBLE_MS + 400);
      expect(quick.some((a) => /arm/.test(a))).toBe(true);
      expect(slow.some((a) => /arm/.test(a))).toBe(false);
      // No clock was read: the same times give the same answer whenever it is asked.
      expect(twice(DOUBLE_MS - 100)).toEqual(quick);
    },
  },

  ProjectionWithoutInput: {
    act: none,
    check: ({ canvasElement: c }) => {
      const shown = project(initialState(), sampleSet());
      for (const x of CONTROLS) expect(shown.lamps[x.id], x.id).toMatchObject({ state: expect.any(String) });
      expect(shown.screen.kind).toBe('device');
      expect(shown.screen.top).toHaveLength(8);
      expect(shown.screen.bottom).toHaveLength(8);
      expect(shown.screen.body.length).toBeGreaterThan(0);
      expect(Array.isArray(shown.screen.overlays)).toBe(true);
      // The page, before anything is pressed, is that projection.
      expect(screenKind(c)).toBe(shown.screen.kind);
      expect(rowTexts(c, 'bottom').map((t) => t.replace(/^\P{L}+/u, ''))).toEqual(shown.screen.bottom.map((b) => b?.label ?? ''));
    },
  },

  LaunchingAClip: {
    ...withState({ pads: 'session' }),
    act: async ({ canvasElement: c }) => {
      await hit(c, 1, 1);
    },
    check: (context) => {
      expect(asked(context)).toEqual([{ kind: 'transport', action: 'launch-clip', track: 't-drums', scene: 0 }]);
    },
  },

  AnAppSortsByKind: {
    act: async ({ canvasElement: c }) => {
      await turn(c, 'encoder-1', 1);
      await press(c, 'lower-2');
    },
    check: (context) => {
      const sorted = Object.fromEntries(asked(context).map((i: PushIntent) => [i.action, i.kind]));
      expect(sorted).toMatchObject({ 'set-parameter': 'edit', 'select-track': 'navigate' });
      // Every intent says which of the kinds it is.
      for (const i of asked(context)) expect(['edit', 'navigate', 'transport', 'play', 'setting']).toContain(i.kind);
    },
  },

  ARefusedMute: {
    args: { host: false },
    act: async ({ canvasElement: c }) => {
      keep(c, 'before', drawn(c));
      await press(c, 'mute');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(actions(context).filter((a) => /mute/.test(a))).toHaveLength(1);
      expect(app(c).getSet().tracks[0].muted).toBeFalsy();
      expect(tab(c, 'bottom', 1)).not.toHaveAttribute('data-dim');
      expect(drawn(c)).toBe(kept(c, 'before'));
    },
  },

  AQuickPressOfQuantize: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'quantize');
    },
    check: (context) => {
      expect(all(context, 'quantize')).toEqual([{ kind: 'edit', action: 'quantize', track: 't-drums', scene: 0 }]);
      expect(all(context, 'set-quantize')).toEqual([]);
    },
  },

  HoldingQuantize: {
    act: async ({ canvasElement: c }) => {
      keep(c, 'before', screenKind(c) ?? '');
      await holdDown(
        c,
        'quantize',
        async () => {
          keep(c, 'held', screenText(c));
        },
        HOLD,
      );
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(kept(c, 'held')).toContain('Swing');
      expect(kept(c, 'held')).toContain('Quantize To');
      expect(all(context, 'quantize')).toEqual([]);
      // Let go, the screen it covered is back.
      expect(screenKind(c)).toBe(kept(c, 'before'));
    },
  },

  DeleteAndAPad: {
    act: async ({ canvasElement: c }) => {
      // The kick, bottom left of the drum pads: the clip holds notes for it.
      await holding(c, 'delete', async () => {
        await hit(c, 8, 1);
      });
    },
    check: (context) => {
      expect(all(context, 'delete-notes')).toEqual([{ kind: 'edit', action: 'delete-notes', track: 't-drums', scene: 0, pitch: 36 }]);
      expect(actions(context).filter((a) => a === 'delete-clip' || a === 'delete')).toEqual([]);
      // Held with a pad, the pad made no sound either.
      expect(all(context, 'note-on')).toEqual([]);
    },
  },

  ShiftAndUndo: {
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        await press(c, 'undo');
      });
    },
    check: (context) => {
      expect(actions(context)).toEqual(['redo']);
    },
  },

  TheCombinationsAreListed: {
    act: none,
    check: () => {
      const list = combinations();
      expect(list.length).toBeGreaterThan(20);
      for (const combo of list) {
        expect(combo.hold.length, combo.id).toBeGreaterThan(0);
        expect(typeof combo.press, combo.id).toBe('string');
        expect(combo.asks.length, combo.id).toBeGreaterThan(0);
        expect(['down', 'up', 'turn', 'touch']).toContain(combo.kind);
      }
      expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
      expect(list.find((x) => x.hold.includes('shift') && x.press === 'undo')).toMatchObject({ asks: expect.stringMatching(/redo/i) });
      // Some apply in one mode only, and say which.
      expect(list.some((x) => typeof x.mode === 'string' && x.mode.length > 0)).toBe(true);
      // It is data: it can be written down.
      expect(copy(list)).toEqual(list);
    },
  },

  AMomentaryVisitToSession: {
    set: onTrack('t-bass'),
    act: async ({ canvasElement: c }) => {
      keep(c, 'before', padsOf(c) ?? '');
      // Held past the hold time, Session is a visit: the pads launch clips until it is let go.
      await holdDown(
        c,
        'session',
        async () => {
          await hit(c, 1, 1);
        },
        HOLD,
      );
      await hit(c, 8, 1);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(kept(c, 'before')).toBe('note');
      expect(all(context, 'launch-clip')).toEqual([{ kind: 'transport', action: 'launch-clip', track: 't-drums', scene: 0 }]);
      // Back in Note Mode: the next pad is a note, and Note is the lit one.
      expect(padsOf(c)).toBe('note');
      expect(all(context, 'note-on')).toHaveLength(1);
      expect(lampState(c, 'note')).toBe('lit');
      expect(lampState(c, 'session')).not.toBe('lit');
    },
  },

  DeviceViewWhileLaunchingClips: {
    ...withState({ pads: 'session', display: 'mix' }),
    act: async ({ canvasElement: c }) => {
      await press(c, 'device');
      await hit(c, 1, 2);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(screenKind(c)).toBe('device');
      expect(padsOf(c)).toBe('session');
      expect(all(context, 'launch-clip')).toEqual([{ kind: 'transport', action: 'launch-clip', track: 't-bass', scene: 0 }]);
    },
  },

  InMix: {
    ...withState({ display: 'mix' }),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(screenKind(c)).toBe('mix-global');
      expect(lampState(c, 'mix')).toBe('lit');
      for (const id of ['device', 'clip', 'session-screen']) expect([id, lampState(c, id)]).toEqual([id, 'dim']);
    },
  },

  TheTopOctave: {
    set: onTrack('t-bass'),
    act: async ({ canvasElement: c }) => {
      for (let i = 0; i < 12; i++) await press(c, 'octave-up');
      keep(c, 'range', overlay(c, 'notice')?.textContent ?? '');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(lampState(c, 'octave-up')).toBe('off');
      expect(lampState(c, 'octave-down')).not.toBe('off');
      const before = states(context).at(-1)!.notes.octave;
      forget(context);
      await press(c, 'octave-up');
      expect(asked(context)).toEqual([]);
      expect(states(context).at(-1)!.notes.octave).toEqual(before);
    },
  },

  ArmingInStandalone: {
    act: async ({ canvasElement: c }) => {
      expect(tab(c, 'bottom', 5).querySelector('[data-part="armed"]')).toBeNull();
      await press(c, 'lower-5');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(all(context, 'select-track')).toEqual([{ kind: 'navigate', action: 'select-track', track: 't-vocals' }]);
      await waitFor(() => expect(tab(c, 'bottom', 5).querySelector('[data-part="armed"]')).toHaveAccessibleName('armed'));
      // Nothing was asked to arm it: it follows the selection.
      expect(actions(context).filter((a) => /arm/.test(a))).toEqual([]);
    },
  },

  ArmingInControlMode: {
    set: control,
    act: async ({ canvasElement: c }) => {
      await press(c, 'lower-5');
      await wait(60);
      keep(c, 'selected', String(tab(c, 'bottom', 5).hasAttribute('data-selected')));
      keep(c, 'armed', String(!!tab(c, 'bottom', 5).querySelector('[data-part="armed"]')));
      await given(c, (set) => void (set.tracks[4].armed = true));
    },
    check: async ({ canvasElement: c }) => {
      expect(kept(c, 'selected')).toBe('true');
      expect(kept(c, 'armed')).toBe('false');
      await waitFor(() => expect(tab(c, 'bottom', 5).querySelector('[data-part="armed"]')).not.toBeNull());
    },
  },

  LiveIntro: {
    ...withState({ display: 'clip' }),
    set: onTrack('t-guitar', (set) => void (set.unit.edition = 'intro')),
    act: async ({ canvasElement: c }) => {
      await press(c, 'convert');
    },
    check: ({ canvasElement: c }) => {
      const offered = [...rowTexts(c, 'top'), ...rowTexts(c, 'bottom'), screenText(c)].join(' ');
      expect(offered).toContain('Simpler');
      expect(offered).not.toMatch(/Harmony|Melody|Drums-MIDI/);
    },
  },

  AButtonInUserMode: {
    set: control,
    act: async (context) => {
      const c = context.canvasElement;
      await press(c, 'user');
      forget(context);
      keep(c, 'from', String(c.querySelector('.push-device')!.getAttribute('data-user')));
      await press(c, 'play');
    },
    check: (context) => {
      expect(kept(context.canvasElement, 'from')).toBe('true');
      const changes = all(context, 'control-change').filter((i) => i.control === 'play');
      expect(changes.map((i) => i.value)).toEqual([127, 0]);
      expect(actions(context)).not.toContain('play');
      expect(actions(context)).not.toContain('stop');
    },
  },

  Leaving: {
    ...withState({ pads: 'session', display: 'mix' }),
    set: control,
    act: async ({ canvasElement: c }) => {
      await press(c, 'user');
      keep(c, 'in', `${screenKind(c)} ${lampState(c, 'user')}`);
      await press(c, 'user');
    },
    check: ({ canvasElement: c }) => {
      expect(kept(c, 'in')).toBe('user lit');
      expect(screenKind(c)).toBe('mix-global');
      expect(padsOf(c)).toBe('session');
      expect(c.querySelector('.push-device')).not.toHaveAttribute('data-user');
    },
  },

  Feedback: {
    set: control,
    act: async ({ canvasElement: c }) => {
      await press(c, 'user');
      await given(c, (set) => void (set.userLamps = { 'pad-8-1': { state: 'lit', colour: 'record' } }));
    },
    check: async ({ canvasElement: c }) => {
      await waitFor(() => expect(lamp(c, 'pad-8-1')).toEqual({ state: 'lit', colour: RED }));
      const others = CONTROLS.filter((x) => x.id !== 'pad-8-1' && x.id !== 'user').filter((x) => !['off', 'none'].includes(lampState(c, x.id)));
      expect(others.map((x) => x.id)).toEqual([]);
      expect(lampState(c, 'user')).toBe('lit');
    },
  },

  ADoubleTapOnPedal1: {
    act: async ({ canvasElement: c }) => {
      await pedalTwice(c, 1);
      await wait(500);
    },
    check: (context) => {
      // What the New button asks, over the same Set.
      const fromNew = run(sampleSet(), script('new', 1000)).flatMap((s) => s.intents.map((i) => i.action));
      expect(fromNew.length).toBeGreaterThan(0);
      expect(actions(context)).toEqual(fromNew);
      expect(kinds(context, 'pedal-1')).toEqual(['down', 'up', 'down', 'up']);
    },
  },

  Sustain: {
    set: onTrack('t-bass'),
    act: async ({ canvasElement: c }) => {
      await report(c, 'pedal-2', 'down');
      keep(c, 'held', JSON.stringify(app(c).intents().filter((i) => i.action === 'sustain')));
      await wait(200);
      await report(c, 'pedal-2', 'up');
    },
    check: (context) => {
      expect(JSON.parse(kept(context.canvasElement, 'held'))).toMatchObject([{ action: 'sustain', down: true }]);
      expect(all(context, 'sustain').map((i) => i.down)).toEqual([true, false]);
    },
  },

  AScriptedSession: {
    act: none,
    check: () => {
      // No page is asked anything here: inputs in, data out.
      const inputs = [...script('mix', 0), ...script('lower-2', 300), scriptTurn('encoder-2', 2, 600), ...script('play', 900)];
      const steps = run(sampleSet(), inputs);
      expect(steps).toHaveLength(inputs.length);
      expect(steps.flatMap((s) => s.intents.map((i) => i.action))).toEqual(['select-track', 'set-parameter', 'play']);
      for (const s of steps) {
        expect(Array.isArray(s.intents)).toBe(true);
        expect(s.screen.top).toHaveLength(8);
        expect(typeof s.lamps.play.state).toBe('string');
      }
      expect(steps[0].screen.kind).toBe('mix-global');
      expect(copy(steps)).toEqual(steps);
      // The same script gives the same account.
      expect(run(sampleSet(), inputs)).toEqual(steps);
    },
  },

  AnUnknownControl: {
    act: async ({ canvasElement: c }) => {
      keep(c, 'before', drawn(c));
      await report(c, 'no-such-control', 'down');
      await report(c, 'no-such-control', 'up');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(asked(context)).toEqual([]);
      expect(drawn(c)).toBe(kept(c, 'before'));
      const state = initialState();
      const result = step(state, sampleSet(), input('no-such-control', 'down', 10));
      expect(result.intents).toEqual([]);
      expect(result.state).toEqual(state);
    },
  },
} satisfies Record<string, Play>;

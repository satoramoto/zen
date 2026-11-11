import { describe, expect, it } from 'vitest';
import { CONTROLS } from './layout';
import { project } from './project';
import { input, press, run } from './run';
import { sampleSet } from './sample';
import { initialState } from './state';
import { nextTick, readable, step, tick } from './step';
import { DOUBLE_MS, HOLD_MS, PEDAL_DOUBLE_MS } from './timing';
import { isDouble, type Ctx } from './engine';
import type { PushInput, PushIntent, PushState } from './types';

const json = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const actions = (intents: PushIntent[]) => intents.map((i) => i.action);
/** Applies inputs in order and returns the last state and every intent asked. */
function play(inputs: PushInput[], state: PushState = initialState(), set = sampleSet()) {
  const steps = run(set, inputs, state);
  return { state: steps.at(-1)?.state ?? state, intents: steps.flatMap((s) => s.intents), steps };
}

describe('the shapes are plain data', () => {
  it('a Set survives JSON and projects the same', () => {
    const set = sampleSet();
    expect(json(set)).toEqual(set);
    expect(project(initialState(), json(set))).toEqual(project(initialState(), set));
  });

  it('a state survives JSON mid-session and projects the same', () => {
    const set = sampleSet();
    const { state } = play([input('mix', 'down', 0), input('mix', 'up', 40), input('session', 'down', 100), input('shift', 'down', 120)], initialState(), set);
    expect(json(state)).toEqual(state);
    expect(project(json(state), set)).toEqual(project(state, set));
  });

  it('inputs, intents, lamps and screens survive JSON', () => {
    const set = sampleSet();
    const steps = run(set, [...press('play', 0), ...press('undo', 100)]);
    for (const s of steps) {
      expect(json(s.input)).toEqual(s.input);
      expect(json(s.intents)).toEqual(s.intents);
      expect(json(s.lamps)).toEqual(s.lamps);
      expect(json(s.screen)).toEqual(s.screen);
    }
  });

  it('two states over one Set each show their own mode and screen', () => {
    const set = sampleSet();
    const a = play(press('mix', 0), initialState(), set).state;
    const b = play(press('clip', 0), initialState(), set).state;
    expect(project(a, set).lamps.mix.state).toBe('lit');
    expect(project(b, set).lamps.clip.state).toBe('lit');
    expect(project(a, set).lamps.clip.state).toBe('dim');
  });
});

describe('step is pure', () => {
  it('gives the same result for the same three, and changes none of them', () => {
    const set = sampleSet();
    const state = initialState();
    const frozenSet = json(set);
    const frozenState = json(state);
    const down = input('play', 'down', 10);
    const a = step(state, set, down);
    const b = step(state, set, down);
    expect(a).toEqual(b);
    expect(set).toEqual(frozenSet);
    expect(state).toEqual(frozenState);
  });

  it('ignores a control the surface does not have, and data it cannot read', () => {
    const set = sampleSet();
    const state = initialState();
    for (const bad of [input('warp-drive', 'down', 0), { control: 'play', kind: 'smash', time: 0 }, { control: 'play', kind: 'down' }, { control: 'play', kind: 'down', time: NaN }, null, 'play', 42]) {
      expect(readable(bad)).toBe(false);
      const result = step(state, set, bad as PushInput);
      expect(result.state).toBe(state);
      expect(result.intents).toEqual([]);
    }
  });

  it('never edits the Set: asking is all it does', () => {
    const set = sampleSet();
    const { intents, state } = play(press('play', 0), initialState(), set);
    expect(actions(intents)).toEqual(['play']);
    // The app gave no new Set, so the device still shows the transport stopped.
    expect(project(state, set).lamps.play.state).toBe('dim');
    const playing = { ...set, transport: { ...set.transport, playing: true } };
    expect(project(state, playing).lamps.play).toEqual({ state: 'lit', colour: 'play' });
  });
});

describe('projection', () => {
  it('gives every control a lamp and a whole screen with no input applied', () => {
    const { lamps, screen } = project(initialState(), sampleSet());
    for (const c of CONTROLS) expect(lamps[c.id], c.id).toBeDefined();
    expect(screen.top).toHaveLength(8);
    expect(screen.bottom).toHaveLength(8);
    expect(screen.kind).toBe('device');
  });

  it('is dark and blank when the unit is off, and asks nothing', () => {
    const set = sampleSet();
    set.unit.power = 'off';
    const { lamps, screen } = project(initialState(), set);
    expect(Object.values(lamps).every((l) => l.state === 'off')).toBe(true);
    expect(screen.kind).toBe('blank');
    expect(play(press('play', 0), initialState(), set).intents).toEqual([]);
  });

  it('keeps the display mode apart from the pad mode', () => {
    const set = sampleSet();
    const { state } = play([...press('session', 0), ...press('device', 100)], initialState(), set);
    expect(state.pads).toBe('session');
    expect(state.display).toBe('device');
    const { lamps } = project(state, set);
    expect([lamps.session.state, lamps.note.state, lamps.device.state, lamps.mix.state]).toEqual(['lit', 'dim', 'lit', 'dim']);
  });
});

describe('time comes with the input', () => {
  it('tells a double press from the times alone', () => {
    const set = sampleSet();
    const first = play(press('upper-1', 1000)).state;
    const ctx = (time: number): Ctx => ({ state: first, set, input: input('upper-1', 'down', time), intents: [] });
    expect(isDouble(ctx(1000 + DOUBLE_MS))).toBe(true);
    expect(isDouble(ctx(1001 + DOUBLE_MS))).toBe(false);
    expect(isDouble({ ...ctx(1100), input: input('upper-2', 'down', 1100) })).toBe(false);
  });

  it('a quick press of Session switches the pads for good', () => {
    const { state } = play(press('session', 0, HOLD_MS - 1));
    expect(state.pads).toBe('session');
    expect(state.held).toEqual({});
  });

  it('holding Session past the hold time visits it, and releasing returns', () => {
    const set = sampleSet();
    const held = play([input('session', 'down', 0), tick(HOLD_MS)], initialState(), set).state;
    expect(held.pads).toBe('note');
    expect(project(held, set).lamps.session.state).toBe('lit');
    const back = play([input('session', 'up', HOLD_MS + 500)], held, set).state;
    expect(back.pads).toBe('note');
    expect(project(back, set).lamps.note.state).toBe('lit');
  });

  it('a pad pressed while Session is held makes the hold a visit at once', () => {
    const { state } = play([input('session', 'down', 0), input('pad-1-1', 'down', 60, { velocity: 100 }), input('pad-1-1', 'up', 90), input('session', 'up', 120)]);
    expect(state.pads).toBe('note');
  });

  it('says when it next needs a tick', () => {
    const state = play([input('session', 'down', 200)]).state;
    expect(nextTick(state)).toBe(200 + HOLD_MS);
    expect(nextTick(play([tick(200 + HOLD_MS)], state).state)).toBeUndefined();
    expect(nextTick(initialState())).toBeUndefined();
  });
});

describe('Shift and Select', () => {
  it('do nothing alone', () => {
    const { intents, state } = play([...press('shift', 0), ...press('select', 100)]);
    expect(intents).toEqual([]);
    expect({ ...state, last: undefined }).toEqual({ ...initialState(), last: undefined });
  });

  it('Shift and Undo asks to redo, and Undo alone to undo', () => {
    expect(actions(play([input('shift', 'down', 0), ...press('undo', 50), input('shift', 'up', 200)]).intents)).toEqual(['redo']);
    expect(actions(play(press('undo', 0)).intents)).toEqual(['undo']);
  });
});

describe('the pedals', () => {
  it('one tap of Pedal 1 asks what Record asks, once the double-tap time has passed', () => {
    const tapped = play(press('pedal-1', 0));
    expect(tapped.intents).toEqual([]);
    expect(nextTick(tapped.state)).toBe(PEDAL_DOUBLE_MS);
    expect(actions(play([tick(PEDAL_DOUBLE_MS)], tapped.state).intents)).toEqual(['record']);
  });

  it('a quick double tap of Pedal 1 asks what New asks, and does not record', () => {
    const { intents } = play([...press('pedal-1', 0), ...press('pedal-1', 200), tick(1000)]);
    expect(actions(intents)).toEqual(['new-scene']);
  });

  it('Pedal 2 reports sustain down and up', () => {
    const { intents } = play(press('pedal-2', 0, 800));
    expect(intents).toEqual([{ kind: 'note', action: 'sustain', down: true }, { kind: 'note', action: 'sustain', down: false }]);
  });
});

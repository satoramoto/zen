import { describe, expect, it } from 'vitest';
import { project } from './project';
import { input, press, run, turn } from './run';
import { sampleSet } from './sample';
import { initialState } from './state';
import { userModeMap } from './midi';
import { CONTROLS } from './layout';
import type { PushSet } from './types';

const controlSet = (): PushSet => {
  const set = sampleSet();
  set.unit.mode = 'control';
  return set;
};
const inUser = () => run(controlSet(), press('user', 0)).at(-1)!.state;

describe('User Mode', () => {
  it('is entered from the User button in Control Mode only', () => {
    expect(inUser().user).toBe(true);
    expect(run(sampleSet(), press('user', 0)).at(-1)!.state.user).toBe(false);
    expect(project(initialState(), sampleSet()).lamps.user.state).toBe('off');
    expect(project(initialState(), controlSet()).lamps.user.state).toBe('dim');
  });

  it.each([
    ['a button', press('play', 100), [{ kind: 'note', action: 'control-change', number: 85, value: 127, control: 'play' }, { kind: 'note', action: 'control-change', number: 85, value: 0, control: 'play' }]],
    ['a pad', press('pad-8-1', 100, 50, { velocity: 90 }), [{ kind: 'note', action: 'note-on', number: 36, velocity: 90, control: 'pad-8-1' }, { kind: 'note', action: 'note-off', number: 36, control: 'pad-8-1' }]],
    ['an encoder turned', [turn('encoder-1', 2, 100), turn('encoder-1', -1, 120)], [{ kind: 'note', action: 'control-change', number: 71, value: 2, relative: true, control: 'encoder-1' }, { kind: 'note', action: 'control-change', number: 71, value: 127, relative: true, control: 'encoder-1' }]],
    ['an encoder touched', [input('encoder-3', 'touch', 100), input('encoder-3', 'release', 200)], [{ kind: 'note', action: 'note-on', number: 2, velocity: 127, control: 'encoder-3' }, { kind: 'note', action: 'note-off', number: 2, control: 'encoder-3' }]],
    ['the touch strip', [input('strip', 'touch', 100, { value: 0.5 }), input('strip', 'move', 110, { value: 1 }), input('strip', 'release', 200)], [
      { kind: 'note', action: 'note-on', number: 12, velocity: 127, control: 'strip' }, { kind: 'note', action: 'pitch-bend', value: 0, control: 'strip' }, { kind: 'note', action: 'pitch-bend', value: 1, control: 'strip' },
      { kind: 'note', action: 'pitch-bend', value: 0, control: 'strip' }, { kind: 'note', action: 'note-off', number: 12, control: 'strip' },
    ]],
  ])('%s reports bare messages and asks nothing of the Set', (_name, inputs, expected) => {
    const intents = run(controlSet(), inputs, inUser()).flatMap((s) => s.intents);
    expect(intents).toEqual(expected);
    expect(intents.every((i) => i.kind === 'note')).toBe(true);
  });

  it('the top right pad is note 99', () => {
    expect(run(controlSet(), [input('pad-1-8', 'down', 0, { velocity: 1 })], inUser())[0].intents[0].number).toBe(99);
  });

  it('shows only the lamps the app sets, and the User button', () => {
    const set = controlSet();
    set.userLamps = { 'pad-8-1': { state: 'lit', colour: 14 } };
    const { lamps, screen } = project(inUser(), set);
    expect(lamps['pad-8-1']).toEqual({ state: 'lit', colour: 14 });
    expect(lamps.user.state).toBe('lit');
    const lit = Object.entries(lamps).filter(([, l]) => l.state !== 'off').map(([id]) => id);
    expect(lit.sort()).toEqual(['pad-8-1', 'user']);
    expect(screen.kind).toBe('user');
  });

  it('the User button always leaves, to the mode and screen it had before', () => {
    const set = controlSet();
    const before = run(set, [...press('mix', 0), ...press('session', 100)]).at(-1)!.state;
    const inside = run(set, press('user', 200), before).at(-1)!.state;
    const after = run(set, press('user', 400), inside).at(-1)!.state;
    expect(after.user).toBe(false);
    expect([after.display, after.pads]).toEqual(['mix', 'session']);
    expect(project(after, set).screen.kind).toBe('mix-global');
  });

  it('lists what every control sends', () => {
    const map = userModeMap();
    expect(map).toHaveLength(CONTROLS.length - 1);
    const buttons = map.filter((m) => m.message === 'control-change' && m.number !== undefined);
    const numbers = buttons.filter((m) => !/^encoder|^volume|^tempo|^jog/.test(m.control)).map((m) => m.number);
    expect(new Set(numbers).size).toBe(numbers.length);
    expect(map.filter((m) => m.number === undefined && m.message !== 'pitch-bend')).toEqual([]);
  });
});

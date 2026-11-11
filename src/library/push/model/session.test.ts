import { describe, expect, it } from 'vitest';
import { slotAt, slotLamp, workflow } from './layers/session';
import { initialState } from './state';
import { nextTick, tick } from './step';
import { hold, pad, play, release, setOn, tap } from './testing';
import type { PushState } from './types';

const onPads = (more: Partial<PushState> = {}): PushState => ({ ...initialState(), pads: 'session', ...more });

describe('Session Pad Mode', () => {
  it('a pad launches a clip, stops an unarmed track, or records on an armed one', () => {
    const set = setOn('t-drums', (s) => void (s.tracks[2].armed = true));
    const { intents } = play([pad(1, 1), pad(3, 1), pad(1, 3)], { set, state: onPads(), host: false });
    expect(intents).toEqual([
      { kind: 'transport', action: 'launch-clip', track: 't-drums', scene: 0 },
      { kind: 'transport', action: 'stop-clip', track: 't-drums' },
      { kind: 'transport', action: 'record-clip', track: 't-keys', scene: 0 },
    ]);
  });

  it('the window moves without the selection, and is reported in Control Mode only', () => {
    const control = setOn('t-drums', (s) => void (s.unit.mode = 'control'));
    const moved = play([...tap('dpad-right'), ...tap('page-right'), ...tap('dpad-down')], { set: control, state: onPads() });
    expect(moved.state.session).toMatchObject({ track: 9, scene: 1 });
    expect(moved.actions).toEqual(['move-session-ring', 'move-session-ring', 'move-session-ring']);
    expect(play(tap('dpad-right'), { set: setOn('t-drums'), state: onPads() }).actions).toEqual([]);
  });

  it('lights a slot by what is in it', () => {
    const set = setOn('t-drums');
    const state = onPads();
    const clip = set.tracks[0].clips[0]!;
    expect(slotLamp(state, set, set.tracks[0], 0, clip)).toEqual({ state: 'lit', colour: 14 });
    expect(slotLamp(state, set, set.tracks[0], 0, { ...clip, state: 'queued' })).toEqual({ state: 'blink', colour: 'queue' });
    expect(slotLamp(state, set, set.tracks[0], 0, { ...clip, state: 'playing' })).toEqual({ state: 'pulse', colour: 'play' });
    expect(slotLamp(state, set, set.tracks[0], 0, { ...clip, state: 'recording' })).toEqual({ state: 'lit', colour: 'record' });
    expect(slotLamp(state, set, set.tracks[0], 2, undefined)).toEqual({ state: 'off' });
    expect(slotLamp(state, set, { ...set.tracks[0], armed: true }, 2, undefined)).toEqual({ state: 'lit', colour: 'record', shade: 'dim' });
    expect(slotAt(state, set, 2, 3)).toMatchObject({ scene: 1, clip: { name: 'Chords' } });
  });

  it('Duplicate and New follow the Workflow preference', () => {
    const clipFlow = setOn('t-drums', (s) => void (s.unit.preferences.Workflow.value = 'Clip'));
    expect(workflow(clipFlow)).toBe('clip');
    expect(play([...tap('duplicate'), ...tap('new')], { set: clipFlow, host: false }).actions).toEqual(['duplicate-clip', 'new-clip']);
    expect(play([...tap('duplicate'), ...tap('new')], { set: setOn('t-drums'), host: false }).actions).toEqual(['duplicate-scene', 'new-scene']);
    expect(play([hold('shift'), ...tap('duplicate'), release('shift')], { set: clipFlow, host: false }).actions).toEqual(['duplicate-scene']);
  });
});

describe('recording', () => {
  it('Record steps through recording, playing and overdub', () => {
    const { intents } = play([...tap('record'), ...tap('record'), ...tap('record'), ...tap('record')], { set: setOn('t-bass') });
    expect(intents.map((i) => `${i.action}${i.on === undefined ? '' : i.on ? ' on' : ' off'}`)).toEqual(['record on', 'record off', 'overdub on', 'overdub off']);
  });

  it('a held pad with Repeat on asks for a note each interval, by ticks', () => {
    const set = setOn('t-drums');
    const state = { ...initialState(), repeats: { 't-drums': { on: true, interval: 3 } } };
    const down = play([{ control: 'pad-7-3', kind: 'down', time: 1000, velocity: 100 }], { set, state });
    expect(nextTick(down.state)).toBe(1125);
    const more = play([tick(1125), tick(1250), { control: 'pad-7-3', kind: 'up', time: 1300 }, tick(1375)], { set, state: down.state });
    expect(more.intents.filter((i) => i.action === 'note-on').map((i) => i.repeat)).toEqual([true, true]);
    expect(nextTick(more.state)).toBeUndefined();
  });

  it('taps a bar apart set the tempo and start a stopped Set', () => {
    const taps = [0, 500, 1000, 1500].flatMap((time) => [{ control: 'tap-tempo', kind: 'down' as const, time }, { control: 'tap-tempo', kind: 'up' as const, time: time + 20 }]);
    const { intents } = play(taps, { host: false });
    expect(intents.filter((i) => i.action === 'set-tempo').at(-1)!.value).toBe(120);
    expect(intents.filter((i) => i.action === 'play')).toHaveLength(1);
  });
});

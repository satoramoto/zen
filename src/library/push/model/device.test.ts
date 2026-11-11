import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDevice } from './device';
import { sampleSet } from './sample';
import { HOLD_MS, PEDAL_DOUBLE_MS, POWER_HOLD_MS } from './timing';
import type { PushIntent } from './types';

describe('a device that runs itself', () => {
  let time = 0;
  beforeEach(() => {
    time = 0;
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());
  const advance = (ms: number) => {
    time += ms;
    vi.advanceTimersByTime(ms);
  };
  const make = (set = sampleSet()) => {
    const intents: PushIntent[] = [];
    const device = createDevice({ set, now: () => time, onIntent: (i) => intents.push(i) });
    return { device, intents, set };
  };

  it('hands each intent to its listener and shows only what the app gives back', () => {
    const { device, intents, set } = make();
    device.input({ control: 'play', kind: 'down', time });
    expect(intents).toEqual([{ kind: 'transport', action: 'play' }]);
    expect(device.get().lamps.play.state).toBe('dim');
    device.setSet({ ...set, transport: { ...set.transport, playing: true } });
    expect(device.get().lamps.play.state).toBe('lit');
  });

  it('tells its subscribers of each change, and keeps one snapshot between changes', () => {
    const { device } = make();
    const seen: string[] = [];
    const stop = device.subscribe((s) => seen.push(s.state.display));
    const before = device.get();
    expect(device.get()).toBe(before);
    device.input({ control: 'mix', kind: 'down', time });
    expect(seen).toEqual(['device', 'mix']);
    stop();
    device.input({ control: 'clip', kind: 'down', time });
    expect(seen).toEqual(['device', 'mix']);
  });

  it('gives itself a tick when a hold matures', () => {
    const { device } = make();
    device.input({ control: 'session', kind: 'down', time });
    expect(device.get().lamps.session.state).toBe('dim');
    advance(HOLD_MS);
    expect(device.get().state.held.session.holding).toBe(true);
    expect(device.get().lamps.session.state).toBe('lit');
  });

  it('settles a Pedal 1 tap into Record after the double-tap time', () => {
    const { device, intents } = make();
    device.input({ control: 'pedal-1', kind: 'down', time });
    device.input({ control: 'pedal-1', kind: 'up', time });
    expect(intents).toEqual([]);
    advance(PEDAL_DOUBLE_MS);
    expect(intents.map((i) => i.action)).toEqual(['record']);
  });

  it('asks to switch off once the power button has been held for its time, and on again from off', () => {
    const { device, intents, set } = make();
    device.input({ control: 'power', kind: 'down', time });
    advance(POWER_HOLD_MS - 1);
    expect(intents).toEqual([]);
    advance(1);
    expect(intents).toEqual([{ kind: 'setting', action: 'power', on: false }]);
    device.input({ control: 'power', kind: 'up', time });
    expect(intents).toHaveLength(1);
    device.setSet({ ...set, unit: { ...set.unit, power: 'off' } });
    device.input({ control: 'power', kind: 'down', time });
    expect(intents.at(-1)).toEqual({ kind: 'setting', action: 'power', on: true });
  });

  it('stops its timer when destroyed', () => {
    const { device } = make();
    device.input({ control: 'session', kind: 'down', time });
    device.destroy();
    advance(HOLD_MS * 2);
    expect(device.get().state.held.session.holding).toBeUndefined();
  });
});

// @vitest-environment node
// The scripted runner outside a browser: this file runs in Node, with no DOM.
import { describe, expect, it } from 'vitest';
import { input, press, run, sampleSet, setProblems, type PushIntent, type PushSet } from './index';

/** A small app: it plays and stops, and refuses everything else. */
function apply(set: PushSet, intent: PushIntent): PushSet {
  if (intent.action === 'play') return { ...set, transport: { ...set.transport, playing: true } };
  if (intent.action === 'stop') return { ...set, transport: { ...set.transport, playing: false } };
  return set;
}

describe('a scripted session', () => {
  it('runs with no DOM', () => {
    expect(typeof document).toBe('undefined');
  });

  it('returns the intents, lamps and screen after each input, as data', () => {
    const steps = run(sampleSet(), [...press('play', 0), ...press('mix', 200), ...press('play', 400), input('shift', 'down', 600), ...press('undo', 650)], undefined, apply);
    expect(steps).toHaveLength(9);
    expect(steps.map((s) => s.intents.map((i) => i.action))).toEqual([['play'], [], [], [], ['stop'], [], [], ['redo'], []]);
    expect(steps[0].lamps.play).toEqual({ state: 'lit', colour: 'play' });
    expect(steps[4].lamps.play.state).toBe('dim');
    expect(steps[2].screen.kind).toBe('mix-global');
    expect(JSON.parse(JSON.stringify(steps))).toEqual(steps);
  });

  it('shows what the app gives: a refused intent changes nothing on the device', () => {
    const steps = run(sampleSet(), press('play', 0));
    expect(steps[0].intents.map((i) => i.action)).toEqual(['play']);
    expect(steps[1].lamps.play.state).toBe('dim');
  });
});

describe('the sample Set', () => {
  it('holds what the model reads', () => {
    expect(setProblems(sampleSet())).toEqual([]);
  });

  it('has more than eight tracks of every kind, the devices the plan names, and the unit’s readings', () => {
    const set = sampleSet();
    expect(set.tracks.length).toBeGreaterThan(8);
    expect(new Set(set.tracks.map((t) => t.kind))).toEqual(new Set(['midi', 'audio', 'group']));
    const kinds = set.tracks.flatMap((t) => t.devices.map((d) => d.kind));
    for (const kind of ['instrument', 'simpler', 'drum-rack', 'instrument-rack', 'audio-effect']) expect(kinds).toContain(kind);
    expect(set.tracks.flatMap((t) => t.devices).some((d) => d.name === 'Tuner')).toBe(true);
    expect(set.tracks.find((t) => t.id === 't-keys')!.devices[0].macros).toHaveLength(8);
    expect(set.scenes).toHaveLength(8);
    expect(set.browser.roots.map((r) => r.name)).toEqual(['Device', 'MIDI Track', 'Audio Track', 'Return Track']);
    expect(set.browser.roots[0].children!.length).toBeGreaterThan(5);
    expect(set.unit.battery?.percent).toBe(72);
  });

  it('gives each caller its own copy', () => {
    const a = sampleSet();
    a.tracks[0].name = 'Changed';
    expect(sampleSet().tracks[0].name).toBe('Drums');
  });
});

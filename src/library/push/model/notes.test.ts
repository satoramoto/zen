import { describe, expect, it } from 'vitest';
import { project } from './project';
import { noteName } from './scales';
import { initialState } from './state';
import { hold, pad, play, release, setOn, tap, twist } from './testing';
import type { PushIntent, PushSet } from './types';

const bass = (change: (set: PushSet) => void = () => {}) => setOn('t-bass', change);
const pitches = (intents: PushIntent[], action = 'note-on') => intents.filter((i) => i.action === action).map((i) => noteName(i.pitch as number));

describe('64 Notes', () => {
  it('plays C1, D1 and F1 from the bottom left pad, the one to its right and the one above', () => {
    const { intents } = play([pad(8, 1), pad(8, 2), pad(7, 1)], { set: bass() });
    expect(pitches(intents)).toEqual(['C1', 'D1', 'F1']);
  });

  it('reports the note it started when the pad comes up, whatever has changed since', () => {
    const { intents } = play([pad(8, 1), ...tap('octave-up'), pad(8, 1, 'up')], { set: bass() });
    expect(pitches(intents, 'note-off')).toEqual(['C1']);
  });

  it('lights roots in the track’s colour, the scale white, and a sounding note green on every pad that plays it', () => {
    const set = bass();
    const idle = project(initialState(), set).lamps;
    expect(idle['pad-8-1']).toEqual({ state: 'lit', colour: 22 });
    expect(idle['pad-8-2']).toEqual({ state: 'lit', colour: 'white', shade: 'dim' });
    const held = play([pad(8, 3)], { set }).last.lamps;
    // E1 is on pad (8,3); nowhere else in the first two rows, since row 7 starts on F1.
    expect(held['pad-8-3']).toEqual({ state: 'lit', colour: 'note' });
    const outside = project(initialState(), { ...set, sounding: [48] }).lamps;
    expect(['pad-8-8', 'pad-7-5', 'pad-6-2'].map((id) => outside[id].colour)).toEqual(['note', 'note', 'note']);
  });

  it('is unlit and silent on a track with nothing to play', () => {
    for (const track of ['t-vocals', 't-empty']) {
      const set = setOn(track);
      const { intents, last } = play([pad(8, 1), pad(8, 1, 'up')], { set });
      expect(intents).toEqual([]);
      expect(Object.entries(last.lamps).filter(([id, l]) => id.startsWith('pad-') && l.state !== 'off')).toEqual([]);
    }
  });

  it('chromatic: the next pad is C sharp, unlit, and still plays', () => {
    const set = bass((s) => void (s.scale.inKey = false));
    expect(project(initialState(), set).lamps['pad-8-2'].state).toBe('off');
    expect(pitches(play([pad(8, 2)], { set }).intents)).toEqual(['C♯1']);
  });

  it('Accent makes every strike full', () => {
    const { intents } = play([pad(8, 1, 'down', { velocity: 20 })], { set: bass(), state: { ...initialState(), accent: true } });
    expect(intents[0].velocity).toBe(127);
  });
});

describe('expression', () => {
  const held = (set: PushSet, more: Parameters<typeof play>[0]) => play([pad(8, 1), ...more], { set }).intents.slice(1);

  it('MPE reports pressure, slide and bend for the note', () => {
    const got = held(bass(), [pad(8, 1, 'pressure', { value: 0.6 }), pad(8, 1, 'slide', { value: 0.9 }), pad(8, 1, 'bend', { value: 1 })]);
    expect(got).toEqual([
      { kind: 'note', action: 'pressure', pitch: 36, value: 0.6, track: 't-bass' },
      { kind: 'note', action: 'slide', pitch: 36, value: 0.9, track: 't-bass' },
      { kind: 'note', action: 'bend', pitch: 36, semitones: 2, track: 't-bass' },
    ]);
  });

  it('a bend to the centre of the next pad reaches the interval to its note, and halfway is half of it', () => {
    const bend = (col: number, pads: number) => held(bass(), [pad(8, col, 'down'), pad(8, col, 'bend', { value: pads })]).at(-1)!.semitones;
    expect(bend(3, 1)).toBe(1); // E to F
    expect(bend(1, 0.5)).toBe(1); // halfway from C to D
    expect(bend(1, -1)).toBe(-2); // off the left edge, as the row was going
  });

  it('Poly Aftertouch reports only pressure; Mono reports the hardest of all held', () => {
    const poly = bass((s) => void (s.unit.expression.mode = 'poly-aftertouch'));
    expect(held(poly, [pad(8, 1, 'slide', { value: 0.9 }), pad(8, 1, 'bend', { value: 1 }), pad(8, 1, 'pressure', { value: 0.4 })]).map((i) => i.action)).toEqual(['pressure']);
    const mono = bass((s) => void (s.unit.expression.mode = 'mono-aftertouch'));
    const got = held(mono, [pad(8, 2), pad(8, 1, 'pressure', { value: 0.7 }), pad(8, 2, 'pressure', { value: 0.3 })]).filter((i) => i.action === 'pressure');
    expect(got).toEqual([{ kind: 'note', action: 'pressure', value: 0.7, track: 't-bass' }, { kind: 'note', action: 'pressure', value: 0.7, track: 't-bass' }]);
  });

  it('on an instrument that cannot bend, sliding to the next pad ends one note and starts the next; forced off, nothing', () => {
    const plain = bass((s) => void (s.tracks[1].devices[0].mpe = false));
    expect(held(plain, [pad(8, 1, 'bend', { value: 0.3 }), pad(8, 1, 'bend', { value: 1 })])).toEqual([
      { kind: 'note', action: 'note-off', pitch: 36, track: 't-bass', pad: 'pad-8-1' },
      { kind: 'note', action: 'note-on', pitch: 38, velocity: 100, track: 't-bass', pad: 'pad-8-2' },
    ]);
    const off = bass((s) => void (s.unit.expression.noteBend = 'off'));
    expect(held(off, [pad(8, 1, 'bend', { value: 1 })])).toEqual([]);
    const forced = bass((s) => ((s.tracks[1].devices[0].mpe = false), (s.unit.expression.noteBend = 'on')));
    expect(held(forced, [pad(8, 1, 'bend', { value: 1 })]).map((i) => i.action)).toEqual(['bend']);
  });
});

describe('the octave buttons, Layout and the Scale menu', () => {
  it('Octave Up moves the grid an octave, shows the range for a moment, and goes dark at the top', () => {
    const up = play(tap('octave-up'), { set: bass() });
    expect(up.last.notes['pad-8-1']).toBe(48);
    expect(up.last.screen.overlays).toContainEqual({ type: 'notice', text: 'Note Range', value: 'C2 to C6' });
    const top = play([...tap('octave-up'), ...tap('octave-up'), ...tap('octave-up'), ...tap('octave-up')], { set: bass() });
    expect(top.last.notes['pad-8-1']).toBe(72);
    expect(top.last.lamps['octave-up'].state).toBe('off');
    expect(top.last.lamps['octave-down'].state).toBe('dim');
  });

  it('Layout steps through the three melodic layouts, names each, and is remembered per track', () => {
    const three = play([...tap('layout'), ...tap('layout'), ...tap('layout')], { set: bass() });
    expect(three.steps.filter((s) => s.input.kind === 'up').map((s) => s.screen.overlays[0])).toEqual([
      { type: 'notice', text: 'Layout', value: 'Melodic Sequencer' },
      { type: 'notice', text: 'Layout', value: 'Melodic Sequencer + 32 Notes' },
      { type: 'notice', text: 'Layout', value: '64 Notes' },
    ]);
    expect(play(tap('layout'), { set: bass() }).state.notes.layout).toEqual({ 't-bass': 'melodic' });
  });

  it('Scale opens the menu; a key’s button, an encoder over the list and the first buttons ask the app', () => {
    const open = play(tap('scale'), { set: bass() });
    expect(open.last.screen.kind).toBe('scale');
    expect(open.last.screen.top.map((c) => c?.label)).toEqual(['Fixed: Off', 'C', 'G', 'D', 'A', 'E', 'B', undefined]);
    expect(open.last.screen.bottom.map((c) => c?.label)).toEqual(['In Key', 'F', 'B♭', 'E♭', 'A♭', 'C♯', 'F♯', undefined]);
    const g = play([...tap('scale'), ...tap('upper-3')], { set: bass() });
    expect(g.intents).toEqual([{ kind: 'edit', action: 'set-scale', root: 7 }]);
    expect(g.last.screen.top[2]).toEqual({ label: 'G', selected: true });
    expect(g.last.notes['pad-8-1']).toBe(43);
    const dorian = play([...tap('scale'), twist('encoder-4', 4), twist('encoder-4', 4)], { set: bass() });
    expect(dorian.set.scale.scale).toBe('Dorian');
    expect(play([...tap('scale'), ...tap('lower-1'), ...tap('upper-1'), twist('encoder-1', 4)], { set: bass() }).intents.map(({ kind: _k, action: _a, ...rest }) => rest)).toEqual([{ inKey: false }, { fixed: true }, { layout: '3rds' }]);
    expect(play([...tap('scale'), ...tap('scale')], { set: bass() }).last.screen.kind).toBe('device');
  });

  it('a Set saved in F minor is laid out in F minor', () => {
    const set = bass((s) => void (s.scale = { ...s.scale, root: 5, scale: 'Minor' }));
    expect(noteName(project(initialState(), set).notes['pad-8-1']!)).toBe('F1');
  });
});

describe('the touch strip', () => {
  it('bends the whole instrument and springs back on release', () => {
    const { intents, last } = play([{ control: 'strip', kind: 'touch', time: 1, value: 0.5 }, { control: 'strip', kind: 'move', time: 2, value: 1 }, { control: 'strip', kind: 'release', time: 3 }], { set: bass() });
    expect(intents.map((i) => i.value)).toEqual([0, 1, 0]);
    expect(intents.every((i) => i.action === 'pitch-bend')).toBe(true);
    expect(last.strip).toEqual({ kind: 'bend', value: 0 });
  });

  it('Select and a tap switch it to the mod wheel, which stays where it is left', () => {
    const { intents, last } = play([hold('select'), { control: 'strip', kind: 'touch', time: 5, value: 0.2 }, { control: 'strip', kind: 'release', time: 6 }, release('select'), { control: 'strip', kind: 'touch', time: 8, value: 0.7 }, { control: 'strip', kind: 'release', time: 9 }], { set: bass() });
    expect(intents).toEqual([{ kind: 'note', action: 'modulation', value: 0.7, track: 't-bass' }]);
    expect(last.strip).toEqual({ kind: 'level', value: 0.7 });
  });
});

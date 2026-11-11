import { describe, expect, it } from 'vitest';
import { drumCell, slicePad } from './layers/drums';
import { rowPitch } from './layers/melodic';
import { noteName } from './scales';
import { STEP_BEATS, VELOCITIES, loopPages, notesAt, pageInView, playingStep, stepStart, velocityShade } from './seq';
import { initialState } from './state';
import { hold, pad, play, release, setOn, tap } from './testing';
import type { PushState } from './types';

const withLayout = (track: string, layout: string, more: Partial<PushState> = {}): PushState => ({ ...initialState(), ...more, notes: { ...initialState().notes, layout: { [track]: layout } } });

describe('the drum grid', () => {
  const set = setOn('t-drums');
  const state = initialState();

  it('Loop Selector: drums bottom left, loop pages bottom right, steps above', () => {
    expect(drumCell(state, set, 8, 1)).toEqual({ part: 'drum', note: 36 });
    expect(drumCell(state, set, 8, 4)).toEqual({ part: 'drum', note: 39 });
    expect(drumCell(state, set, 5, 1)).toEqual({ part: 'drum', note: 48 });
    expect(drumCell(state, set, 5, 5)).toEqual({ part: 'loop', page: 0 });
    expect(drumCell(state, set, 8, 8)).toEqual({ part: 'loop', page: 15 });
    expect(drumCell(state, set, 1, 1)).toEqual({ part: 'step', index: 0 });
    expect(drumCell(state, set, 4, 8)).toEqual({ part: 'step', index: 31 });
  });

  it('16 Velocities: sixteen levels rising from the bottom left of the right quarter', () => {
    const v = withLayout('t-drums', '16-velocities');
    expect(drumCell(v, set, 8, 5)).toEqual({ part: 'velocity', index: 0 });
    expect(drumCell(v, set, 5, 8)).toEqual({ part: 'velocity', index: 15 });
    expect([VELOCITIES[0], VELOCITIES[15]]).toEqual([7, 127]);
    expect(VELOCITIES).toHaveLength(16);
  });

  it('64 Pads: four blocks of sixteen, the pads in view still bottom left', () => {
    const all = withLayout('t-drums', '64-pads');
    expect(drumCell(all, set, 8, 1)).toEqual({ part: 'drum', note: 36 });
    expect(drumCell(all, set, 5, 4)).toEqual({ part: 'drum', note: 51 });
    expect(drumCell(all, set, 8, 5)).toEqual({ part: 'drum', note: 52 });
    expect(drumCell(all, set, 4, 1)).toEqual({ part: 'drum', note: 68 });
    expect(drumCell(all, set, 1, 8)).toEqual({ part: 'drum', note: 99 });
    const notes = new Set<number>();
    for (let r = 1; r <= 8; r++) for (let c = 1; c <= 8; c++) notes.add((drumCell(all, set, r, c) as { note: number }).note);
    expect(notes.size).toBe(64);
  });

  it('a triplet step size leaves the two rightmost columns of steps out', () => {
    const triplet = { ...state, seq: { ...state.seq, step: 2 } };
    expect(drumCell(triplet, set, 1, 7)).toEqual({ part: 'none' });
    expect(drumCell(triplet, set, 2, 1)).toEqual({ part: 'step', index: 6 });
  });

  it('slices fill the left half in fours from the bottom, then the right', () => {
    expect([0, 3, 4, 9, 31, 32, 63].map(slicePad)).toEqual([{ row: 8, col: 1 }, { row: 8, col: 4 }, { row: 7, col: 1 }, { row: 6, col: 2 }, { row: 1, col: 4 }, { row: 8, col: 5 }, { row: 1, col: 8 }]);
    expect(slicePad(64)).toBeUndefined();
  });
});

describe('steps and pages', () => {
  const set = setOn('t-drums');
  const state = initialState();
  const clip = set.tracks[0].clips[0]!;

  it('step sizes run from a thirty-second triplet to a quarter', () => {
    expect(STEP_BEATS[3]).toBe(0.25);
    expect(STEP_BEATS[7]).toBe(1);
    expect(STEP_BEATS[2]).toBeCloseTo(1 / 6);
  });

  it('finds the notes of a step, and how many pages the loop is', () => {
    expect(notesAt(clip, 0, 0.25, 36)).toHaveLength(1);
    expect(notesAt(clip, 0.25, 0.25, 36)).toHaveLength(0);
    expect(notesAt(clip, 1, 0.25).map((n) => n.pitch).sort()).toEqual([36, 38, 42]);
    expect(loopPages(state, set, 32)).toBe(1);
    expect(loopPages(state, { ...set, tracks: [{ ...set.tracks[0], clips: [{ ...clip, loop: { ...clip.loop, end: 20 } }] }, ...set.tracks.slice(1)] }, 32)).toBe(3);
    expect(stepStart(state, set, 32, 5)).toBe(1.25);
  });

  it('follows the playing page until a page is chosen', () => {
    const playing = setOn('t-drums', (s) => Object.assign(s.tracks[0].clips[0]!, { state: 'playing', position: 9, loop: { on: true, start: 0, end: 16 } }));
    expect(pageInView(state, playing, 32)).toBe(1);
    expect(playingStep(state, playing, 32)).toBe(4);
    const locked = { ...state, seq: { ...state.seq, follow: false, page: 0 } };
    expect(pageInView(locked, playing, 32)).toBe(0);
    expect(playingStep(locked, playing, 32)).toBeUndefined();
  });

  it('shades a note by its velocity', () => {
    expect([30, 80, 120].map(velocityShade)).toEqual(['dim', 'lit', 'bright']);
  });
});

describe('holds and presses on a Drum Rack', () => {
  it('Delete and a pad deletes the pad’s notes, and not the clip', () => {
    const { actions } = play([hold('delete'), pad(8, 1), pad(8, 1, 'up'), release('delete')], { set: setOn('t-drums') });
    expect(actions).toEqual(['delete-notes']);
  });

  it('Delete alone deletes the clip', () => {
    expect(play(tap('delete'), { set: setOn('t-drums') }).actions).toEqual(['delete-clip']);
  });

  it('a step tapped while Mute is held is muted, not removed', () => {
    expect(play([hold('mute'), pad(1, 1), pad(1, 1, 'up'), release('mute')], { set: setOn('t-drums') }).actions).toEqual(['mute-notes']);
  });
});

describe('the Melodic Sequencer', () => {
  it('rows are the scale from the root upward', () => {
    const set = setOn('t-bass');
    const state = withLayout('t-bass', 'melodic');
    expect([8, 7, 6, 5, 4, 3, 2, 1].map((row) => noteName(rowPitch(state, set, row)))).toEqual(['C1', 'D1', 'E1', 'F1', 'G1', 'A1', 'B1', 'C2']);
    const up = { ...state, seq: { ...state.seq, rowBase: { 't-bass': 1 } } };
    expect(noteName(rowPitch(up, set, 8))).toBe('D1');
  });
});

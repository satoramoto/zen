import { describe, expect, it } from 'vitest';
import { canShift, gridRange, gridStart, noteName, padPitch } from './scales';
import type { ScaleSettings } from './types';

const major: ScaleSettings = { root: 0, scale: 'Major', inKey: true, fixed: false, layout: '4ths' };
const names = (s: ScaleSettings, rows = [8, 7, 6]) => rows.map((r) => [1, 2, 3, 4, 5, 6, 7, 8].map((c) => noteName(padPitch(r, c, s))).join(' '));

describe('the note grid', () => {
  it('C major in fourths, written out by hand', () => {
    expect(names(major)).toEqual(['C1 D1 E1 F1 G1 A1 B1 C2', 'F1 G1 A1 B1 C2 D2 E2 F2', 'B1 C2 D2 E2 F2 G2 A2 B2']);
    expect(noteName(padPitch(1, 8, major))).toBe('C5');
  });

  it('C major in thirds', () => {
    expect(names({ ...major, layout: '3rds' })).toEqual(['C1 D1 E1 F1 G1 A1 B1 C2', 'E1 F1 G1 A1 B1 C2 D2 E2', 'G1 A1 B1 C2 D2 E2 F2 G2']);
  });

  it('C major sequential: each row carries on from the last', () => {
    expect(names({ ...major, layout: 'sequential' })).toEqual(['C1 D1 E1 F1 G1 A1 B1 C2', 'D2 E2 F2 G2 A2 B2 C3 D3', 'E3 F3 G3 A3 B3 C4 D4 E4']);
  });

  it('F minor in fourths', () => {
    expect(names({ ...major, root: 5, scale: 'Minor' }, [8, 7])).toEqual(['F1 G1 A♭1 B♭1 C2 C♯2 E♭2 F2', 'B♭1 C2 C♯2 E♭2 F2 G2 A♭2 B♭2']);
  });

  it('chromatic: every semitone has a pad, and a row up is a fourth', () => {
    expect(names({ ...major, inKey: false }, [8, 7])).toEqual(['C1 C♯1 D1 E♭1 E1 F1 F♯1 G1', 'F1 F♯1 G1 A♭1 A1 B♭1 B1 C2']);
  });

  it('a triad is the first pad, two to its right, and up one and right one', () => {
    expect([padPitch(8, 1, major), padPitch(8, 3, major), padPitch(7, 2, major)].map(noteName)).toEqual(['C1', 'E1', 'G1']);
  });

  it('Fixed off starts on the key’s root; Fixed on stays on C or the nearest note of the scale', () => {
    expect(noteName(gridStart({ ...major, root: 2 }))).toBe('D1');
    expect(noteName(gridStart({ ...major, root: 7, fixed: true }))).toBe('C1');
    // D major has no C: the grid starts on its C sharp.
    expect(noteName(gridStart({ ...major, root: 2, fixed: true }))).toBe('C♯1');
    expect(names({ ...major, root: 7, fixed: true }, [8])).toEqual(['C1 D1 E1 F♯1 G1 A1 B1 C2']);
  });

  it('moves by octaves until MIDI runs out', () => {
    expect(noteName(padPitch(8, 1, major, 1))).toBe('C2');
    expect(gridRange(major, 0)).toEqual({ low: 36, high: 84 });
    expect(canShift(major, 3, 1)).toBe(false);
    expect(canShift(major, 2, 1)).toBe(true);
    expect(canShift(major, -3, -1)).toBe(false);
    expect(canShift(major, -2, -1)).toBe(true);
  });
});

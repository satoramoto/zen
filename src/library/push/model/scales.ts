// Keys, scales and the note grid (openspec: push-note-mode). Pure functions over the Set's scale
// settings: what each pad plays, in which of the three interval layouts, in key or chromatic.
import type { ScaleSettings } from './types';

export const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;

/** Live's scales, by name, as semitones from the root. */
export const SCALES: Record<string, readonly number[]> = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Locrian: [0, 1, 3, 5, 6, 8, 10],
  'Whole Tone': [0, 2, 4, 6, 8, 10],
  'Half-whole Dim.': [0, 1, 3, 4, 6, 7, 9, 10],
  'Whole-half Dim.': [0, 2, 3, 5, 6, 8, 9, 11],
  'Minor Blues': [0, 3, 5, 6, 7, 10],
  'Minor Pentatonic': [0, 3, 5, 7, 10],
  'Major Pentatonic': [0, 2, 4, 7, 9],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
  'Harmonic Major': [0, 2, 4, 5, 7, 8, 11],
  'Dorian #4': [0, 2, 3, 6, 7, 9, 10],
  'Phrygian Dominant': [0, 1, 4, 5, 7, 8, 10],
  'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
  'Lydian Augmented': [0, 2, 4, 6, 8, 9, 11],
  'Lydian Dominant': [0, 2, 4, 6, 7, 9, 10],
  'Super Locrian': [0, 1, 3, 4, 6, 8, 10],
  '8-Tone Spanish': [0, 1, 3, 4, 5, 6, 8, 10],
  Bhairav: [0, 1, 4, 5, 7, 8, 11],
  'Hungarian Minor': [0, 2, 3, 6, 7, 8, 11],
  Hirajoshi: [0, 2, 3, 7, 8],
  'In-Sen': [0, 1, 5, 7, 10],
  Iwato: [0, 1, 5, 6, 10],
  Kumoi: [0, 2, 3, 7, 9],
  'Pelog Selisir': [0, 1, 3, 7, 8],
  'Pelog Tembung': [0, 1, 5, 7, 8],
};
export const SCALE_NAMES = Object.keys(SCALES);

/** The twelve keys as the Scale menu lays them on the display buttons: fifths upward over the upper row, fourths over the lower. */
export const KEY_ROWS = { upper: [0, 7, 2, 9, 4, 11], lower: [5, 10, 3, 8, 1, 6] } as const;

/** The bottom left pad of the grid at no octave shift: C1. */
export const BASE_NOTE = 36;

const mod = (n: number, m: number) => ((n % m) + m) % m;
const intervals = (s: ScaleSettings) => SCALES[s.scale] ?? SCALES.Major;

/** A note's name with its octave: 36 is C1, 60 is C3. */
export const noteName = (pitch: number) => `${NOTE_NAMES[mod(pitch, 12)]}${Math.floor(pitch / 12) - 2}`;

export const inScale = (pitch: number, s: ScaleSettings) => intervals(s).includes(mod(pitch - s.root, 12));
export const isRoot = (pitch: number, s: ScaleSettings) => mod(pitch - s.root, 12) === 0;

/** The pitch `degree` scale steps above `from`, which is itself a note of the scale. */
function degreeAbove(from: number, degree: number, s: ScaleSettings): number {
  const steps = intervals(s);
  const at = steps.indexOf(mod(from - s.root, 12));
  const index = at + degree;
  return from - steps[at] + Math.floor(index / steps.length) * 12 + steps[mod(index, steps.length)];
}

/** How far up one row is: in scale steps in key, in semitones chromatic. */
const ROW = { '4ths': { key: 3, chromatic: 5 }, '3rds': { key: 2, chromatic: 4 }, sequential: { key: 8, chromatic: 8 } } as const;

/**
 * The note the bottom left pad plays. With Fixed off it is the key's root; with Fixed on it stays
 * on C, or on the scale's nearest note above it.
 */
export function gridStart(s: ScaleSettings, octave = 0): number {
  const c = BASE_NOTE + octave * 12;
  if (!s.fixed) return c + s.root;
  if (!s.inKey) return c;
  for (let p = c; p < c + 12; p++) if (inScale(p, s)) return p;
  return c;
}

/** What a pad plays: `row` and `col` are 1 to 8 from the top left, so the bottom left pad is row 8, column 1. */
export function padPitch(row: number, col: number, s: ScaleSettings, octave = 0): number {
  const up = 8 - row;
  const across = col - 1;
  const start = gridStart(s, octave);
  const step = ROW[s.layout] ?? ROW['4ths'];
  return s.inKey ? degreeAbove(start, across + up * step.key, s) : start + across + up * step.chromatic;
}

/** The lowest and highest note of the grid. */
export const gridRange = (s: ScaleSettings, octave = 0) => ({ low: padPitch(8, 1, s, octave), high: padPitch(1, 8, s, octave) });

/** Whether the grid can move an octave that way and stay within MIDI's notes. */
export function canShift(s: ScaleSettings, octave: number, by: 1 | -1): boolean {
  const { low, high } = gridRange(s, octave + by);
  return low >= 0 && high <= 127;
}

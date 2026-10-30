// ChordCompass's stories as plain props: ChordCompass.stories.tsx draws them with React's or
// Svelte's `Tree`. A jam on a ii–V–I round the relative minor, in C, bar 3: G7 now, Cmaj7 next.
import { defineFixtures } from '../../../fixtures';
import type { ChordCompassProps, CompassChord } from './ChordCompass.model';

/** Am7 Dm7 G7 Cmaj7 Fmaj7 E7 Am7 E7: the progression a jam sits on (as ChordStrip's). */
export const compassProgression: readonly CompassChord[] = [
  { id: 'am7', name: 'Am7', notes: ['A', 'C', 'E', 'G'], beats: 4 },
  { id: 'dm7', name: 'Dm7', notes: ['D', 'F', 'A', 'C'], beats: 4 },
  { id: 'g7', name: 'G7', notes: ['G', 'B', 'D', 'F'], beats: 4 },
  { id: 'cmaj7', name: 'Cmaj7', notes: ['C', 'E', 'G', 'B'], beats: 4 },
  { id: 'fmaj7', name: 'Fmaj7', notes: ['F', 'A', 'C', 'E'], beats: 4 },
  { id: 'e7', name: 'E7', notes: ['E', 'G♯', 'B', 'D'], beats: 2 },
  { id: 'am7-2', name: 'Am7', notes: ['A', 'C', 'E', 'G'], beats: 4 },
  { id: 'e7-2', name: 'E7', notes: ['E', 'G♯', 'B', 'D'], beats: 2 },
];

/** Bar 3: G7 now, two beats to Cmaj7, following the recorded progression. */
export const chordCompassBoard: ChordCompassProps = { chords: compassProgression, index: 2, keyName: 'C', beatsToNext: 2, follow: 'prog', bassLock: false };

/** The controls, the same in both Storybooks. */
export const chordCompassArgTypes = {
  chords: { control: 'object' },
  index: { control: { type: 'range', min: 0, max: 7, step: 1 } },
  keyName: { control: 'text' },
  beatsToNext: { control: { type: 'number', min: 0 } },
  follow: { control: 'inline-radio', options: ['keys', 'prog'] },
  bassLock: { control: 'boolean' },
  form: { control: 'inline-radio', options: ['wheel', 'dial'] },
  onFollow: { control: false },
  onBassLock: { control: false },
  onPick: { control: false },
} as const;

/** Every story's args by export name. */
export const chordCompassStories = defineFixtures<ChordCompassProps>()({
  Default: { args: chordCompassBoard },
  /** E7 now (a major outside the key), Am7 next across the wheel; following the keys, bass locked, one beat left. */
  EveryState: { args: { ...chordCompassBoard, index: 5, beatsToNext: 1, follow: 'keys', bassLock: true } },
  /** The `dial` form: the wheel alone, G7 and "then Cmaj7" in its hub. */
  Dense: { args: { ...chordCompassBoard, form: 'dial' } },
  /** No progression and no key: the bare wheel. */
  Empty: { args: { chords: [], index: 0, keyName: '' } },
  /** No callbacks: the wheel and its readout read, not pressed. */
  Disabled: { args: chordCompassBoard },
});

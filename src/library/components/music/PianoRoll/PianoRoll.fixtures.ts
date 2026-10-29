// PianoRoll's stories as plain props: PianoRoll.stories.tsx draws them (React or Svelte, by the
// toolbar's Renderer).
import { defineFixtures } from '../../../fixtures';
import type { PianoRollModelProps } from './PianoRoll.model';

/** The controls, the same in both Storybooks. */
export const pianoRollArgTypes = {
  keys: { control: 'object' },
  notes: { control: 'object' },
  from: { control: 'number' },
  to: { control: 'number' },
  beatsPerBar: { control: 'number' },
  playhead: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  disabled: { control: 'boolean' },
} as const;

/** One octave, C4 up to C5, highest pitch first. */
const KEYS = [
  { pitch: 72, label: 'C5', black: false },
  { pitch: 71, label: 'B4', black: false },
  { pitch: 70, label: 'B♭4', black: true },
  { pitch: 69, label: 'A4', black: false },
  { pitch: 67, label: 'G4', black: false },
  { pitch: 65, label: 'F4', black: false },
  { pitch: 64, label: 'E4', black: false },
  { pitch: 60, label: 'C4', black: false },
] as const;

/** A I–vi–IV–V in C, one bar each, the V marked. */
const NOTES = [
  { id: 'c', from: 0, to: 4, pitch: 72, label: 'C', hue: 1 },
  { id: 'a', from: 4, to: 8, pitch: 69, label: 'A', hue: 2 },
  { id: 'f', from: 8, to: 12, pitch: 65, label: 'F', hue: 3 },
  { id: 'g', from: 12, to: 16, pitch: 67, label: 'G', hue: 4, marked: true },
] as const;

export const pianoRollStories = defineFixtures<PianoRollModelProps>()({
  Default: { args: { keys: [...KEYS], notes: [...NOTES], from: 0, to: 16, beatsPerBar: 4, playhead: 0.3 } },
  EveryState: {
    args: {
      keys: [...KEYS],
      notes: [
        ...NOTES,
        { id: 'e', from: 1, to: 2, pitch: 64, label: 'E', hue: 5, emphasis: true },
        { id: 'x', from: 20, to: 21, pitch: 99, label: 'off the keys' },
      ],
      from: 0,
      to: 16,
      beatsPerBar: 4,
      playhead: 0.75,
    },
  },
  Dense: { args: { keys: [...KEYS], notes: [...NOTES], from: 0, to: 16, beatsPerBar: 4 } },
  Empty: { args: { keys: [], notes: [], from: 0, to: 16, beatsPerBar: 4 } },
  Disabled: { args: { keys: [...KEYS], notes: [...NOTES], from: 0, to: 16, beatsPerBar: 4, playhead: 0.5, disabled: true } },
});

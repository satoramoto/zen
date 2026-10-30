// ProgressionStrip's stories as plain props: ProgressionStrip.stories.tsx draws them with React's or
// Svelte's `Tree`. A jam's loop round the relative minor: eight chords over eight bars, with a
// half-bar ii–V into the last bar of Am7.
import { defineFixtures } from '../../../fixtures';
import type { ProgressionChord, ProgressionStripProps } from './ProgressionStrip.model';

export const progressionChords: readonly ProgressionChord[] = [
  { id: 'am7', name: 'Am7', notes: ['A', 'C', 'E', 'G'], beats: 4 },
  { id: 'dm7', name: 'Dm7', notes: ['D', 'F', 'A', 'C'], beats: 4 },
  { id: 'g7', name: 'G7', notes: ['G', 'B', 'D', 'F'], beats: 4 },
  { id: 'cmaj7', name: 'Cmaj7', notes: ['C', 'E', 'G', 'B'], beats: 4 },
  { id: 'fmaj7', name: 'Fmaj7', notes: ['F', 'A', 'C', 'E'], beats: 4 },
  { id: 'bm7b5', name: 'Bm7♭5', notes: ['B', 'D', 'F', 'A'], beats: 2 },
  { id: 'e7', name: 'E7', notes: ['E', 'G♯', 'B', 'D'], beats: 2 },
  { id: 'am7-2', name: 'Am7', notes: ['A', 'C', 'E', 'G'], beats: 8 },
];

/** Bar 3, beat 3: G7 now, Cmaj7 next, Fmaj7 selected for mutation. */
export const progressionBoard: ProgressionStripProps = { chords: progressionChords, index: 2, beat: 10.5, follow: 'live', selected: 'fmaj7' };

/** The controls, the same in both Storybooks. */
export const progressionStripArgTypes = {
  chords: { control: 'object' },
  index: { control: { type: 'range', min: 0, max: 7, step: 1 } },
  beat: { control: { type: 'range', min: 0, max: 32, step: 0.25 } },
  beatsPerBar: { control: { type: 'number', min: 1 } },
  follow: { control: 'inline-radio', options: ['live', 'loop'] },
  selected: { control: 'text' },
  form: { control: 'inline-radio', options: ['full', 'compact'] },
  onFollow: { control: false },
  onSelect: { control: false },
  onMutate: { control: false },
  onKeep: { control: false },
  onRevert: { control: false },
} as const;

/** Every story's args by export name. */
export const progressionStripStories = defineFixtures<ProgressionStripProps>()({
  Default: { args: progressionBoard },
  /** The last chord now, so next wraps to the first; following the loop; the now chord also selected. */
  EveryState: { args: { ...progressionBoard, index: 7, beat: 27.25, follow: 'loop', selected: 'am7-2' } },
  Dense: { args: { ...progressionBoard, index: 5, beat: 20.5, form: 'compact' } },
  /** Half a loop of chords, no voicings: names alone. */
  Sparse: { args: { chords: progressionChords.slice(0, 4).map(({ id, name }) => ({ id, name, beats: 8 })), index: 1, beat: 12 } },
  Empty: { args: { chords: [], index: 0 } },
  Disabled: { args: progressionBoard },
});

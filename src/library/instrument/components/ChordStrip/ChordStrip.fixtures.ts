// ChordStrip's stories as plain props: ChordStrip.stories.tsx draws them (React or Svelte, by the
// toolbar's Renderer); the fixture is shared by every story and by the live story's initial state.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { ChordStripModelProps } from './ChordStrip.model';

/** The controls, the same in both Storybooks. */
export const chordStripArgTypes = {
  index: { control: { type: 'range', min: 0, max: 7, step: 1 } },
  selected: { control: 'text' },
  disabled: { control: 'boolean' },
} as const;

type P = FixtureProps<ChordStripModelProps>;

/** A ii–V–I around the relative minor, the progression a jam sits on. */
const PROGRESSION = [
  { id: 'am7', name: 'Am7', notes: ['A', 'C', 'E', 'G'], beats: 4 },
  { id: 'dm7', name: 'Dm7', notes: ['D', 'F', 'A', 'C'], beats: 4 },
  { id: 'g7', name: 'G7', notes: ['G', 'B', 'D', 'F'], beats: 4 },
  { id: 'cmaj7', name: 'Cmaj7', notes: ['C', 'E', 'G', 'B'], beats: 4 },
  { id: 'fmaj7', name: 'Fmaj7', notes: ['F', 'A', 'C', 'E'], beats: 4 },
  { id: 'e7', name: 'E7', notes: ['E', 'G♯', 'B', 'D'], beats: 2 },
  { id: 'am7-2', name: 'Am7', notes: ['A', 'C', 'E', 'G'], beats: 4 },
  { id: 'e7-2', name: 'E7', notes: ['E', 'G♯', 'B', 'D'], beats: 2 },
] as const;

/** Bar 3 of the progression: G7 now, Cmaj7 next, Cmaj7 selected by the editor. */
export const chordStripBoard: P = { chords: PROGRESSION, index: 2, selected: 'cmaj7' };

export const chordStripStories = defineFixtures<ChordStripModelProps>()({
  Default: { args: chordStripBoard },
  /** The first chord now, the second next, the fourth selected by the editor: idle, now, next and selected in one row. */
  EveryState: { args: { ...chordStripBoard, index: 0, selected: 'cmaj7' } },
  /** Eight blocks at a 900 px window in the compact form (the story wraps it in a compact form scope). */
  Dense: { args: { ...chordStripBoard, index: 4, selected: 'fmaj7' } },
  /** No progression: one quiet well. */
  Empty: { args: { chords: [], index: 0 } },
  /** Read-only: the strip and its actions drawn, every press inert. */
  Disabled: { args: { ...chordStripBoard, disabled: true } },
});

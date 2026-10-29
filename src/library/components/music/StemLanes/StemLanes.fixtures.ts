// StemLanes' stories as plain props: StemLanes.stories.tsx draws them (React or Svelte, by the
// toolbar's Renderer), and the tree snapshot records `stemLanesView` for every instance.
import { defineFixtures } from '../../../fixtures';
import type { LiveCue, LiveStem, LiveWindow } from '../live.model';
import type { StemLanesModelProps } from './StemLanes.model';

/** The controls, the same in both Storybooks. */
export const stemLanesArgTypes = {
  stems: { control: 'object' },
  cues: { control: 'object' },
  window: { control: 'object' },
  position: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  selected: { control: 'text' },
} as const;

/**
 * A lane's envelope: loud through its phrases, quiet between them. Deterministic, so a story
 * always draws the same shape; 44 buckets, left to right, each 0–1.
 */
const peaks = (seed: number, n = 44): readonly number[] =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const body = 0.45 + 0.5 * Math.abs(Math.sin((t * (3 + seed) + seed) * Math.PI));
    const grain = 0.12 * Math.sin(t * 37 + seed * 5);
    const fade = Math.min(1, t * 6, (1 - t) * 6);
    return Math.round(Math.min(1, Math.max(0.04, (body + grain) * fade)) * 100) / 100;
  });

/** Four stems of a song, as a solo looper records them: the bass muted, the vocal soloed. */
export const stems: readonly LiveStem[] = [
  { id: 'drums', name: 'Drums', hue: 1, peaks: peaks(1) },
  { id: 'bass', name: 'Bass', hue: 2, peaks: peaks(2), muted: true },
  { id: 'keys', name: 'Keys', hue: 3, peaks: peaks(3) },
  { id: 'vocal', name: 'Vocal', hue: 4, peaks: peaks(4), soloed: true },
];

/** The song's hot cues: a flag at each section's start. */
export const cues: readonly LiveCue[] = [
  { id: 'intro', label: 'Intro', at: 0.03 },
  { id: 'verse', label: 'Verse', at: 0.3 },
  { id: 'drop', label: 'Drop', at: 0.58 },
  { id: 'out', label: 'Out', at: 0.88 },
];

/** The eight-bar loop the deck is playing. */
export const loopWindow: LiveWindow = { start: 0.18, end: 0.74, bars: 8 };

/** The board: four stems, four cues, an eight-bar window, the playhead a little past the drop. */
export const stemLanesBoard: StemLanesModelProps = {
  stems,
  cues,
  window: loopWindow,
  position: 0.62,
  selected: 'vocal',
};

export const stemLanesStories = defineFixtures<StemLanesModelProps>()({
  Default: { args: stemLanesBoard },
  // The same deck, though the story draws it in all three forms.
  EveryState: { args: stemLanesBoard },
  // The same deck at 900 px, drawn `stacked`: every lane, thinner, cue flags without labels.
  Dense: { args: stemLanesBoard },
  // A deck with nothing loaded: the ruler and the empty face, no lanes.
  Empty: { args: { stems: [], cues: [], position: undefined, window: undefined } },
  // The board with no callbacks: the deck drawn, nothing pressable.
  Disabled: { args: stemLanesBoard },
});

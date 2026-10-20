// ChordReadout's stories as plain props: ChordReadout.stories.tsx draws them in either renderer,
// and the tree snapshot records every instance. The original's fixtures (yahaha/src/ui/NowPlaying/NowPlaying.fixtures.ts),
// copied so the pairs compare one to one.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { ChordReadoutModelProps } from './ChordReadout.model';

type P = FixtureProps<ChordReadoutModelProps>;

/** The args every story starts from (the meta's args in both Storybooks). */
export const chordReadoutArgs = { chord: '', tip: 'fingering.select' } satisfies P;

/** The controls, the same in both Storybooks. */
export const chordReadoutArgTypes = {
  chord: { control: 'text' },
  extension: { control: 'text' },
  notes: { control: 'object' },
  fingering: { control: 'text' },
  held: { control: 'boolean' },
  label: { control: 'text' },
  size: { control: 'text' },
} as const;

const chordBoard = {
  chord: 'Am',
  extension: '7',
  notes: [
    { note: 'A', interval: 'R' },
    { note: 'C', interval: 'm3' },
    { note: 'E', interval: '5' },
    { note: 'G', interval: 'm7' },
  ],
  fingering: 'Fingered On Bass',
  held: false,
} satisfies P;

const chordStopped = {
  chord: 'C',
  extension: 'maj7',
  notes: [
    { note: 'C', interval: 'R' },
    { note: 'E', interval: '3' },
    { note: 'G', interval: '5' },
    { note: 'B', interval: '7' },
  ],
  fingering: 'Fingered',
  held: true,
} satisfies P;

const chordLong = {
  chord: 'C♯m',
  extension: 'maj9(♯11)/G♯',
  notes: [
    { note: 'C♯', interval: 'R' },
    { note: 'E', interval: 'm3' },
    { note: 'G♯', interval: '5' },
    { note: 'C', interval: 'M7' },
    { note: 'D♯', interval: '9' },
    { note: 'G', interval: '♯11' },
  ],
  fingering: 'AI Full Keyboard',
  held: false,
} satisfies P;

const chordLongFingering = {
  ...chordBoard,
  notes: [
    { note: 'A', interval: 'R' },
    { note: 'C', interval: 'm3' },
    { note: 'E', interval: '5' },
    { note: 'G', interval: 'm7' },
    { note: 'B', interval: '9' },
    { note: 'D', interval: '4' },
  ],
  fingering: 'AI Full Keyboard · played Cm7 (Keyboard transpose −3)',
} satisfies P;

const at = (args: P): P => ({ ...chordReadoutArgs, ...args });

export const chordReadoutStories = defineFixtures<ChordReadoutModelProps>()({
  Board: { args: at({ ...chordBoard, label: 'Chord' }) },
  Held: { args: at(chordStopped) },
  Long: { args: at(chordLong) },
  LongFingering: { args: at(chordLongFingering) },
  HeroSize: { args: at({ ...chordBoard, size: 'calc(var(--size-display) * 1.4)' }) },
  Empty: { args: at({ chord: '', notes: [], fingering: 'Fingered' }) },
});

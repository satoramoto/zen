// OrbitClock's stories as plain props: OrbitClock.stories.tsx draws them with React's or Svelte's
// `Tree`. The follow page's five generators on cycles of 4, 3, 2.5, 2 and 1.5 beats, which line up
// every 60 beats (15 bars).
import { defineFixtures } from '../../../fixtures';
import type { LiveTrackRef } from '../live.model';
import type { OrbitClockProps, OrbitGenerator } from './OrbitClock.model';

/**
 * Euclid's rhythm: `hits` onsets spread as evenly as they go over `steps` (Bjorklund by
 * Bresenham). `euclid(5, 8)` is `x.xx.xx.`.
 */
export function euclid(hits: number, steps: number, rotate = 0): number[] {
  const out: number[] = [];
  for (let i = 0; i < steps; i++) {
    if (Math.floor(((i + rotate) * hits) / steps) !== Math.floor(((i + rotate - 1) * hits) / steps)) out.push(i);
  }
  return out;
}

/** The set's eight tracks in their stem inks. */
export const orbitTracks: readonly LiveTrackRef[] = [
  { id: 'drums', name: 'Drums', ink: 'drums' },
  { id: 'bass', name: 'Bass', ink: 'bass' },
  { id: 'keys', name: 'Keys', ink: 'piano' },
  { id: 'vox', name: 'Vox', ink: 'vocals' },
  { id: 'gtr', name: 'Gtr', ink: 'guitar' },
  { id: 'perc', name: 'Perc', ink: 'drums' },
  { id: 'syn', name: 'Syn', ink: 'other' },
  { id: 'fx', name: 'FX', ink: 'other' },
];

export const orbitGenerators: readonly OrbitGenerator[] = [
  { track: 'drums', kind: 'EUCLID', steps: 16, hits: euclid(5, 16), rate: 4, hint: 'E(5,16) · kick' },
  { track: 'perc', kind: 'EUCLID', steps: 12, hits: euclid(7, 12), rate: 4, hint: 'E(7,12) · shaker' },
  { track: 'syn', kind: 'CHANCE', steps: 10, hits: [0, 3, 4, 7, 9], rate: 4, hint: 'markov · 30% rest' },
  { track: 'bass', kind: 'EUCLID', steps: 8, hits: euclid(5, 8), rate: 4, hint: 'E(5,8) · root 5th' },
  { track: 'keys', kind: 'ARP', steps: 6, hits: [0, 1, 2, 3, 4, 5], rate: 4, hint: 'up-down · 3 notes' },
];

/** Eight generators: every track on its own cycle, the rings packed close. */
const crowd: readonly OrbitGenerator[] = [
  ...orbitGenerators,
  { track: 'vox', kind: 'CHANCE', steps: 7, hits: [0, 2, 5], rate: 2, hint: 'chops · 40% rest' },
  { track: 'gtr', kind: 'EUCLID', steps: 9, hits: euclid(4, 9), rate: 4, hint: 'E(4,9) · stabs' },
  { track: 'fx', kind: 'ARP', steps: 5, hits: [0, 4], rate: 2, hint: 'riser · 1/8' },
];

/** The page as the views use it: bar 6, the hands fanned out, Bass selected for the dice. */
export const orbitClockBoard: OrbitClockProps = { generators: orbitGenerators, tracks: orbitTracks, beat: 21.5, chaos: 0.35, chord: 'Am7', selected: 'bass' };

/** The controls, the same in both Storybooks. */
export const orbitClockArgTypes = {
  generators: { control: 'object' },
  tracks: { control: 'object' },
  beat: { control: { type: 'range', min: 0, max: 60, step: 0.25 } },
  chaos: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  chord: { control: 'text' },
  selected: { control: 'select', options: [undefined, ...orbitGenerators.map((g) => g.track)] },
  form: { control: 'inline-radio', options: ['full', 'orbits'] },
  onSelect: { control: false },
  onMutate: { control: false },
  onShake: { control: false },
  onKeep: { control: false },
  onRevert: { control: false },
} as const;

/** Every story's args by export name. */
export const orbitClockStories = defineFixtures<OrbitClockProps>()({
  Default: { args: orbitClockBoard },
  /** Beat 2: Drums, Perc, Bass and Keys on a hit (lit), Syn passing a rest; chaos high. */
  EveryState: { args: { ...orbitClockBoard, beat: 2, chaos: 0.8, chord: 'Fmaj7' } },
  /** Beat 0: every hand at twelve together. */
  Together: { args: { ...orbitClockBoard, beat: 0, chaos: 0, selected: undefined } },
  Crowded: { args: { ...orbitClockBoard, generators: crowd, beat: 13.25, selected: 'gtr' } },
  Dense: { args: { ...orbitClockBoard, form: 'orbits' } },
  Empty: { args: { generators: [], tracks: orbitTracks, beat: 0 } },
  Disabled: { args: { ...orbitClockBoard, selected: undefined } },
});

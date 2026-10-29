// ArpSequencer's stories as plain props: ArpSequencer.stories.tsx draws them (React or Svelte, by
// the toolbar's Renderer); the fixture is shared by every story and by the live story's state.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { ArpStep } from '../live.model';
import type { ArpSequencerModelProps } from './ArpSequencer.model';

/** The controls, the same in both Storybooks. */
export const arpSequencerArgTypes = {
  index: { control: { type: 'range', min: 0, max: 3, step: 1 } },
  disabled: { control: 'boolean' },
  state: { control: 'object' },
  chords: { control: 'object' },
} as const;

type P = FixtureProps<ArpSequencerModelProps>;

/** A step: on or off, its degree into ARP_DEGREES, its velocity, its tie. */
const step = (degree: number, on = true, velocity = 0.7, tie = false): ArpStep => ({ on, degree, velocity, tie });

/** Sixteen steps up and down an Am7: R 3 5 7 9 7 5, twice, with a tie and a rest. */
const STEPS: readonly ArpStep[] = [
  step(0, true, 0.9),
  step(1, true, 0.7),
  step(2, true, 0.8),
  step(3, true, 0.65, true),
  step(4, true, 0.75),
  step(3, true, 0.6),
  step(2, true, 0.7, true),
  step(1, false, 0.5),
  step(0, true, 0.85),
  step(1, true, 0.7),
  step(2, true, 0.75),
  step(3, true, 0.6),
  step(0, true, 0.9, true),
  step(2, true, 0.7),
  step(1, false, 0.5),
  step(0, true, 0.95),
];

/** Every degree once, on and off, a tie from two of them: the grid's whole vocabulary. */
const EVERY: readonly ArpStep[] = [
  step(0, true, 0.2),
  step(1, true, 0.35),
  step(2, true, 0.5),
  step(3, true, 0.65),
  step(4, true, 0.8),
  step(5, true, 0.95),
  step(6, true, 0.4),
  step(7, true, 1),
  step(0, false, 0.5),
  step(1, true, 0.3, true),
  step(2, true, 0.45),
  step(3, false, 0.6),
  step(4, true, 0.75),
  step(5, true, 0.9, true),
  step(6, false, 0.25),
  step(7, true, 0.55),
];

/** Nothing on: the grid's empty arp, root degree and no velocity. */
const OFF: readonly ArpStep[] = Array.from({ length: 16 }, () => step(0, false, 0));

/** The progression the arp follows: Am7, Fmaj7, C, G7. */
const CHORDS = [
  { id: 'am7', name: 'Am7', notes: ['A', 'C', 'E', 'G'], beats: 4 },
  { id: 'fmaj7', name: 'Fmaj7', notes: ['F', 'A', 'C', 'E'], beats: 4 },
  { id: 'c', name: 'C', notes: ['C', 'E', 'G'], beats: 4 },
  { id: 'g7', name: 'G7', notes: ['G', 'B', 'D', 'F'], beats: 4 },
] as const;

/** Am7, updown, two octaves: the arp a jam starts from. */
export const arpSequencerBoard: P = {
  state: { steps: STEPS, mode: 'updown', rate: 0.4, octaves: 2, gate: 0.5, swing: 0.25 },
  chords: CHORDS,
  index: 0,
};

export const arpSequencerStories = defineFixtures<ArpSequencerModelProps>()({
  Default: { args: arpSequencerBoard },
  /** All eight degrees, on and off, ties at two of them and velocities from 0.2 to 1, over the C chord. */
  EveryState: {
    args: { ...arpSequencerBoard, state: { ...arpSequencerBoard.state!, steps: EVERY, mode: 'converge', octaves: 3 }, index: 2 },
  },
  /** The compact form at a 900 px window: no degree labels and no degree readout, the same 16 × 8 grid. */
  Dense: { args: { ...arpSequencerBoard, index: 1 } },
  /** No chord and no step on: the grid at rest, the readout saying it has nothing to follow. */
  Empty: { args: { state: { ...arpSequencerBoard.state!, steps: OFF, mode: 'up', octaves: 1 }, chords: [], index: 0 } },
  /** Read-only: every step, degree, mode and knob drawn, nothing calling back. */
  Disabled: { args: { ...arpSequencerBoard, disabled: true } },
});

// ThrowPads' stories as plain props: ThrowPads.stories.tsx draws them with React's or Svelte's
// `Tree`. A delay throw on the vocal beside a filter sweep on the bass, each with the finger's path.
import { defineFixtures } from '../../../fixtures';
import type { ThrowPad, ThrowPadsProps, ThrowPoint } from './ThrowPads.model';

const path = (...points: [number, number][]): readonly ThrowPoint[] => points.map(([x, y]) => ({ x, y }));

/** A delay throw: a short reach out and back. */
export const THROW_TRAIL = path([0.32, 0.62], [0.4, 0.68], [0.48, 0.74], [0.56, 0.78], [0.64, 0.72], [0.7, 0.66], [0.76, 0.6]);

/** A filter sweep: left and down, then up and right. */
export const FILTER_TRAIL = path([0.08, 0.16], [0.14, 0.24], [0.2, 0.22], [0.27, 0.36], [0.34, 0.33], [0.4, 0.48], [0.46, 0.44], [0.53, 0.6], [0.58, 0.55], [0.62, 0.7]);

export const throwPads: readonly ThrowPad[] = [
  { id: 'delay', name: 'Delay throw', ink: 'vocals', x: 0.76, y: 0.6, xLabel: 'Time', yLabel: 'Feedback', trail: THROW_TRAIL },
  { id: 'filter', name: 'Filter', ink: 'bass', x: 0.62, y: 0.7, xLabel: 'Cutoff', yLabel: 'Resonance', trail: FILTER_TRAIL },
];

/** The controls, the same in both Storybooks. */
export const throwPadsArgTypes = {
  pads: { control: 'object' },
  form: { control: 'inline-radio', options: ['two-up', 'one'] },
  onMove: { control: false },
} as const;

/** Every story's args by export name. */
export const throwPadsStories = defineFixtures<ThrowPadsProps>()({
  Default: { args: { pads: throwPads, form: 'two-up' } },
  /** Corners and no trail: a pad at rest in a corner, one with no ink (the accent). */
  EveryState: {
    args: {
      pads: [
        { id: 'space', name: 'Space', ink: 'drums', x: 0.08, y: 0.92, xLabel: 'Size', yLabel: 'Mix' },
        { id: 'drive', name: 'Drive', x: 0.5, y: 0.5, xLabel: 'Drive', yLabel: 'Tone', trail: FILTER_TRAIL },
      ],
      form: 'two-up',
    },
  },
  Dense: { args: { pads: throwPads, form: 'one' } },
  Empty: { args: { pads: [], form: 'two-up' } },
  Disabled: { args: { pads: throwPads, form: 'two-up' } },
});

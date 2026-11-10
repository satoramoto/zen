// XYPad's stories as plain props: XYPad.stories.tsx draws them (React or Svelte, by the toolbar's
// Renderer), and the tree snapshot records `xyPadView` for every instance.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { XYPadModelProps } from './XYPad.model';

const NONE = 'none';

/** The controls, the same in both Storybooks. */
export const xyPadArgTypes = {
  x: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  y: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  xLabel: { control: 'text' },
  yLabel: { control: 'text' },
  hue: {
    control: 'select',
    options: [NONE, 1, 2, 3, 4, 5],
    mapping: { [NONE]: undefined },
  },
  trail: { control: 'object' },
  form: { control: 'inline-radio', options: ['square', 'wide'] },
  disabled: { control: 'boolean' },
} as const;

type P = FixtureProps<XYPadModelProps>;

/** A filter sweep: left and down, then up and right. */
export const FILTER_TRAIL: readonly (readonly [number, number])[] = [
  [0.08, 0.16],
  [0.14, 0.24],
  [0.2, 0.22],
  [0.27, 0.36],
  [0.34, 0.33],
  [0.4, 0.48],
  [0.46, 0.44],
  [0.53, 0.6],
  [0.58, 0.55],
  [0.62, 0.7],
];

/** A delay throw: a short reach out and back. */
export const THROW_TRAIL: readonly (readonly [number, number])[] = [
  [0.32, 0.62],
  [0.4, 0.68],
  [0.48, 0.74],
  [0.56, 0.78],
  [0.64, 0.72],
  [0.7, 0.66],
  [0.76, 0.6],
];

/** The default pad: filter on x, resonance on y, hue 2, the finger's path behind it. */
export const xyPadBase: P = {
  x: 0.62,
  y: 0.7,
  xLabel: 'Cutoff',
  yLabel: 'Resonance',
  hue: 2,
  trail: FILTER_TRAIL,
  form: 'square',
};

/** Every state: each hue slot, a corner, the middle, no trail and no labels. */
const EVERY: P[] = [
  { ...xyPadBase },
  { x: 0.92, y: 0.9, xLabel: 'Rate', yLabel: 'Depth', hue: 1, trail: THROW_TRAIL },
  { x: 0.08, y: 0.12, xLabel: 'Time', yLabel: 'Feedback', hue: 3, trail: THROW_TRAIL },
  { x: 0.5, y: 0.5, xLabel: 'Drive', yLabel: 'Tone', hue: 4 },
  { x: 0.24, y: 0.78, xLabel: 'Space', yLabel: 'Mix', hue: 5, trail: FILTER_TRAIL },
  { x: 0.42, y: 0.36, xLabel: 'Cutoff', yLabel: 'Resonance', trail: FILTER_TRAIL },
  { x: 0.5, y: 0.5 },
];

export const xyPadStories = defineFixtures<XYPadModelProps>()({
  Default: { args: xyPadBase },
  EveryState: { items: EVERY },
  Dense: { args: { ...xyPadBase, form: 'wide', xLabel: 'Time', yLabel: 'Feedback', hue: 3, trail: THROW_TRAIL } },
  Empty: { args: { x: 0.5, y: 0.5, form: 'square' } },
  Disabled: { args: { ...xyPadBase, disabled: true } },
});

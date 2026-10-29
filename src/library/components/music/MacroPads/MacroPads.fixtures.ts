// MacroPads' stories as plain props: MacroPads.stories.tsx draws them (React or Svelte, by the
// toolbar's Renderer), and the tree snapshot records `macroPadsView` for every instance.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import { FILTER_TRAIL, THROW_TRAIL } from '../XYPad/XYPad.fixtures';
import type { MacroPad, MacroPadsModelProps } from './MacroPads.model';

/** The controls, the same in both Storybooks. */
export const macroPadsArgTypes = {
  pads: { control: 'object' },
  form: { control: 'inline-radio', options: ['two-up', 'one-up'] },
} as const;

type P = FixtureProps<MacroPadsModelProps>;

/** The mockups' pair: a delay throw beside the filter. */
export const MACRO_PADS: readonly MacroPad[] = [
  {
    id: 'fx-a',
    label: 'FX A DELAY THROW',
    xLabel: 'Time',
    yLabel: 'Feedback',
    x: 0.76,
    y: 0.6,
    hue: 2,
    trail: THROW_TRAIL,
  },
  {
    id: 'filter',
    label: 'FILTER / RESONANCE',
    xLabel: 'Cutoff',
    yLabel: 'Resonance',
    x: 0.62,
    y: 0.7,
    hue: 4,
    trail: FILTER_TRAIL,
  },
];

/** Every state: four pads, one per hue slot, each with its own reach. */
const EVERY: readonly MacroPad[] = [
  MACRO_PADS[0],
  MACRO_PADS[1],
  {
    id: 'drive',
    label: 'DRIVE / TONE',
    xLabel: 'Drive',
    yLabel: 'Tone',
    x: 0.3,
    y: 0.42,
    hue: 1,
    trail: FILTER_TRAIL,
  },
  {
    id: 'space',
    label: 'SPACE / MIX',
    xLabel: 'Space',
    yLabel: 'Mix',
    x: 0.58,
    y: 0.28,
    hue: 3,
    trail: THROW_TRAIL,
  },
];

/** Dense: four macros in the `two-up` bank, the pair it is named for over a second pair. */
const DENSE: readonly MacroPad[] = EVERY;

export const macroPadsBase: P = { pads: MACRO_PADS, form: 'two-up' };

export const macroPadsStories = defineFixtures<MacroPadsModelProps>()({
  Default: { args: macroPadsBase },
  EveryState: { args: { pads: EVERY, form: 'two-up' } },
  Dense: { args: { pads: DENSE, form: 'two-up' } },
  Empty: { args: { pads: [], form: 'two-up' } },
  Disabled: { args: { pads: MACRO_PADS.map((pad) => ({ ...pad, disabled: true })), form: 'two-up' } },
});

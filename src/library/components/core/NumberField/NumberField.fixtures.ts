// NumberField's stories as plain props: NumberField.stories.tsx draws them (with either renderer's
// `Tree`), and the tree snapshot (`src/library/view/snapshot.test.ts`) prints every instance.
import { defineFixtures } from '../../../fixtures';
import { enumParam, type Param } from '../Param/param';
import type { NumberFieldModelProps } from './NumberField.model';

export const cutoff: Param = { kind: 'float', min: 20, max: 20000, defaultValue: 1000, unit: 'hertz', exponent: 3, name: 'Cutoff', shortName: 'Freq' };
export const pan: Param = { kind: 'float', min: -1, max: 1, defaultValue: 0, unit: 'pan', name: 'Pan' };
export const voices: Param = { kind: 'int', min: 1, max: 16, defaultValue: 4, unit: 'int', name: 'Voices' };
export const gain: Param = { kind: 'float', min: -70, max: 6, defaultValue: 0, unit: 'decibel', name: 'Gain' };
export const shape = enumParam(['Sine', 'Triangle', 'Saw', 'Square'], { name: 'Shape' });

/** The controls, the same in both renderers. */
export const numberFieldArgTypes = {
  display: { control: 'text' },
  label: { control: 'text' },
  name: { control: 'text' },
  editable: { control: 'boolean' },
  showFill: { control: 'boolean' },
  origin: { control: 'inline-radio', options: ['min', 'center'] },
  width: { control: 'number' },
  disabled: { control: 'boolean' },
} as const;

export const numberFieldStories = defineFixtures<NumberFieldModelProps>()({
  Default: { args: { param: cutoff, value: 1000 } },
  CenterOrigin: { args: { param: pan, value: -0.4 } },
  Integer: { args: { param: voices, value: 6 } },
  Enum: { args: { param: shape, value: 2 } },
  NoFill: { args: { param: gain, value: -12, showFill: false } },
  Display: { args: { param: gain, value: -70, display: '-inf dB' } },
  Disabled: { args: { param: gain, value: -6, disabled: true } },
  /** Every kind side by side, the last at a fixed width (the React story makes them live). */
  Row: {
    items: [
      { param: cutoff, value: 1000 },
      { param: pan, value: 0.5 },
      { param: voices, value: 4 },
      { param: shape, value: 0 },
      { param: gain, value: 0, width: 72 },
    ],
  },
});

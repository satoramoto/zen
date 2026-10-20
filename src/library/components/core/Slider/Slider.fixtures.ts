// Slider's stories as plain props: Slider.stories.tsx draws them (with either renderer's `Tree`),
// and the tree snapshot (`src/library/view/snapshot.test.ts`) prints every instance. The callbacks
// (`onChange`, `keyStep`, `detentLabel`, a `typed` parser) are the stories' own.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { Param } from '../Param/param';
import type { SliderModelProps } from './Slider.model';

/** The controls. */
export const sliderArgTypes = {
  orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
  layout: { control: 'inline-radio', options: ['stacked', 'inline', 'inside', 'row'] },
  side: { control: 'inline-radio', options: ['left', 'right'] },
  origin: { control: 'inline-radio', options: ['min', 'center'] },
  fill: { control: 'boolean' },
  showValue: { control: 'boolean' },
  disabled: { control: 'boolean' },
  length: { control: 'number' },
  width: { control: 'number' },
  live: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  display: { control: 'text' },
  ink: { control: 'text' },
} as const;

export const volume: Param = { kind: 'float', min: -70, max: 6, defaultValue: 0, unit: 'decibel', name: 'Volume', shortName: 'Vol' };
export const pan: Param = { kind: 'float', min: -1, max: 1, defaultValue: 0, unit: 'pan', name: 'Pan' };
export const amount: Param = { kind: 'float', min: 0, max: 100, defaultValue: 50, unit: 'percent', name: 'Amount' };
export const steps: Param = { kind: 'int', min: 0, max: 7, defaultValue: 0, steps: 8, name: 'Step' };
/** A log rail, ¼× to 4× as doublings (−2 to 2) on twelfths, 1× the default in the middle. */
export const tune: Param = { kind: 'float', min: -2, max: 2, defaultValue: 0, steps: 49, name: 'Speed' };
export const doublings = [-2, -1, 0, 1, 2];

/** The volume fader every story starts from. */
const fader: FixtureProps<SliderModelProps> = { param: volume, value: -6, length: 120 };
const row: FixtureProps<SliderModelProps> = { ...fader, layout: 'row', length: 'auto', param: amount, value: 42 };
const detents: FixtureProps<SliderModelProps> = { ...row, param: tune, origin: 'center', value: 0.5, detents: doublings, snap: 1 / 6 };

export const sliderStories = defineFixtures<SliderModelProps>()({
  Vertical: { args: fader },
  Compact: { args: { ...fader, length: undefined } },
  Horizontal: { args: { ...fader, orientation: 'horizontal', param: amount, value: 35 } },
  CenterOrigin: { args: { ...fader, orientation: 'horizontal', param: pan, value: 0.3 } },
  Inline: {
    args: { ...fader, orientation: 'horizontal', layout: 'inline', param: amount },
    items: [
      { side: 'left', value: 60 },
      { side: 'right', value: 20 },
    ],
  },
  Inside: { args: { ...fader, orientation: 'horizontal', layout: 'inside', param: amount, value: 42 } },
  InsideFilled: { args: { ...fader, orientation: 'horizontal', layout: 'inside', param: amount, value: 42, fill: true } },
  Row: { args: row },
  RowCenter: { args: { ...row, param: pan, value: 0.3 } },
  Depth: { args: { ...fader, orientation: 'horizontal', param: amount, value: 40, depth: 0.3, live: 0.55, length: 160 } },
  Stepped: { args: { ...fader, param: steps, value: 3 } },
  DisplayAndInk: { args: { ...fader, display: '-inf dB', value: -70, ink: 'var(--hue-2)' } },
  Mixed: { args: { ...row, param: tune, origin: 'center', value: 0, mixed: true } },
  Detents: { args: detents },
  KeySteps: { args: detents },
  Disabled: { args: { ...fader, disabled: true } },
  AutoLength: { args: { ...fader, orientation: 'horizontal', length: 'auto', param: amount, value: 70 } },
  TypedAndLabelled: { args: { ...detents, value: 0, typed: true } },
  TypedPlain: { args: { ...fader, orientation: 'horizontal', param: amount, value: 35, length: 160, typed: true } },
});

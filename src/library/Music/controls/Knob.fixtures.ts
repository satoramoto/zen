import { defineFixtures } from '../../fixtures';
import type { ParameterHarnessProps } from './KnobHarness.model';
export const knobStories = defineFixtures<ParameterHarnessProps>()({
  Default: { args: {} },
  Disabled: { args: { disabled: true } },
  Bipolar: { args: { param: { kind: 'float', min: -1, max: 1, defaultValue: 0, unit: 'pan', name: 'Pan' }, value: 0 } },
  Tapered: { args: { param: { kind: 'float', min: 20, max: 20000, defaultValue: 1000, exponent: 3, unit: 'hertz', name: 'Freq' }, value: 440 } },
  Inline: { args: { layout: 'inline', side: 'right' } },
});

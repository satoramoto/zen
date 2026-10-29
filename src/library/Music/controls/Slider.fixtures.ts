import { defineFixtures } from '../../fixtures';
import type { ParameterHarnessProps } from './KnobHarness.model';
export const sliderStories = defineFixtures<ParameterHarnessProps>()({
  Default: { args: {} },
  Disabled: { args: { disabled: true } },
  Horizontal: { args: { orientation: 'horizontal', length: 120 } },
  Crossfader: { args: { orientation: 'horizontal', length: 120, param: { kind: 'float', min: -1, max: 1, defaultValue: 0, unit: 'pan', name: 'Crossfade' }, value: 0 } },
  Channel: { args: { length: 180, param: { kind: 'float', min: -70, max: 6, defaultValue: 0, unit: 'decibel', name: 'Gain' }, value: 0 } },
  DrivenRow: { args: { orientation: 'horizontal', layout: 'inside', length: 'auto', depth: 0.3, live: 0.6, driver: 'sine' } },
});

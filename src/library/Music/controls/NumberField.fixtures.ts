import { defineFixtures } from '../../fixtures';
import type { ParameterHarnessProps } from './KnobHarness.model';
export const numberFieldStories = defineFixtures<ParameterHarnessProps>()({
  Default: { args: {} },
  Disabled: { args: { disabled: true } },
  TypedEntry: { args: {} },
  AuthoritativeDisplay: { args: { display: 'Engine value', width: 104 } },
  Integer: { args: { param: { kind: 'int', min: 1, max: 32, defaultValue: 8, name: 'Voices' }, value: 8 } },
});

import { defineFixtures } from '../../fixtures';
import type { PressableHarnessProps } from './ToggleHarness.model';

export const pressableHostStories = defineFixtures<PressableHarnessProps>()({
  Toggle: { args: { control: 'toggle' } },
  Segmented: { args: { control: 'segmented' } },
  Select: { args: { control: 'select' } },
  Momentary: { args: { control: 'momentary', children: 'CUE' } },
});

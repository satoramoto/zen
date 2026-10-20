// StepValue's stories as plain props: StepValue.stories.tsx draws them (with either renderer's
// `Tree`), and the tree snapshot (`src/library/view/snapshot.test.ts`) prints every instance.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { StepValueModelProps } from './StepValue.model';

/** The controls. */
export const stepValueArgTypes = {
  value: { control: 'number' },
  min: { control: 'number' },
  max: { control: 'number' },
  defaultValue: { control: 'number' },
  display: { control: 'text' },
  tag: { control: 'text' },
  hue: { control: 'select', options: ['t', 1, 2, 3, 4, 5] },
  ink: { control: 'select', options: ['a', 't'] },
  dim: { control: 'boolean' },
  disabled: { control: 'boolean' },
  span: { control: 'number' },
  name: { control: 'text' },
  valuetext: { control: 'text' },
  tip: { control: 'text' },
} as const;

/** Right 2's send to the Delay. Every story starts from it. */
const send: FixtureProps<StepValueModelProps> = {
  value: 16,
  min: 0,
  max: 127,
  defaultValue: 0,
  tag: 'R2',
  hue: 2,
  name: 'Right 2 delay send',
  tip: 'fx.send_param',
};

export const stepValueStories = defineFixtures<StepValueModelProps>()({
  Default: { args: send },
  Dim: { args: { ...send, tag: 'R3', hue: 3, value: 0, dim: true, name: 'Right 3 delay send' } },
  TableCell: {
    args: { ...send, tag: undefined, value: 4, min: -12, max: 12, display: '+4', ink: 't', name: 'Band 1 gain', valuetext: '+4 dB', tip: 'fx.master_eq_gain' },
  },
  Disabled: { args: { ...send, disabled: true } },
});

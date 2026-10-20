// BarReadout's stories as plain props: BarReadout.stories.tsx (React) and BarReadout.stories.svelte.ts
// (Svelte) both draw them, and parity.test.tsx renders every instance in both.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { BarReadoutModelProps } from './BarReadout.model';
import { HIGH_STEPS, LOW_STEPS } from './bar';

type P = FixtureProps<BarReadoutModelProps>;

/** The args every story starts from (the meta's args in both Storybooks, beside an `onChange` spy). */
export const barReadoutArgs = {
  label: 'Level',
  value: 90,
  min: 0,
  max: 127,
  default: 100,
  kind: 'number',
  tip: 'mixer.channel.level',
} satisfies P;

/** The controls, the same in both Storybooks. */
export const barReadoutArgTypes = {
  label: { control: 'text' },
  value: { control: 'number' },
  min: { control: 'number' },
  max: { control: 'number' },
  steps: { control: 'object' },
  kind: { control: 'select', options: ['number', 'db', 'ms', 'hz', 'pan', 'offset', 'ratio', 'display'] },
  display: { control: 'text' },
  bipolar: { control: 'boolean' },
  default: { control: 'number' },
  disabled: { control: 'boolean' },
  absent: { control: 'text' },
  waiting: { control: 'boolean' },
  suffix: { control: 'text' },
  name: { control: 'text' },
  tip: { control: 'text' },
} as const;

const at = (args: P): P => ({ ...barReadoutArgs, ...args });

export const barReadoutStories = defineFixtures<BarReadoutModelProps>()({
  Level: { args: at({}) },
  Pan: { args: at({ label: 'Pan', value: 70, default: 64, kind: 'pan', bipolar: true, tip: 'mixer.channel.pan' }) },
  LowFreq: { args: at({ label: 'Low freq', value: 120, min: 32, max: 2000, steps: LOW_STEPS, kind: 'hz', default: 80, tip: undefined }) },
  Display: { args: at({ label: 'Speed', value: 40, default: 64, kind: 'display', display: '0.50 Hz', tip: undefined }) },
  Ratio: { args: at({ label: 'Ratio', value: 30, min: 10, max: 200, default: 30, kind: 'ratio', tip: undefined }) },
  Waiting: { args: at({ waiting: true }) },
  Disabled: { args: at({ label: 'Send 5', value: 0, default: 0, disabled: true, absent: 'not added', tip: undefined }) },
  /** A group as the Channel page stacks it, so the values line up on their last digit. */
  Group: {
    items: [
      { label: 'Level', value: 90, min: 0, max: 127, default: 100 },
      { label: 'Pan', value: 52, min: 0, max: 127, default: 64, kind: 'pan', bipolar: true },
      { label: 'Gain', value: -18, min: -48, max: 0, default: 0, kind: 'db' },
      { label: 'High freq', value: 8000, min: 500, max: 16000, steps: HIGH_STEPS, kind: 'hz', default: 4000 },
      { label: 'Attack', value: 12, min: 0, max: 40, default: 1, kind: 'ms' },
      { label: 'Transpose', value: 76, min: 0, max: 127, default: 64, kind: 'offset', bipolar: true, waiting: true },
      { label: 'Send 5', value: 0, min: 0, max: 127, default: 0, disabled: true, absent: 'not added' },
    ],
  },
});

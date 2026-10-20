// Readout's stories as plain props: Readout.stories.tsx draws them (with either renderer's `Tree`),
// and the tree snapshot (`src/library/view/snapshot.test.ts`) prints every instance.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { ReadoutModelProps } from './Readout.model';

/** The controls. */
export const readoutArgTypes = {
  label: { control: 'text' },
  value: { control: 'number' },
  min: { control: 'number' },
  max: { control: 'number' },
  defaultValue: { control: 'number' },
  display: { control: 'text' },
  code: { control: 'text' },
  disabled: { control: 'boolean' },
  name: { control: 'text' },
  tip: { control: 'text' },
} as const;

/** The board's Delay Feedback: 38% of 0–90, on K6. Every story starts from it. */
const feedback: FixtureProps<ReadoutModelProps> = {
  label: 'Feedback',
  value: 38,
  min: 0,
  max: 90,
  defaultValue: 38,
  display: '38%',
  code: 'K6',
  tip: 'fx.param.delay_feedback',
};

export const readoutStories = defineFixtures<ReadoutModelProps>()({
  Default: { args: feedback },
  WithUnit: { args: { ...feedback, label: 'Tone', value: 50, min: 10, max: 200, defaultValue: 50, display: '5.0 kHz', code: 'K7', tip: 'fx.param.delay_tone' } },
  NoCode: { args: { ...feedback, label: 'Band send', value: 0, min: 0, max: 127, defaultValue: 0, display: '0%', code: '', tip: 'fx.variation_band' } },
  Disabled: { args: { ...feedback, disabled: true } },
  /** A page of parameters (the Column story's rows): knob codes, bars and numbers line up. */
  Column: {
    args: feedback,
    items: [
      {},
      { label: 'Tone', value: 50, min: 10, max: 200, display: '5.0 kHz', code: 'K7' },
      { label: 'Time', value: 9, min: 0, max: 20, display: '1/8', code: 'K8' },
      { label: 'Band send', value: 0, display: '0%', code: '' },
    ],
  },
});

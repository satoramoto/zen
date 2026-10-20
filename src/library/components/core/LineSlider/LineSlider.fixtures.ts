// LineSlider's stories as plain props: LineSlider.stories.tsx (React) and
// LineSlider.stories.svelte.ts (Svelte) both draw them, and the parity test renders every instance in both.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { LineSliderModelProps } from './LineSlider.model';

/** The controls, the same in both Storybooks. */
export const lineSliderArgTypes = {
  value: { control: 'number' },
  min: { control: 'number' },
  max: { control: 'number' },
  step: { control: 'number' },
  name: { control: 'text' },
  valueText: { control: 'text' },
  unit: { control: 'text' },
  width: { control: 'number' },
  disabled: { control: 'boolean' },
  tip: { control: 'text' },
} as const;

/** The Chord page's Chord settle: 10 ms of 0–30. Every story starts from it. */
const settle: FixtureProps<LineSliderModelProps> = {
  value: 10,
  min: 0,
  max: 30,
  step: 1,
  name: 'Chord settle',
  unit: 'ms',
  tip: 'settings.chord_settle',
};

export const lineSliderStories = defineFixtures<LineSliderModelProps>()({
  Board: { args: settle },
  AtMax: { args: { ...settle, value: 30 } },
  ValueText: {
    args: { ...settle, value: 5, min: 0, max: 10, step: 0.5, name: 'Fade in', valueText: '5.0', unit: 's', tip: 'settings.fade_in' },
  },
  Disabled: { args: { ...settle, disabled: true } },
  AtMin: { args: { ...settle, value: 0 } },
  /** The Settings column's rows at their starting values (the React story makes them live). */
  SettingsColumn: {
    items: [
      { name: 'Chord settle', value: 10, max: 30, unit: 'ms' },
      { name: 'Fade in', value: 5, max: 10, step: 0.5, valueText: '5.0', unit: 's' },
      { name: 'Swing', value: 54, min: 50, max: 75, unit: '%' },
    ],
  },
});

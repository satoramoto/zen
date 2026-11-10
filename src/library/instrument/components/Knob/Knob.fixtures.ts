// Knob's stories as plain props: Knob.stories.tsx (React) and Knob.stories.svelte.ts (Svelte) both
// draw them, and parity.test.tsx renders every instance in both.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { KnobModelProps } from './Knob.model';

/** The controls, the same in both Storybooks. */
export const knobArgTypes = {
  label: { control: 'text' },
  code: { control: 'text' },
  value: { control: 'text' },
  unit: { control: 'text' },
  fraction: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  unused: { control: 'boolean' },
  hue: { control: 'select', options: [undefined, 1, 2, 3, 4, 5] },
  name: { control: 'text' },
  tip: { control: 'text' },
} as const;

/** Knob 1 on the board, the args every story starts from. */
const board: FixtureProps<KnobModelProps> = {
  label: 'Dynamics',
  code: 'DynCtrl',
  value: '127',
  unit: '',
  fraction: 1,
  unused: false,
  tip: 'knobs.knob',
};

export const knobStories = defineFixtures<KnobModelProps>()({
  Board: { args: board },
  Partial: { args: { ...board, label: 'Retrig rate', code: 'RtgRate', value: '1/8', fraction: 0.4 } },
  Unit: { args: { ...board, label: 'Swing', code: 'Swing', value: '0', unit: '%', fraction: 0 } },
  Unused: { args: { ...board, label: '---', code: '', value: '', fraction: 0, unused: true } },
  Hue: { args: { ...board, label: 'Retrig rate', code: 'RtgRate', value: '1/8', fraction: 0.4, hue: 2 } },
  BoardRow: {
    args: board,
    items: [
      { label: 'Dynamics', code: 'DynCtrl', value: '127', fraction: 1 },
      { label: 'Retrig rate', code: 'RtgRate', value: '1/8', fraction: 0.4 },
      { label: 'Swing', code: 'Swing', value: '0', unit: '%', fraction: 0 },
      { label: 'Cutoff', code: 'Cutoff', value: '64', fraction: 0.5 },
      { label: 'Resonance', code: 'Reso', value: 'Off', fraction: 0 },
      { label: 'Attack', code: 'EGAtk', value: '12', fraction: 0.1 },
      { label: '---', code: '', value: '', fraction: 0, unused: true },
      { label: '---', code: '', value: '', fraction: 0, unused: true },
    ],
  },
});

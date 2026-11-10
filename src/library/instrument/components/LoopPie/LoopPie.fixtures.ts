// LoopPie's stories as plain props: LoopPie.stories.tsx draws them (React or Svelte, by the
// toolbar's Renderer).
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { LoopPieModelProps } from './LoopPie.model';

/** The controls, the same in both Storybooks. */
export const loopPieArgTypes = {
  phase: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  bars: { control: 'number' },
  recording: { control: 'boolean' },
  hue: { control: 'select', options: ['none', 1, 2, 3, 4, 5], mapping: { none: undefined } },
  label: { control: 'text' },
  disabled: { control: 'boolean' },
} as const;

type P = FixtureProps<LoopPieModelProps>;

export const loopPieStories = defineFixtures<LoopPieModelProps>()({
  Default: { args: { phase: 0.62, hue: 2 } },
  EveryState: {
    items: [
      { phase: 0 },
      { phase: 0.25, hue: 1 },
      { phase: 0.62, hue: 2 },
      { phase: 0.9, hue: 3 },
      { phase: 1, hue: 4 },
      { phase: 0.4, hue: 5, recording: true, bars: 4 },
      { phase: 0.75, label: '8' },
    ] as P[],
  },
  Dense: { args: { phase: 0.3, hue: 3 } },
  Empty: { args: { phase: 0 } },
  Disabled: { args: { phase: 0.5, hue: 2, disabled: true } },
});

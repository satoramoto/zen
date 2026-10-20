// TempoReadout's stories as plain props: TempoReadout.stories.tsx (React) and
// TempoReadout.stories.svelte.ts (Svelte) both draw them, and parity.test.tsx renders every one in both.
import { defineFixtures } from '../../../fixtures';
import type { TempoReadoutModelProps } from './TempoReadout.model';

/** The controls, the same in both Storybooks. */
export const tempoReadoutArgTypes = {
  bpm: { control: { type: 'number', min: 5, max: 500, step: 1 } },
  unit: { control: 'text' },
  min: { control: { type: 'number', min: 5, max: 500, step: 1 } },
  max: { control: { type: 'number', min: 5, max: 500, step: 1 } },
  cells: { control: 'boolean' },
  unitLarge: { control: 'boolean' },
  size: { control: 'text' },
} as const;

/** The size container the Cells stories sit in. */
export const CELLS_BOX = { width: 360, height: 80 };

export const tempoReadoutStories = defineFixtures<TempoReadoutModelProps>()({
  Board: { args: { bpm: 104, unit: 'BPM', min: 5, max: 500 } },
  AtMax: { args: { bpm: 500, unit: 'BPM', min: 5, max: 500 } },
  Slow: { args: { bpm: 68, unit: 'BPM', min: 5, max: 500 } },
  HeroSize: { args: { bpm: 104, unit: 'BPM', min: 5, max: 500, size: 'var(--size-display)' } },
  // Each Storybook draws these inside a CELLS_BOX size container.
  Cells: { args: { bpm: 104, unit: 'BPM', min: 5, max: 500, cells: true } },
  CellsUnitLarge: { args: { bpm: 104, unit: 'BPM', min: 5, max: 500, cells: true, unitLarge: true } },
});

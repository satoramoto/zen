// OneTouchPicker's stories as plain props: OneTouchPicker.stories.tsx (React) and
// OneTouchPicker.stories.svelte.ts (Svelte) both draw them, and the parity test renders every
// instance in both.
import { defineFixtures } from '../../fixtures';
import type { OneTouchPickerProps } from './OneTouchPicker.model';

/** The controls, the same in both Storybooks. */
export const oneTouchPickerArgTypes = {
  applied: { control: { type: 'inline-radio' }, options: [0, 1, 2, 3, 4] },
  count: { control: { type: 'number', min: 0, max: 4, step: 1 } },
  numbers: { control: { type: 'number', min: 1, max: 4, step: 1 } },
  label: { control: 'text' },
  orientation: { control: { type: 'inline-radio' }, options: ['horizontal', 'vertical'] },
  cells: { control: 'boolean' },
  hue: { control: { type: 'inline-radio' }, options: ['neutral', 'a'] },
  name: { control: 'text' },
} as const;

/** The cells stories' parent: a five-cell grid standing in for the original's GoldenGrid, the group role on it. */
export const CELLS_GRID = { name: 'One Touch Setting (OTS)', columns: 5, width: 610, height: 55 } as const;

export const oneTouchPickerStories = defineFixtures<OneTouchPickerProps>()({
  Board: { args: { applied: 2 } },
  NoneApplied: { args: { applied: 0 } },
  Vertical: { args: { applied: 2, orientation: 'vertical' } },
  Cells: { args: { applied: 2, count: 3, cells: true } },
  CellsViolet: { args: { applied: 2, count: 4, cells: true, hue: 'a' } },
  TwoSettings: { args: { applied: 1, count: 2 } },
});

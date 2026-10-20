// OneTouchPicker's stories as plain props: OneTouchPicker.stories.tsx draws them with either
// renderer's `Tree`, and the tree snapshot prints every instance. The cells stories draw the
// picker's roots inside a stand-in grid (`oneTouchCellsSample`).
import { defineFixtures } from '../../fixtures';
import { h, styleText, type Handlers, type Node } from '../../view/Tree.model';
import { oneTouchPickerHandlers, oneTouchPickerView, type OneTouchPickerProps } from './OneTouchPicker.model';

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

/** A cells story: the picker's roots in the `CELLS_GRID` grid, the group role on the grid. */
export function oneTouchCellsSample(args: OneTouchPickerProps): { tree: Node; handlers: Handlers } {
  const grid = h(
    'div',
    {
      role: 'group',
      'aria-label': CELLS_GRID.name,
      style: styleText({
        display: 'grid',
        'grid-template-columns': `repeat(${CELLS_GRID.columns}, 1fr)`,
        gap: 'var(--space-1)',
        width: `${CELLS_GRID.width}px`,
        height: `${CELLS_GRID.height}px`,
      }),
    },
    oneTouchPickerView(args),
  );
  return { tree: grid, handlers: oneTouchPickerHandlers(args) };
}

export const oneTouchPickerStories = defineFixtures<OneTouchPickerProps>()({
  Board: { args: { applied: 2 } },
  NoneApplied: { args: { applied: 0 } },
  Vertical: { args: { applied: 2, orientation: 'vertical' } },
  Cells: { args: { applied: 2, count: 3, cells: true } },
  CellsViolet: { args: { applied: 2, count: 4, cells: true, hue: 'a' } },
  TwoSettings: { args: { applied: 1, count: 2 } },
});

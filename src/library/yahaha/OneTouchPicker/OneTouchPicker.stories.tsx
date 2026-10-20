import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { OneTouchPicker } from './OneTouchPicker';
import { CELLS_GRID, oneTouchPickerArgTypes, oneTouchPickerStories as s } from './OneTouchPicker.fixtures';

// Every story's args come from OneTouchPicker.fixtures.ts, which the Svelte stories and the parity test share.
const meta = {
  title: 'Yahaha/Primitives/OneTouchPicker',
  component: OneTouchPicker,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onApply: fn() },
  argTypes: oneTouchPickerArgTypes,
} satisfies Meta<typeof OneTouchPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A five-cell grid standing in for the original's GoldenGrid: the group role lives on the grid. */
const grid: Decorator = (Story) => (
  <div
    role="group"
    aria-label={CELLS_GRID.name}
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${CELLS_GRID.columns}, 1fr)`,
      gap: 'var(--space-1)',
      width: CELLS_GRID.width,
      height: CELLS_GRID.height,
    }}
  >
    <Story />
  </div>
);

/** The board: One Touch 2 applied, in primary ink with the style's 2px rule along its foot. */
export const Board: Story = {
  args: s.Board.args,
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    await expect(buttons.map((b) => b.getAttribute('data-face'))).toEqual(['off', 'chosen', 'off', 'off']);
    await expect(buttons[1]).toHaveAttribute('aria-pressed', 'true');
  },
};

/** None applied: every number an equal outlined cell. */
export const NoneApplied: Story = { args: s.NoneApplied.args };

/** Vertical, as in the golden Stage's One Touch block: the caption on top, the strip under it. */
export const Vertical: Story = {
  args: s.Vertical.args,
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    await expect(buttons[1]).toHaveAttribute('aria-pressed', 'true');
    await expect(canvasElement.querySelector('.yh-onetouchpicker')).toHaveAttribute('data-orientation', 'vertical');
  },
};

/** Cells in a 5-cell grid: no wrapper, the caption flush left, 2 applied, 4 past the style's three settings disabled. */
export const Cells: Story = {
  args: s.Cells.args,
  decorators: [grid],
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole('group', { name: 'One Touch Setting (OTS)' });
    const items = [...group.children];
    await expect(items).toHaveLength(5);
    await expect(items[0]).toHaveTextContent('One Touch');
    await expect(items[0].tagName).toBe('SPAN');
    const numbers = within(group).getAllByRole('button');
    await expect(numbers.map((b) => b.getAttribute('data-face'))).toEqual(['off', 'on', 'off', 'disabled']);
    await expect(numbers[3]).toBeDisabled();
  },
};

/** Cells in the style's own colour (`hue` a): outlined in it, the applied one marked by its rule, not filled. */
export const CellsViolet: Story = {
  args: s.CellsViolet.args,
  decorators: [grid],
  play: async ({ canvasElement }) => {
    const numbers = within(canvasElement).getAllByRole('button');
    for (const n of numbers) await expect(n).toHaveAttribute('data-ink', 'a');
    await expect(numbers[1]).toHaveAttribute('data-face', 'on');
  },
};

/** A style with two One Touch settings: 3 and 4 disabled. */
export const TwoSettings: Story = {
  args: s.TwoSettings.args,
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    await expect(buttons.map((b) => (b as HTMLButtonElement).disabled)).toEqual([false, false, true, true]);
  },
};

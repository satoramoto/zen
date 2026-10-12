import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { OneTouchPicker } from './OneTouchPicker';

const meta = {
  title: 'Yahaha/Primitives/OneTouchPicker',
  component: OneTouchPicker,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onApply: fn() },
  argTypes: {
    applied: { control: { type: 'inline-radio' }, options: [0, 1, 2, 3, 4] },
    count: { control: { type: 'number', min: 0, max: 4, step: 1 } },
    numbers: { control: { type: 'number', min: 1, max: 4, step: 1 } },
    label: { control: 'text' },
    orientation: { control: { type: 'inline-radio' }, options: ['horizontal', 'vertical'] },
    cells: { control: 'boolean' },
    hue: { control: { type: 'inline-radio' }, options: ['neutral', 'a'] },
    name: { control: 'text' },
  },
} satisfies Meta<typeof OneTouchPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A five-cell grid standing in for the original's GoldenGrid: the group role lives on the grid. */
const grid: Decorator = (Story) => (
  <div
    role="group"
    aria-label="One Touch Setting (OTS)"
    style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-1)', width: 610, height: 55 }}
  >
    <Story />
  </div>
);

/** The board: One Touch 2 applied, in primary ink with the style's 2px rule along its foot. */
export const Board: Story = {
  args: { applied: 2 },
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    await expect(buttons.map((b) => b.getAttribute('data-face'))).toEqual(['off', 'chosen', 'off', 'off']);
    await expect(buttons[1]).toHaveAttribute('aria-pressed', 'true');
  },
};

/** None applied: every number an equal outlined cell. */
export const NoneApplied: Story = { args: { applied: 0 } };

/** Vertical, as in the golden Stage's One Touch block: the caption on top, the strip under it. */
export const Vertical: Story = {
  args: { applied: 2, orientation: 'vertical' },
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    await expect(buttons[1]).toHaveAttribute('aria-pressed', 'true');
    await expect(canvasElement.querySelector('.yh-onetouchpicker')).toHaveAttribute('data-orientation', 'vertical');
  },
};

/** Cells in a 5-cell grid: no wrapper, the caption flush left, 2 applied, 4 past the style's three settings disabled. */
export const Cells: Story = {
  args: { applied: 2, count: 3, cells: true },
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
  args: { applied: 2, count: 4, cells: true, hue: 'a' },
  decorators: [grid],
  play: async ({ canvasElement }) => {
    const numbers = within(canvasElement).getAllByRole('button');
    for (const n of numbers) await expect(n).toHaveAttribute('data-ink', 'a');
    await expect(numbers[1]).toHaveAttribute('data-face', 'on');
  },
};

/** A style with two One Touch settings: 3 and 4 disabled. */
export const TwoSettings: Story = {
  args: { applied: 1, count: 2 },
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    await expect(buttons.map((b) => (b as HTMLButtonElement).disabled)).toEqual([false, false, true, true]);
  },
};

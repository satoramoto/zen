import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, treeStory, withRenderer } from '../../stories/story';
import { OneTouchPicker } from './OneTouchPicker';
import OneTouchPickerSvelte from './OneTouchPicker.svelte';
import { oneTouchCellsSample, oneTouchPickerArgTypes, oneTouchPickerStories as s } from './OneTouchPicker.fixtures';
import type { OneTouchPickerProps } from './OneTouchPicker.model';

// Every story is built from OneTouchPicker.fixtures.ts (`story(s.Name)`), which the tree snapshot
// shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`. The cells stories are
// the picker's roots in a stand-in grid (`oneTouchCellsSample`). The plays are the behaviours.
const meta = {
  title: 'Yahaha/Primitives/OneTouchPicker',
  component: OneTouchPicker,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onApply: fn(), tipAction: fn() },
  argTypes: oneTouchPickerArgTypes,
} satisfies Meta<typeof OneTouchPicker>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(OneTouchPicker, OneTouchPickerSvelte);
/** A cells story's drawing: the picker's roots in the five-cell grid. */
const inGrid = treeStory<OneTouchPickerProps>(oneTouchCellsSample);

/** The board: One Touch 2 applied, in primary ink with the style's 2px rule along its foot. */
export const Board: Story = {
  ...story(s.Board),
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    await expect(buttons.map((b) => b.getAttribute('data-face'))).toEqual(['off', 'chosen', 'off', 'off']);
    await expect(buttons[1]).toHaveAttribute('aria-pressed', 'true');
  },
};

/** None applied: every number an equal outlined cell. */
export const NoneApplied: Story = story(s.NoneApplied);

/** Vertical, as in the golden Stage's One Touch block: the caption on top, the strip under it. */
export const Vertical: Story = {
  ...story(s.Vertical),
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    await expect(buttons[1]).toHaveAttribute('aria-pressed', 'true');
    await expect(canvasElement.querySelector('.yh-onetouchpicker')).toHaveAttribute('data-orientation', 'vertical');
  },
};

/** Cells in a 5-cell grid: no wrapper, the caption flush left, 2 applied, 4 past the style's three settings disabled. */
export const Cells: Story = {
  ...story(s.Cells, inGrid),
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
  ...story(s.CellsViolet, inGrid),
  play: async ({ canvasElement }) => {
    const numbers = within(canvasElement).getAllByRole('button');
    for (const n of numbers) await expect(n).toHaveAttribute('data-ink', 'a');
    await expect(numbers[1]).toHaveAttribute('data-face', 'on');
  },
};

/** A style with two One Touch settings: 3 and 4 disabled. */
export const TwoSettings: Story = {
  ...story(s.TwoSettings),
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    await expect(buttons.map((b) => (b as HTMLButtonElement).disabled)).toEqual([false, false, true, true]);
  },
};

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { Segmented, type SegmentedProps } from './Segmented';
import SegmentedSvelte from './Segmented.svelte';
import { segmentedArgTypes, segmentedStories as s } from './Segmented.fixtures';

// Every story is built from Segmented.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React's or Svelte's `Tree`. The plays are the behaviours.

const meta = {
  title: 'Design OS/Components/Core/Segmented',
  component: Segmented,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { ...(s.Horizontal.args as SegmentedProps), onChange: fn() },
  argTypes: segmentedArgTypes,
} satisfies Meta<typeof Segmented>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Segmented, SegmentedSvelte);

/** Horizontal, drawn by the tabs materials like layout Tabs. → asks for the next member; a click picks one. */
export const Horizontal: Story = {
  ...story(s.Horizontal),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radiogroup', { name: 'Filter' })).toBeInTheDocument();
    const radios = canvas.getAllByRole('radio');
    await expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    radios[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onChange).toHaveBeenLastCalledWith(1);
    await userEvent.click(canvas.getByRole('radio', { name: 'HP' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(2);
  },
};

/** Vertical: the same track standing up; ↓ and ↑ move. */
export const Vertical: Story = story(s.Vertical);

/** Glyph members named for a screen reader: "s" is read as "seconds". */
export const ItemLabels: Story = {
  ...story(s.ItemLabels),
  play: async ({ canvasElement }) => {
    const seconds = within(canvasElement).getByRole('radio', { name: 'seconds' });
    await expect(seconds).toHaveTextContent('s');
    await expect(seconds).toHaveAttribute('aria-checked', 'false');
  },
};

/** With a caption (`name`). */
export const Captioned: Story = story(s.Captioned);

/** Disabled: shown, nothing moves. */
export const Disabled: Story = {
  ...story(s.Disabled),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radiogroup')).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(canvas.getByRole('radio', { name: 'HP' }));
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/** Each system draws the chosen segment from its tabs materials. visual[flow]: type, the chosen
 *  one underlined straight in the accent (decision 68). */
export const VisualsUnderline: Story = {
  ...story(s.VisualsUnderline),
  name: 'visual[flow] (underline)',
  globals: { theme: 'visuals' },
  play: async ({ canvasElement }) => {
    const chosen = within(canvasElement).getByRole('radio', { name: 'Home' });
    // A straight line: the underline is an inset shadow on an unrounded segment.
    await expect(getComputedStyle(chosen).borderTopLeftRadius).toBe('0px');
  },
};

/** Ableton: printed labels, the chosen one underlined in ink. */
export const AbletonUnderline: Story = { ...story(s.Themed), name: 'Ableton (underline)', globals: { theme: 'ableton' } };

/** Elektron: a square filled block. */
export const ElektronBlock: Story = { ...story(s.Themed), name: 'Elektron (filled block)', globals: { theme: 'elektron' } };

/** Linear: a raised chip in a sunk track. */
export const LinearChip: Story = { ...story(s.Themed), name: 'Linear (segmented chip)', globals: { theme: 'linear' } };

/** yahaha classic: hardware selector, the chosen key raised in a well. */
export const HardwareKey: Story = { ...story(s.Themed), name: 'yahaha classic (raised key in a well)', globals: { theme: 'yahaha-classic' } };

/**
 * Live: controlled by its parent; focus follows the choice as the arrows move it. Its own React
 * `render` (live state), so it stays React-only.
 */
export const Live: Story = {
  render: function LiveSegmented(args) {
    const [index, setIndex] = useState(args.index);
    return <Segmented {...args} index={index} onChange={(next) => (setIndex(next), args.onChange(next))} />;
  },
};

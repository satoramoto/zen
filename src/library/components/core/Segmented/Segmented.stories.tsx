import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Segmented } from './Segmented';

const meta = {
  title: 'Design OS/Components/Core/Segmented',
  component: Segmented,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { items: ['LP', 'BP', 'HP'], index: 0, label: 'Filter', onChange: fn() },
  argTypes: {
    index: { control: { type: 'number', min: 0 } },
    label: { control: 'text' },
    name: { control: 'text' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    disabled: { control: 'boolean' },
    title: { control: 'text' },
    hint: { control: 'text' },
  },
} satisfies Meta<typeof Segmented>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Horizontal, drawn by the tabs materials like layout Tabs. → asks for the next member; a click picks one. */
export const Horizontal: Story = {
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
export const Vertical: Story = {
  args: { items: ['up', 'down', 'up-down', 'random'], index: 2, label: 'Direction', name: 'Direction', orientation: 'vertical' },
};

/** Glyph members named for a screen reader: "s" is read as "seconds". */
export const ItemLabels: Story = {
  args: { items: ['s', 'bar', 'beat'], itemLabels: ['seconds', 'bars', 'beats'], index: 1, label: 'Unit' },
  play: async ({ canvasElement }) => {
    const seconds = within(canvasElement).getByRole('radio', { name: 'seconds' });
    await expect(seconds).toHaveTextContent('s');
    await expect(seconds).toHaveAttribute('aria-checked', 'false');
  },
};

/** With a caption (`name`). */
export const Captioned: Story = {
  args: { name: 'Filter', label: undefined },
};

/** Disabled: shown, nothing moves. */
export const Disabled: Story = {
  args: { disabled: true, index: 1 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radiogroup')).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(canvas.getByRole('radio', { name: 'HP' }));
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/** Live: controlled by its parent; focus follows the choice as the arrows move it. */
export const Live: Story = {
  render: function LiveSegmented(args) {
    const [index, setIndex] = useState(args.index);
    return <Segmented {...args} index={index} onChange={(next) => (setIndex(next), args.onChange(next))} />;
  },
};

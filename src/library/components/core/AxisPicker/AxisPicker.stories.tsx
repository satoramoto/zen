import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Text } from '../../../primitives/Text';
import { AxisPicker, type AxisPickerProps } from './AxisPicker';

const MEASURES = ['Speed', 'Brightness', 'Density', 'Swing'];

const meta = {
  title: 'Design OS/Components/Core/AxisPicker',
  component: AxisPicker,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { items: MEASURES, index: 0, label: 'Across', onChange: fn() },
  argTypes: {
    index: { control: { type: 'number', min: 0 } },
    label: { control: 'text' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    low: { control: 'text' },
    high: { control: 'text' },
    disabled: { control: 'boolean' },
    title: { control: 'text' },
  },
} satisfies Meta<typeof AxisPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A box standing in for the plot: an edge in the border ink, no meaning of its own. */
const plot = {
  boxSizing: 'border-box',
  border: 'var(--border-width) solid var(--border)',
  borderRadius: 'var(--radius-control)',
} as const;

/** Held in the story, the way a host holds it; every change also reaches the `onChange` arg. */
function Live(props: AxisPickerProps) {
  const [index, setIndex] = useState(props.index);
  return <AxisPicker {...props} index={index} onChange={(next) => (setIndex(next), props.onChange(next))} />;
}

/** Under a plot: "slow" at the left, the measure centred, "fast" at the right, the row the plot's width. */
export const Horizontal: Story = {
  args: { low: 'slow', high: 'fast' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--space-2)', width: 'calc(var(--control-h) * 10)' }}>
      <div style={{ ...plot, aspectRatio: '3 / 2' }} />
      <Live {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const chip = canvas.getByRole('combobox', { name: 'Across' });
    await expect(chip).toHaveTextContent('Speed');
    await expect(canvas.getByText('slow')).toBeInTheDocument();
    await expect(canvas.getByText('fast')).toBeInTheDocument();
    chip.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(args.onChange).toHaveBeenLastCalledWith(1);
    await expect(chip).toHaveTextContent('Brightness');
  },
};

/** Along a plot's left edge: "bright" at the top, "dark" at the bottom, the measure reading bottom to top. */
export const Vertical: Story = {
  args: { orientation: 'vertical', label: 'Up', low: 'dark', high: 'bright', index: 1 },
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--space-2)', height: 'calc(var(--control-h) * 8)' }}>
      <Live {...args} />
      <div style={{ ...plot, aspectRatio: '1 / 1', height: '100%' }} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const chip = within(canvasElement).getByRole('combobox', { name: 'Up' });
    await expect(chip.closest('[data-part="root"]')).toHaveAttribute('data-orientation', 'vertical');
    await userEvent.click(chip);
    const list = await within(canvasElement.ownerDocument.body).findByRole('listbox', { name: 'Up' });
    await userEvent.click(within(list).getByRole('option', { name: 'Density' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(2);
    await waitFor(() => expect(chip).toHaveAttribute('aria-expanded', 'false'));
  },
};

/** In a title row: no ends, just the chip, its own width, beside the title. */
export const InATitleRow: Story = {
  args: { label: 'Colour', index: 3 },
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <Text role="heading">Presets by</Text>
      <Live {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const chip = within(canvasElement).getByRole('combobox', { name: 'Colour' });
    await expect(chip.closest('[data-part="root"]')).toHaveAttribute('data-bare');
    chip.focus();
    await userEvent.keyboard('{Enter}');
    await expect(chip).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Home}{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(0);
    await expect(chip).toHaveTextContent('Speed');
  },
};

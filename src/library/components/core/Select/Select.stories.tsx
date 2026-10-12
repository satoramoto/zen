import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Select } from './Select';

const MODES = ['neon', 'soft', 'band'];
const BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color dodge', 'color burn', 'hard light', 'soft light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];

const meta = {
  title: 'Design OS/Components/Core/Select',
  component: Select,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { items: MODES, index: 0, label: 'Mode', onChange: fn() },
  argTypes: {
    index: { control: { type: 'number', min: 0 } },
    label: { control: 'text' },
    name: { control: 'text' },
    width: { control: 'number' },
    disabled: { control: 'boolean' },
    title: { control: 'text' },
    hint: { control: 'text' },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed: the held member and a caret; ↓ picks the next straight away, without opening. */
export const Closed: Story = {
  play: async ({ canvasElement, args }) => {
    const field = within(canvasElement).getByRole('combobox', { name: 'Mode' });
    await expect(field).toHaveTextContent('neon');
    await expect(field).toHaveAttribute('aria-expanded', 'false');
    field.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(args.onChange).toHaveBeenLastCalledWith(1);
  },
};

/** Open: the menu is a float Layer at least the field's width; the held member is chosen, the pointer's row highlighted. Enter takes the highlight. */
export const Open: Story = {
  args: { index: 1 },
  play: async ({ canvasElement, args }) => {
    const field = within(canvasElement).getByRole('combobox', { name: 'Mode' });
    await userEvent.click(field);
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    const doc = within(canvasElement.ownerDocument.body);
    const list = await doc.findByRole('listbox', { name: 'Mode' });
    await expect(list).toHaveAttribute('data-layer', 'float');
    await expect(within(list).getAllByRole('option').map((o) => o.textContent)).toEqual(MODES);
    await userEvent.keyboard('{ArrowDown}');
    await expect(list.querySelector('[data-active]')).toHaveTextContent('band');
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(2);
    await waitFor(() => expect(field).toHaveAttribute('aria-expanded', 'false'));
  },
};

/** With a caption (`name`), which also names it when there's no `label`. */
export const Captioned: Story = {
  args: { label: undefined, name: 'Mode' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('combobox', { name: 'Mode' })).toBeInTheDocument();
  },
};

/** A long list: the menu scrolls inside the room left under the field, arriving scrolled to the held member. Type a letter to jump. */
export const LongList: Story = {
  args: { items: BLENDS, index: 11, label: 'Blend', name: 'Blend' },
};

/** A settled width, so a caller-owned list of labels can't resize the panel; long members truncate. */
export const FixedWidth: Story = {
  args: { items: BLENDS, index: 6, label: 'Blend', width: 96 },
};

/** Disabled: shown, not openable. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const field = within(canvasElement).getByRole('combobox', { name: 'Mode' });
    await expect(field).toBeDisabled();
    await userEvent.click(field);
    await expect(field).toHaveAttribute('aria-expanded', 'false');
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/** Live: controlled by its parent, the way a host uses it. */
export const Live: Story = {
  render: function LiveSelect(args) {
    const [index, setIndex] = useState(args.index);
    return <Select {...args} items={BLENDS} label="Blend" name="Blend" index={index} onChange={(next) => (setIndex(next), args.onChange(next))} />;
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { withMusicScope } from '../preview';
import { Select } from './Select';
import SelectSvelte from './Select.svelte';
import { selectStories as s } from './Select.fixtures';
import { PressableHarness } from './ToggleHarness';
import PressableHarnessSvelte from './ToggleHarness.svelte';
import { pressableHostStories } from './ToggleHarness.fixtures';

const meta = {
  id: 'music-controls-select',
  title: 'Music/Controls/Select', component: Select,
  decorators: [withRenderer, withMusicScope, withLibraryTheme], parameters: { layout: 'centered' },
  args: { items: ['Hall', 'Shimmer', 'Spring', 'Stereo delay'], index: 0, label: 'FX A effect', name: 'Effect', width: 112, onChange: fn(), disabled: false },
  argTypes: { disabled: { control: 'boolean' }, index: { control: { type: 'number', min: 0, max: 3 } } },
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Select, SelectSvelte);

export const Default: Story = story(s.Default, {
  play: async ({ canvasElement, args }) => {
    const field = within(canvasElement).getByRole('combobox', { name: 'FX A effect' });
    field.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(args.onChange).toHaveBeenLastCalledWith(1);
    await userEvent.keyboard('{End}');
    await expect(args.onChange).toHaveBeenLastCalledWith(3);
    await userEvent.click(field);
    const menu = await within(canvasElement).findByRole('listbox');
    await expect(field).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect(menu.querySelector('[data-active]')).toHaveTextContent('Spring');
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(2);
    await waitFor(() => expect(field).toHaveAttribute('aria-expanded', 'false'));
    await expect(field).toHaveFocus();
  },
});
export const PointerAndDismiss: Story = story(s.PointerAndDismiss, {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    await userEvent.click(field);
    const row = await canvas.findByRole('option', { name: 'Spring' });
    await userEvent.click(row);
    await expect(args.onChange).toHaveBeenLastCalledWith(2);
    await expect(field).toHaveFocus();
    await userEvent.click(field);
    await userEvent.keyboard('{Escape}');
    await expect(field).toHaveFocus();
    await expect(field).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(field);
    canvasElement.ownerDocument.body.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
    await waitFor(() => expect(field).toHaveAttribute('aria-expanded', 'false'));
    await userEvent.click(field);
    canvasElement.ownerDocument.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await waitFor(() => expect(field).toHaveAttribute('aria-expanded', 'false'));
  },
});
export const Typeahead: Story = story(s.Typeahead, {
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('combobox');
    await userEvent.click(field);
    await userEvent.keyboard('sss');
    await expect(within(canvasElement).getByRole('listbox').querySelector('[data-active]')).toHaveTextContent('Stereo delay');
    await userEvent.keyboard('{Escape}');
    await userEvent.click(field);
    await userEvent.keyboard('{Tab}');
    await waitFor(() => expect(field).toHaveAttribute('aria-expanded', 'false'));
  },
});
export const LongList: Story = story(s.LongList);
export const Live: Story = {
  ...fixtureStories<Story>(PressableHarness, PressableHarnessSvelte)(pressableHostStories.Select),
  render: args => <PressableHarness {...args} control="select" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    field.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(field).toHaveTextContent('Shimmer');
    await userEvent.click(field);
    await userEvent.click(await canvas.findByRole('option', { name: 'Spring' }));
    await expect(field).toHaveTextContent('Spring');
    await expect(field).toHaveFocus();
  },
};
export const Empty: Story = story(s.Empty);
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement, args }) => {
    const field = within(canvasElement).getByRole('combobox');
    await expect(field).toBeDisabled();
    await userEvent.click(field);
    await expect(field).toHaveAttribute('aria-expanded', 'false');
    await expect(args.onChange).not.toHaveBeenCalled();
  },
});

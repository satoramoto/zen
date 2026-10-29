import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { ExpressionField } from './ExpressionField';
import ExpressionFieldSvelte from './ExpressionField.svelte';
import { expressionFieldStories as s } from './ExpressionField.fixtures';
const meta = {
  title: 'Design OS/Math/ExpressionField',
  component: ExpressionField,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { onChange: fn(), onCommit: fn(), onCancel: fn() },
  argTypes: {
    value: { control: 'text' },
    error: { control: 'text' },
    description: { control: 'text' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
  },
} satisfies Meta<typeof ExpressionField>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(ExpressionField, ExpressionFieldSvelte);
export const Predicate: Story = story(s.Predicate, { play: async ({ canvasElement, args }) => {
  const field = within(canvasElement).getByRole('textbox', { name: 'Layer predicate' });
  await userEvent.click(field);
  await userEvent.keyboard('{Enter}');
  await expect(args.onCommit).toHaveBeenLastCalledWith('n % 3 == 0');
  await userEvent.keyboard('{Escape}');
  await expect(args.onCancel).toHaveBeenCalled();
  await userEvent.clear(field);
  await expect(args.onChange).toHaveBeenLastCalledWith('');
} });
export const Invalid: Story = story(s.Invalid, { play: async ({ canvasElement, args }) => {
  const field = within(canvasElement).getByRole('textbox', { name: 'Layer predicate' });
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await userEvent.click(field);
  await userEvent.keyboard('{Enter}');
  await expect(args.onCommit).not.toHaveBeenCalled();
} });
export const ReadOnly: Story = story(s.ReadOnly);
export const Disabled: Story = story(s.Disabled);

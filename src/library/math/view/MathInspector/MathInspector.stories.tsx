import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { MathInspector } from './MathInspector';
import MathInspectorSvelte from './MathInspector.svelte';
import { mathInspectorStories as s } from './MathInspector.fixtures';
const meta = {
  title: 'Design OS/Math/MathInspector',
  component: MathInspector,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: { title: { control: 'text' }, value: { control: 'text' }, domain: { control: 'text' } },
} satisfies Meta<typeof MathInspector>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(MathInspector, MathInspectorSvelte);
export const SelectedObject: Story = story(s.SelectedObject, { play: async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole('region', { name: 'Selected integer' })).toBeVisible();
  await expect(canvas.getByText('Prime numbers').closest('[data-membership]')).toHaveAttribute('data-matches', 'false');
  await expect(canvas.getByText('Not included')).toBeVisible();
} });
export const LargeExactObject: Story = story(s.LargeExactObject);
export const Empty: Story = story(s.Empty);

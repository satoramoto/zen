import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { ExactValue } from './ExactValue';
import ExactValueSvelte from './ExactValue.svelte';
import { exactValueStories as s } from './ExactValue.fixtures';
const meta = {
  title: 'Design OS/Math/ExactValue',
  component: ExactValue,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    value: { control: 'text' },
    kind: { control: 'select', options: ['exact', 'approximate'] },
    size: { control: 'select', options: ['body', 'numeral'] },
  },
} satisfies Meta<typeof ExactValue>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(ExactValue, ExactValueSvelte);
export const Integer: Story = story(s.Integer);
export const BeyondMachinePrecision: Story = story(s.BeyondMachinePrecision, { play: async ({ canvasElement }) => {
  await expect(within(canvasElement).getByText('900719925474099312345678901234567890')).toHaveAttribute('data-canonical', '900719925474099312345678901234567890');
} });
export const Rational: Story = story(s.Rational);
export const Approximation: Story = story(s.Approximation);

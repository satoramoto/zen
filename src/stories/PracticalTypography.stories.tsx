import type { Meta, StoryObj } from '@storybook/react-vite';
import { PrincipleExample } from '../PrincipleExample';
import { descriptionFor } from '../catalog';

const meta = {
  title: 'Practical Typography',
  component: PrincipleExample,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    id: { table: { disable: true } },
    applied: { control: 'boolean', description: 'Apply the principle; the on-canvas switch explores the same state.' },
    measure: { table: { disable: true } },
    hue: { table: { disable: true } },
    voice: { table: { disable: true } },
    width: { table: { disable: true } },
  },
} satisfies Meta<typeof PrincipleExample>;
export default meta;
type Story = StoryObj<typeof meta>;

export const BodyLeading: Story = {
  name: 'B1 · Body Leading',
  args: { id: 'B1', applied: true },
  parameters: { docs: { description: { story: descriptionFor('B1') } } },
};

export const SelectiveEmphasis: Story = {
  name: 'B2 · Selective Emphasis',
  args: { id: 'B2', applied: true },
  parameters: { docs: { description: { story: descriptionFor('B2') } } },
};

export const TypographicPunctuation: Story = {
  name: 'B3 · Typographic Punctuation',
  args: { id: 'B3', applied: true },
  parameters: { docs: { description: { story: descriptionFor('B3') } } },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { STANDINGS } from '../../model/standing';
import { P, Reading } from '../../layouts/Reading/Reading';
import { Mark, MarkLegend } from './Mark';

/** A claim's standing as a shape and a colour slot, hung in the margin beside the claim. */
const meta = {
  title: 'Compendium/Components/Mark',
  component: Mark,
  decorators: [withLibraryTheme],
  args: { standing: 'conjecture', place: 'margin' },
  argTypes: { standing: { control: 'select', options: STANDINGS }, place: { control: 'radio', options: ['margin', 'inline'] } },
} satisfies Meta<typeof Mark>;
export default meta;
type Story = StoryObj<typeof meta>;

/** In the margin of a reading paragraph, beside the line its claim starts on. */
export const InMargin: Story = {
  render: (args) => (
    <Reading>
      <P>
        <Mark {...args} />
        Whether the inequality holds for every n is open; a proof would settle the Riemann hypothesis.
      </P>
    </Reading>
  ),
  play: async ({ canvasElement, args }) => {
    const mark = within(canvasElement).getByRole('img');
    expect(mark).toHaveAttribute('data-shape');
    expect(mark).toHaveAccessibleName(/conjecture|established|consequence|interpretation|speculation/i);
    expect(mark).toHaveAttribute('data-place', args.place);
  },
};

/** Every standing with its name: the key a page shows under its title. */
export const Legend: Story = {
  render: () => <MarkLegend />,
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getAllByRole('img')).toHaveLength(STANDINGS.length);
  },
};

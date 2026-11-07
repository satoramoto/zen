import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { PATH_NAMES } from './model/fourier';
import { CoefficientFinder } from './CoefficientFinder';

/** The average of the drawing is c₀; spun back n turns, its average is cₙ. */
const meta = {
  title: 'Math/Fourier/Coefficient Finder',
  component: CoefficientFinder,
  decorators: [withLibraryTheme],
  args: { path: 'ellipse', turns: 0, unspin: true },
  argTypes: { path: { control: 'select', options: PATH_NAMES }, turns: { control: { type: 'range', min: -5, max: 5, step: 1 } } },
} satisfies Meta<typeof CoefficientFinder>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The ellipse has two arrows: c₁ of size 0.8 and c₋₁ of size 0.2, and nothing at the centre. */
export const Ellipse: Story = {
  render: (args) => <CoefficientFinder {...args} turns={undefined} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/c₀: size 0\.00/)).toBeInTheDocument();
    const turns = canvas.getByRole('slider', { name: /which arrow/i });
    turns.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(canvas.getByText(/c1: size 0\.80, angle 0°/)).toBeInTheDocument();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(canvas.getByText(/c-1: size 0\.20, angle 0°/)).toBeInTheDocument();
  },
};

/** Only the drawing and its centre. */
export const CentreOnly: Story = { args: { path: 'heart', unspin: false } };

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { RotatingVector } from './RotatingVector';

/** One term: a coefficient sets an arrow's size and starting angle, n sets how many times it turns per cycle. */
const meta = {
  title: 'Math/Fourier/Rotating Vector',
  component: RotatingVector,
  decorators: [withLibraryTheme],
  args: {},
} satisfies Meta<typeof RotatingVector>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The three sliders are the three things a term has: turns, size and angle. */
export const Term: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const turns = canvas.getByRole('slider', { name: /turns per cycle/i });
    turns.focus();
    await userEvent.keyboard('{Home}');
    expect(canvas.getByText(/turns 5 times clockwise/)).toBeInTheDocument();
    const angle = canvas.getByRole('slider', { name: /starting angle/i });
    angle.focus();
    await userEvent.keyboard('{End}');
    expect(canvas.getByText(/angle 180°/)).toBeInTheDocument();
  },
};

/** Turning zero times: the still arrow, the one that sets the centre. */
export const Still: Story = { args: { turns: 0, size: 0.5, angle: 45 } };

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../../storybook';
import { RightTriangle } from './RightTriangle';

/** A right triangle named from its marked angle: opposite, adjacent, hypotenuse, and the three ratios live. */
const meta = {
  title: 'Math/Trig/Components/Right Triangle',
  component: RightTriangle,
  decorators: [withLibraryTheme],
  args: {},
} satisfies Meta<typeof RightTriangle>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The 30-60-90 triangle reads sin 0.500; a longer hypotenuse at the same angle leaves all three ratios alone. */
export const SameAngleBigger: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '30-60-90' }));
    const angle = canvas.getByRole('slider', { name: /^angle/i });
    await waitFor(() => expect(angle).toHaveAttribute('aria-valuenow', '30'));
    expect(canvas.getByText(/^1\.00 \/ 2\.00 = 0\.500$/)).toBeInTheDocument();
    expect(canvas.getByText(/^1\.73 \/ 2\.00 = 0\.866$/)).toBeInTheDocument();
    expect(canvas.getByText(/^1\.00 \/ 1\.73 = 0\.577$/)).toBeInTheDocument();
    const hyp = canvas.getByRole('slider', { name: /^hypotenuse/i });
    hyp.focus();
    for (let i = 0; i < 5; i++) await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(hyp).toHaveAttribute('aria-valuenow', '2.5'));
    expect(angle).toHaveAttribute('aria-valuenow', '30');
    expect(canvas.getByText(/^1\.25 \/ 2\.50 = 0\.500$/)).toBeInTheDocument();
    expect(canvas.getByText(/^2\.17 \/ 2\.50 = 0\.866$/)).toBeInTheDocument();
    expect(canvas.getByText(/^1\.25 \/ 2\.17 = 0\.577$/)).toBeInTheDocument();
  },
};

/** A steep, small triangle; the free corner's arrow keys: Up lengthens the hypotenuse, Left narrows the angle. */
export const FreeCornerKeys: Story = {
  args: { angle: 60, hypotenuse: 1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const corner = canvas.getByRole('button', { name: 'Free corner' });
    const hyp = canvas.getByRole('slider', { name: /^hypotenuse/i });
    const angle = canvas.getByRole('slider', { name: /^angle/i });
    expect(canvas.getByText(/^0\.87 \/ 1\.00 = 0\.866$/)).toBeInTheDocument();
    corner.focus();
    await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}');
    await waitFor(() => expect(hyp).toHaveAttribute('aria-valuenow', '1.5'));
    expect(canvas.getByText(/^1\.30 \/ 1\.50 = 0\.866$/)).toBeInTheDocument();
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(angle).toHaveAttribute('aria-valuenow', '59'));
    expect(canvas.getByText(/^1\.29 \/ 1\.50 = 0\.857$/)).toBeInTheDocument();
  },
};

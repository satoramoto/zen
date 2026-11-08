import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { IdentitySquares } from './IdentitySquares';

/** sin²θ + cos²θ = 1 as areas: the squares on the two legs always fill the square on the radius. */
const meta = {
  title: 'Math/Trig/Identity Squares',
  component: IdentitySquares,
  decorators: [withLibraryTheme],
  args: {},
} satisfies Meta<typeof IdentitySquares>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The value of the readout whose label is exactly `label`. */
const readout = (root: HTMLElement, label: string) =>
  [...root.querySelectorAll('.zen-trig__readout')].find((r) => r.firstElementChild?.textContent === label)?.lastElementChild?.textContent;

/** The squares always fill the unit square: stepping the angle changes sin²θ, and the sum still reads 1.00. */
export const AlwaysOne: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole('slider', { name: 'Angle' });
    expect(handle).toHaveAttribute('aria-valuenow', '35');
    const before = readout(canvasElement, 'sin²θ');
    expect(readout(canvasElement, 'sin²θ + cos²θ')).toBe('1.00');
    handle.focus();
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    await waitFor(() => expect(handle).toHaveAttribute('aria-valuenow', '65'));
    expect(readout(canvasElement, 'sin²θ')).not.toBe(before);
    expect(readout(canvasElement, 'sin²θ + cos²θ')).toBe('1.00');
    // Back four 1° steps: still 1.00.
    for (let i = 0; i < 4; i++) await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(handle).toHaveAttribute('aria-valuenow', '61'));
    expect(readout(canvasElement, 'sin²θ + cos²θ')).toBe('1.00');
  },
};

/** At 60° the sine square is three times the cosine one: ¾ and ¼. */
export const Sixty: Story = {
  args: { angle: 60 },
  play: async ({ canvasElement }) => {
    expect(readout(canvasElement, 'sin²θ')).toBe('0.75');
    expect(readout(canvasElement, 'cos²θ')).toBe('0.25');
    expect(readout(canvasElement, 'sin²θ + cos²θ')).toBe('1.00');
  },
};

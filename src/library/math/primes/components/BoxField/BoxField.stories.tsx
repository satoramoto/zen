import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../../storybook';
import { BoxField } from './BoxField';

/** The 1D prime waves made two-dimensional: standing waves in a square, summed. */
const meta = {
  title: 'Math/Primes/Components/Box Field',
  component: BoxField,
  decorators: [withLibraryTheme],
  args: {},
} satisfies Meta<typeof BoxField>;
export default meta;
type Story = StoryObj<typeof meta>;

const painted = (el: HTMLElement) => Number(el.querySelector('canvas')?.dataset.painted ?? 0);

/** Symmetric across both midlines and the diagonal; the resolution changes the texture. */
export const Field: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole('img', { name: /300 primes' standing waves in a square/ })).toHaveAccessibleName(/symmetric across both midlines and the diagonal/);
    await waitFor(() => expect(painted(canvasElement)).toBeGreaterThan(0));
    const before = painted(canvasElement);
    const res = canvas.getByRole('slider', { name: 'Resolution' });
    res.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(painted(canvasElement)).toBeGreaterThan(before));
    expect(canvas.getByText(/that symmetry is the square’s, not the primes’/)).toBeInTheDocument();
  },
};

/** The theme's colours: when a colour the field is painted with changes, the field repaints. */
export const FollowsTheTheme: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(painted(canvasElement)).toBeGreaterThan(0));
    const before = painted(canvasElement);
    const figure = canvasElement.querySelector<HTMLElement>('.zen-primes')!;
    // Point the field's middle colour at another contract colour, as a theme change would.
    figure.style.setProperty('--surface-2', 'var(--hue-3)');
    try {
      await waitFor(() => expect(painted(canvasElement)).toBeGreaterThan(before));
    } finally {
      figure.style.removeProperty('--surface-2');
    }
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { RingField } from './RingField';

/** Thousands of prime waves summed by radius: rings, and the pixel grid's own pattern. */
const meta = {
  title: 'Math/Primes/Ring Field',
  component: RingField,
  decorators: [withLibraryTheme],
  args: {},
} satisfies Meta<typeof RingField>;
export default meta;
type Story = StoryObj<typeof meta>;

const painted = (el: HTMLElement) => Number(el.querySelector('canvas')?.dataset.painted ?? 0);

/** 20,000 waves; lowering the resolution repaints; the caption says what the rings are and what this construction does not make. */
export const Rings: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const img = canvas.getByRole('img', { name: /20,000 prime waves/ });
    expect(img).toHaveAccessibleName(/384 × 384 pixels/);
    await waitFor(() => expect(painted(canvasElement)).toBeGreaterThan(0));
    const before = painted(canvasElement);
    const res = canvas.getByRole('slider', { name: 'Resolution' });
    res.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(painted(canvasElement)).toBeGreaterThan(before));
    expect(canvas.getByRole('img', { name: /20,000 prime waves/ })).not.toHaveAccessibleName(/384 × 384/);
    expect(canvas.getByText(/cancel to flat grey/)).toBeInTheDocument();
    expect(canvas.getByText(/this construction does not make them/)).toBeInTheDocument();
  },
};

/** Averaged over each pixel, the waves finer than a pixel cancel and rings at other simple fractions appear. */
export const Averaged: Story = {
  args: { averaged: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole('img', { name: /each pixel averaged over its width/ })).toBeInTheDocument();
    expect(canvas.getByText(/a third, a quarter, a sixth/)).toBeInTheDocument();
  },
};

/** Asking for more than the figure computes: it draws its limit and says so. */
export const Clamped: Story = {
  args: { count: 500_000 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/stops at 100,000 primes/)).toBeInTheDocument();
    expect(canvas.getByRole('img', { name: /100,000 prime waves/ })).toBeInTheDocument();
  },
};

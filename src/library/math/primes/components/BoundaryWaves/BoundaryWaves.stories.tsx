import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../../storybook';
import { BoundaryWaves } from './BoundaryWaves';

/** Primes as standing waves between two walls: prime p fits p half-waves. */
const meta = {
  title: 'Math/Primes/Components/Boundary Waves',
  component: BoundaryWaves,
  decorators: [withLibraryTheme],
  args: {},
} satisfies Meta<typeof BoundaryWaves>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The first four primes, one per row; the count slider adds more. */
export const Stacked: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole('img', { name: /4 primes \(2, 3, 5, 7\)/ })).toBeInTheDocument();
    expect(canvasElement.querySelectorAll('.zen-primes__wave')).toHaveLength(4);
    const slider = canvas.getByRole('slider', { name: /primes/i });
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(canvasElement.querySelectorAll('.zen-primes__wave')).toHaveLength(5));
  },
};

/** 5, 7, 11 and 13 with their nodes marked: no two primes share a mark; the nearest are 1/143 apart. */
export const MarksNeverMeet: Story = {
  args: { from: 5, count: 4 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('checkbox', { name: /mark the nodes/i }));
    await waitFor(() => expect(canvas.getByRole('img', { name: /1\/143 of the width apart/ })).toBeInTheDocument());
    expect(canvas.getByRole('img', { name: /6\/11 and 7\/13/ })).toBeInTheDocument();
    expect(canvasElement.querySelectorAll('.zen-primes__mark--near')).toHaveLength(2);
    expect(canvasElement.querySelectorAll('.zen-primes__mark').length).toBe(4 + 6 + 10 + 12);
  },
};

/** Overlaid on one line, the waves wash into each other. */
export const Overlaid: Story = {
  args: { count: 12, layout: 'overlaid' },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole('img', { name: /on one line/ })).toBeInTheDocument();
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { HarmonicString } from '../../book/HarmonicString';

/**
 * A live illustration with its control, a "what changes" line and a source: the frame every
 * figure in a page sits in (`Figure`). The specimen is the sample book's harmonic string.
 */
const meta = {
  title: 'Compendium/Components/Figure',
  component: HarmonicString,
  decorators: [withLibraryTheme],
  args: { number: 'Figure 1' },
} satisfies Meta<typeof HarmonicString>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The harmonic string keeps its own harmonic: a slider picks the mode, the string and the lit key follow. */
export const HarmonicStringFigure: Story = {
  name: 'Harmonic string',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole('figure', { name: /overtones of a vibrating string/i })).toBeInTheDocument();
    expect(canvas.getByRole('slider', { name: /harmonic/i })).toBeInTheDocument();
    expect(canvas.getByText(/n = 3: 3 loops/)).toBeInTheDocument();
  },
};

/** The page holds the harmonic (a bound quantity): the figure shows it and reports changes. */
export const Controlled: Story = {
  args: { harmonic: 5, onHarmonic: fn() },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole('slider', { name: /harmonic/i })).toHaveAttribute('aria-valuenow', '5');
  },
};

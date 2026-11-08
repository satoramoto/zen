import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { AngleSum } from './AngleSum';

/** sin(α + β) = sin α cos β + cos α sin β: the tip's height is two lengths stacked. */
const meta = {
  title: 'Math/Trig/Angle Sum',
  component: AngleSum,
  decorators: [withLibraryTheme],
  args: {},
} satisfies Meta<typeof AngleSum>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The value of the readout whose label is exactly `label`. */
const readout = (root: HTMLElement, label: string) =>
  [...root.querySelectorAll('.zen-trig__readout')].find((r) => r.firstElementChild?.textContent === label)?.lastElementChild?.textContent;

const SUM = 'sin α cos β + cos α sin β';
const WHOLE = 'sin(α + β)';

/** Turning β changes both pieces, and their sum stays equal to sin(α + β). */
export const TwoPieces: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(readout(canvasElement, SUM)).toBe(readout(canvasElement, WHOLE));
    expect(readout(canvasElement, WHOLE)).toBe('0.866');
    const beta = canvas.getByRole('slider', { name: 'β' });
    beta.focus();
    for (let i = 0; i < 5; i++) await userEvent.keyboard('{ArrowRight}');
    // α 35 and β 30: sin 65° = 0.906.
    await waitFor(() => expect(readout(canvasElement, WHOLE)).toBe('0.906'));
    expect(readout(canvasElement, SUM)).toBe(readout(canvasElement, WHOLE));
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(readout(canvasElement, WHOLE)).toBe('0.996'));
    expect(readout(canvasElement, SUM)).toBe(readout(canvasElement, WHOLE));
  },
};

/** α 45° and β 30°: sin 75° = (√6 + √2)/4 ≈ 0.966, from √6/4 and √2/4. */
export const SeventyFive: Story = {
  args: { alpha: 45, beta: 30 },
  play: async ({ canvasElement }) => {
    expect(readout(canvasElement, 'sin α cos β')).toBe('0.612');
    expect(readout(canvasElement, 'cos α sin β')).toBe('0.354');
    expect(readout(canvasElement, SUM)).toBe('0.966');
    expect(readout(canvasElement, WHOLE)).toBe('0.966');
  },
};

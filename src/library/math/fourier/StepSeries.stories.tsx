import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { StepSeries } from './StepSeries';

/** The step and its cosine series cut off after some terms, with a probe watching one point's partial sums. */
const meta = {
  title: 'Math/Fourier/Step Series',
  component: StepSeries,
  decorators: [withLibraryTheme],
  args: {},
} satisfies Meta<typeof StepSeries>;
export default meta;
type Story = StoryObj<typeof meta>;

/** More cosines bring the sum closer to 1 at the probe. */
export const ClosingIn: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const terms = canvas.getByRole('slider', { name: /cosines/i });
    terms.focus();
    await userEvent.keyboard('{End}');
    expect(canvas.getByRole('img', { name: /first 60 cosines; at x = 0.25 the sum is (0\.9|1\.0)\d\d/ })).toBeInTheDocument();
  },
};

/** At the jump itself every cosine is zero, so the sums stay at 0. */
export const AtTheJump: Story = {
  args: { probe: 0.5, terms: 20 },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole('img', { name: /at x = 0.50 the sum is (-)?0\.000/ })).toBeInTheDocument();
  },
};

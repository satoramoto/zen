import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { PairToSine } from './PairToSine';

/** Two mirrored arrows turning opposite ways: their sum stays on the real line and is a cosine. */
const meta = {
  title: 'Math/Fourier/Pair to Sine',
  component: PairToSine,
  decorators: [withLibraryTheme],
  args: {},
} satisfies Meta<typeof PairToSine>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The frequency sets how many cycles the cosine makes per turn of the clock. */
export const Pair: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole('img', { name: /a cosine with 1 cycles/ })).toBeInTheDocument();
    const freq = canvas.getByRole('slider', { name: /frequency/i });
    freq.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(canvas.getByRole('img', { name: /a cosine with 3 cycles/ })).toBeInTheDocument();
    expect(canvas.getByText(/3 cycles per turn/)).toBeInTheDocument();
  },
};

/** A starting angle shifts the cosine along: still real, still a wave. */
export const Shifted: Story = { args: { frequency: 2, angle: 90 } };

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../../storybook';
import { PATH_NAMES } from '../../model/fourier';
import { Epicycles } from './Epicycles';

/** Arrows tip to tail, each turning a whole number of times per cycle, the last tip drawing the shape. */
const meta = {
  title: 'Math/Fourier/Components/Epicycles',
  component: Epicycles,
  decorators: [withLibraryTheme],
  args: { path: 'heart', arrows: 21, period: 12, autoplay: false },
  argTypes: { path: { control: 'select', options: PATH_NAMES }, arrows: { control: { type: 'range', min: 1, max: 101, step: 2 } } },
} satisfies Meta<typeof Epicycles>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The arrows slider changes how many arrows draw; the count is announced. */
export const Heart: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole('img', { name: /21 arrows drawing the heart/ })).toBeInTheDocument();
    const slider = canvas.getByRole('slider', { name: /arrows/i });
    slider.focus();
    await userEvent.keyboard('{End}');
    expect(canvas.getByRole('img', { name: /101 arrows/ })).toBeInTheDocument();
    expect(canvas.getByText(/50 pairs/)).toBeInTheDocument();
  },
};

/** One arrow is the still one: the drawing's centre. */
export const OneArrow: Story = { args: { arrows: 1, path: 'square' } };

/** The step is a drawing too, a dull one on the real line. */
export const Step: Story = { args: { path: 'step', arrows: 31 } };

/** Play advances the cycle; Pause stops it. */
export const Plays: Story = {
  args: { period: 2 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Play' }));
    await new Promise((r) => setTimeout(r, 400));
    await userEvent.click(canvas.getByRole('button', { name: 'Pause' }));
    expect(canvas.queryByRole('img', { name: /at 0% of the cycle/ })).toBeNull();
  },
};

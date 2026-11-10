import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../../storybook';
import { ArcWrap } from './ArcWrap';

/** Radians as a length: the arc measured in radii, laid flat on a ruler beside the circle. */
const meta = {
  title: 'Math/Trig/Components/Arc Wrap',
  component: ArcWrap,
  decorators: [withLibraryTheme],
  args: {},
} satisfies Meta<typeof ArcWrap>;
export default meta;
type Story = StoryObj<typeof meta>;

/** One radian: when the arc is exactly one radius long the angle is 1 rad, about 57.3°. */
export const OneRadian: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole('slider', { name: 'Angle' });
    expect(handle).toHaveAttribute('aria-valuenow', '60');
    await userEvent.click(canvas.getByRole('button', { name: /one radian/i }));
    await waitFor(() => expect(handle).toHaveAttribute('aria-valuenow', '57.3'));
    expect(handle).toHaveAttribute('aria-valuetext', expect.stringMatching(/57\.3°.*1\.00 rad/));
    expect(canvas.getAllByText(/^57\.3°$/).length).toBeGreaterThan(0);
    expect(canvas.getByText(/^1\.00 rad$/)).toBeInTheDocument();
    expect(canvas.getByText(/^1\.00 radius$/)).toBeInTheDocument();
  },
};

/** Half a turn is π radians, a little over three radii of arc; Shift steps the point on by 15°. */
export const HalfTurn: Story = {
  args: { angle: 180 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole('slider', { name: 'Angle' });
    expect(canvas.getByText(/^π ≈ 3\.14 rad$/)).toBeInTheDocument();
    expect(canvas.getByText(/^3\.14 radii$/)).toBeInTheDocument();
    handle.focus();
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    await waitFor(() => expect(handle).toHaveAttribute('aria-valuenow', '195'));
    expect(canvas.getByText(/^13π\/12 ≈ 3\.40 rad$/)).toBeInTheDocument();
  },
};

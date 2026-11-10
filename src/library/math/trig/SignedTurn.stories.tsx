import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { SignedTurn } from './SignedTurn';
import { withLibraryTheme } from '../../storybook';

const meta = { title: 'Math/Trig/SignedTurn', component: SignedTurn, decorators: [withLibraryTheme], args: { axes: true, quadrants: true } } satisfies Meta<typeof SignedTurn>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Journeys: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('spinbutton');
    for (const [total, endpoint, laps] of [[0, 0, 0], [360, 0, 1], [-360, 0, 1], [-90, 270, 0], [390, 30, 1], [630, 270, 1], [990, 270, 2]]) {
      await userEvent.clear(input);
      await userEvent.type(input, String(total));
      expect(canvasElement.querySelector('[data-total]')).toHaveAttribute('data-total', String(total));
      expect(canvasElement.querySelector('[data-endpoint]')).toHaveAttribute('data-endpoint', String(endpoint));
      expect(canvasElement.querySelector('[data-laps]')).toHaveAttribute('data-laps', String(laps));
    }
  },
};
export const CrossTheBoundary: Story = {
  args: { angle: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '359');
    canvas.getByRole('slider').focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(canvas.getByRole('slider')).toHaveAttribute('aria-valuenow', '361');
    await userEvent.clear(input);
    await userEvent.type(input, '-1');
    canvas.getByRole('slider').focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(canvas.getByRole('slider')).toHaveAttribute('aria-valuenow', '1');
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within, waitFor } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { SineExplorer } from './SineExplorer';

const meta = {
  title: 'Design OS/Math/Relationships/Circle to Sine',
  component: SineExplorer,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { amplitude: 1, frequency: 1, time: Math.PI / 4 },
  argTypes: {
    amplitude: { control: { type: 'range', min: .35, max: 1.65, step: .05 } },
    frequency: { control: { type: 'range', min: .5, max: 3, step: .05 } },
    time: { control: { type: 'range', min: 0, max: Math.PI * 2, step: .05 } },
  },
} satisfies Meta<typeof SineExplorer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const TwiceAround: Story = { args: { frequency: 2, time: 1.1 } };
export const TallAndSlow: Story = { args: { amplitude: 1.5, frequency: .5, time: 2 } };
export const LinkedHandles: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const orbit = await c.findByRole('slider', { name: 'Orbit position' });
    orbit.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(c.getByRole('slider', { name: 'Wave position' })).toHaveAttribute('aria-valuenow', orbit.getAttribute('aria-valuenow'));
    const radius = c.getByRole('slider', { name: 'Circle radius' });
    radius.focus(); await userEvent.keyboard('{End}');
    await expect(radius).toHaveAttribute('aria-valuenow', '1.65');
    await expect(c.getByRole('button', { name: 'Explore radius in equation' })).toHaveTextContent('1.65');
    await userEvent.click(c.getByRole('button', { name: /Twice around/ }));
    await expect(c.getByRole('slider', { name: 'Wave frequency' })).toHaveAttribute('aria-valuenow', '2');
    await expect(c.getByLabelText('Current height')).toHaveTextContent('1.00');
  },
};
export const CompareAndReset: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole('slider', { name: 'Circle radius' });
    await userEvent.click(c.getByRole('button', { name: 'Pin comparison' }));
    await userEvent.click(c.getByRole('button', { name: /Make it taller/ }));
    await expect(c.getByText(/Pinned curve/)).toHaveTextContent('0.35');
    await userEvent.click(c.getByRole('button', { name: 'Reset' }));
    await expect(c.getByRole('slider', { name: 'Circle radius' })).toHaveAttribute('aria-valuenow', '1');
    await expect(c.queryByRole('button', { name: 'Unpin comparison' })).not.toBeInTheDocument();
    await expect(c.getByRole('button', { name: 'Trace' })).toHaveAttribute('aria-pressed', 'true');
  },
};
export const PlayAndPause: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const orbit = await c.findByRole('slider', { name: 'Orbit position' });
    const before = orbit.getAttribute('aria-valuenow');
    await userEvent.click(c.getByRole('button', { name: 'Play motion' }));
    await waitFor(() => expect(orbit.getAttribute('aria-valuenow')).not.toBe(before));
    await userEvent.click(c.getByRole('button', { name: 'Pause motion' }));
    await expect(canvasElement.querySelector('.zen-sine')).toHaveAttribute('data-playing', 'false');
  },
};

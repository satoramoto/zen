import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { OrbitSimulator } from './OrbitSimulator';

const meta = {
  title: 'Math/Physics/Translunar Orbit Transfer',
  component: OrbitSimulator,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof OrbitSimulator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Apollo11Transfer: Story = {};

export const FreeReturnTrajectory: Story = {
  args: {
    initialConfig: {
      tliDeltaV: 3175,
    },
  },
};

export const OrbitInteractions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const simRegion = await canvas.findByRole('region', { name: 'Apollo Translunar Trajectory Simulator' });
    await expect(simRegion).toBeInTheDocument();

    // Check lunar perilune text is rendered
    await expect(canvas.getByText(/Perilune/)).toBeInTheDocument();
  },
};

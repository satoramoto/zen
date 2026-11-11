import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { busy } from './busy';

const meta = { title: 'Fixture/Measured', render: () => <div data-box style={{ width: 120, height: 40 }}>box</div> } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Renders: Story = { play: async () => { await busy(); } };

// Reads a laid-out size, which only a real browser has.
export const NeedsLayout: Story = {
  tags: ['browser'],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-box]')!.getBoundingClientRect().width).toBe(120);
  },
};

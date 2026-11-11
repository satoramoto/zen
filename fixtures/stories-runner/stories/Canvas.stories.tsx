import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

// Every story here draws: the whole file is for a real browser.
const meta = { title: 'Fixture/Canvas', tags: ['browser'], render: () => <canvas width={20} height={20} /> } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const draws: Story['play'] = async ({ canvasElement }) => {
  const context = canvasElement.querySelector('canvas')!.getContext('2d')!;
  context.fillStyle = 'rgb(255, 0, 0)';
  context.fillRect(0, 0, 20, 20);
  await expect(context.getImageData(1, 1, 1, 1).data[0]).toBe(255);
};
export const DrawsRed: Story = { play: draws };
export const DrawsAgain: Story = { play: draws };

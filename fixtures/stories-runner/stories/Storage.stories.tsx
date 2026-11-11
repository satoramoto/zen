import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

// The first leaves something in storage; the second, played after it, must not find it.
const meta = { title: 'Fixture/Storage', render: () => <p>Storage</p> } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const ALeavesAMark: Story = { play: async () => { localStorage.setItem('fixture-mark', 'left'); sessionStorage.setItem('fixture-mark', 'left'); } };
export const BFindsItClean: Story = {
  play: async () => {
    await expect(localStorage.getItem('fixture-mark')).toBeNull();
    await expect(sessionStorage.getItem('fixture-mark')).toBeNull();
  },
};

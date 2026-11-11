import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { busy } from './busy';

// A module written for a browser: it builds an observer as it loads.
const observer = new ResizeObserver(() => {});

function Greeting({ name }: { name: string }) { return <p>Hello, {name}</p>; }

const meta = { title: 'Fixture/Plain', component: Greeting, args: { name: 'reader' } } satisfies Meta<typeof Greeting>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Passes: Story = {
  play: async ({ canvasElement }) => {
    await busy();
    await expect(within(canvasElement).getByText('Hello, reader')).toBeTruthy();
    await expect(document.body.dataset.fixturePreview).toBe('applied');
    await expect(observer).toBeTruthy();
  },
};

export const RendersOnly: Story = { args: { name: 'nobody' } };

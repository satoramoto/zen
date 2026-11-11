import type { Meta, StoryObj } from '@storybook/react-vite';
import { busy } from './busy';

const meta = { title: 'Fixture/Real only', render: () => <p>Fine until it is laid out</p> } satisfies Meta;
export default meta;

// Passes on the virtual DOM and breaks in a real browser: what the run on main is for.
export const BreaksInABrowser: StoryObj<typeof meta> = {
  play: async () => {
    await busy();
    if (!navigator.userAgent.includes('jsdom')) throw new Error('this play only breaks in a real browser');
  },
};

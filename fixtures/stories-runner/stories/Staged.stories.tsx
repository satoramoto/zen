import type { Meta, StoryObj } from '@storybook/react-vite';

// Stands for a story drawn by the Omarchy stage: with no stage server it is skipped, not failed.
const meta = { title: 'Fixture/Staged', tags: ['stage'], render: () => <p>Would be drawn by Qt</p> } satisfies Meta;
export default meta;

export const OnTheStage: StoryObj<typeof meta> = { play: async () => { throw new Error('played without a stage'); } };

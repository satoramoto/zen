import type { Meta, StoryObj } from '@storybook/react-vite';

// Fails the first time it is played in a run and passes after: what --retries is for.
let tries = 0;
const meta = { title: 'Fixture/Flaky', render: () => <p>Sometimes</p> } satisfies Meta;
export default meta;

export const FailsOnce: StoryObj<typeof meta> = {
  play: async () => { tries += 1; if (tries === 1) throw new Error('the first try fails'); },
};

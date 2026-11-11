import type { Meta, StoryObj } from '@storybook/react-vite';
import { busy } from './busy';

const meta = { title: 'Fixture/Failing', render: () => <p>About to fail</p> } satisfies Meta;
export default meta;

export const PlayThrows: StoryObj<typeof meta> = {
  play: async () => { await busy(); throw new Error('this play throws on purpose'); },
};

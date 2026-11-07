import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { PROOF } from '../../book/harmonic.sample';
import { ProofGraph } from './ProofGraph';

/** A proof's dependency graph in layers: the goal on top, what it rests on below. */
const meta = {
  title: 'Compendium/Components/ProofGraph',
  component: ProofGraph,
  decorators: [withLibraryTheme],
  args: { data: PROOF, label: 'What the Lean proof of divergence depends on' },
} satisfies Meta<typeof ProofGraph>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Divergence: Story = {
  play: async ({ canvasElement, args }) => {
    for (const node of args.data.nodes) expect(canvasElement).toHaveTextContent(node.name);
  },
};

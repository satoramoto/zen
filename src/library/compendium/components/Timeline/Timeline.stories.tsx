import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { TIMELINE, TIMELINE_AXIS } from '../../book/harmonic.sample';
import { Timeline } from './Timeline';

/** Lives as spans and works as points on a piecewise axis that breaks over empty stretches. */
const meta = {
  title: 'Compendium/Components/Timeline',
  component: Timeline,
  decorators: [withLibraryTheme],
  args: { rows: TIMELINE, axis: TIMELINE_AXIS, label: 'People and works in the history of the harmonic series' },
} satisfies Meta<typeof Timeline>;
export default meta;
type Story = StoryObj<typeof meta>;

export const History: Story = {
  play: async ({ canvasElement, args }) => {
    for (const row of args.rows) expect(canvasElement).toHaveTextContent(row.label);
  },
};

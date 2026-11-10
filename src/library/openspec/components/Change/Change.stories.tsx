import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { SAMPLE_FILES } from '../../model/sample';
import { readRepo } from '../../model/repo';
import { Change } from './Change';

const SAMPLE = readRepo(SAMPLE_FILES);

/** A change as a document: status and progress, proposal, spec deltas, tasks, design. */
const meta = {
  title: 'Openspec/Components/Change',
  component: Change,
  decorators: [withLibraryTheme],
  parameters: { layout: 'padded' },
  args: { change: SAMPLE.changes.find((c) => c.name === 'follow-system-theme')!, exists: { theme: true } },
} satisfies Meta<typeof Change>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Active, two of five tasks done, one new capability and one modified, with a removal. */
export const Active: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText('active')).toBeInTheDocument();
    expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    expect(canvas.getAllByRole('checkbox')).toHaveLength(5);
    expect(canvas.getAllByRole('checkbox', { checked: true })).toHaveLength(2);
    expect(canvas.getByLabelText('Delta: system-theme')).toHaveTextContent('new capability');
    expect(within(canvas.getByLabelText('Delta: theme')).getAllByRole('region', { name: /^Requirement:/ })).toHaveLength(2);
    expect(canvas.getByRole('heading', { name: 'Design' })).toBeInTheDocument();
  },
};

/** A tooling change that skips specs: no deltas, and it says why. */
export const SkipsSpecs: Story = {
  args: { change: SAMPLE.changes.find((c) => c.name === 'ci-cache')!, exists: {} },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText('skips specs')).toBeInTheDocument();
    expect(canvas.getByText(/nothing the system does changes/)).toBeInTheDocument();
  },
};

/** Archived: every task done, dated. */
export const Archived: Story = {
  args: { change: SAMPLE.archive[0], exists: { 'user-auth': true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText('archived 2026-10-30')).toBeInTheDocument();
    expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
  },
};

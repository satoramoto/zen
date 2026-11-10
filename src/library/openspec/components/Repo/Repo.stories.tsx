import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { SAMPLE_FILES } from '../../model/sample';
import { readRepo, summarize } from '../../model/repo';
import { ZEN_FILES } from '../../model/zen';
import { Repo } from './Repo';

const SAMPLE = readRepo(SAMPLE_FILES);
const ZEN = readRepo(ZEN_FILES);

/**
 * An OpenSpec root: its specs, active changes and archive down the side; the overview, a spec or
 * a change beside them. The sample root exercises every shape; the Zen root is this
 * repository's own `openspec/` folder, read at build time.
 */
const meta = {
  title: 'Openspec/Components/Repo',
  component: Repo,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { repo: SAMPLE, name: 'sample', onOpen: fn() },
} satisfies Meta<typeof Repo>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The sample root: two specs, two active changes (one skipping specs), one archived change. */
export const Sample: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const s = summarize(args.repo);
    expect(canvas.getByRole('navigation', { name: 'OpenSpec contents' })).toBeInTheDocument();
    expect(within(canvas.getByRole('list', { name: 'Specs' })).getAllByRole('listitem')).toHaveLength(s.specs);
    expect(within(canvas.getByRole('list', { name: 'Changes' })).getAllByRole('listitem')).toHaveLength(s.changes);
    expect(within(canvas.getByRole('list', { name: 'Archive' })).getAllByRole('listitem')).toHaveLength(s.archived);
    // The overview counts, and the changes under way with their progress.
    expect(canvas.getByText('requirements').previousSibling).toHaveTextContent(String(s.requirements));
    expect(canvas.getAllByRole('progressbar')).toHaveLength(2);
  },
};

/** Opening a spec, then a change, then the archive; the host hears each. */
export const Navigates: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /user-auth/ }));
    expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('user-auth Specification');
    expect(canvas.getAllByRole('region', { name: /^Requirement:/ })).toHaveLength(2);
    expect(args.onOpen).toHaveBeenLastCalledWith({ kind: 'spec', capability: 'user-auth' });
    await userEvent.click(canvas.getByRole('button', { name: /Follow the system theme/ }));
    expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Follow the system theme');
    expect(canvas.getByText('ADDED')).toBeInTheDocument();
    expect(canvas.getByText('MODIFIED')).toBeInTheDocument();
    expect(canvas.getByText('REMOVED')).toBeInTheDocument();
    expect(canvas.getByText('new capability')).toBeInTheDocument();
    expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    await userEvent.click(canvas.getByRole('button', { name: /Expire idle sessions/ }));
    expect(canvas.getByText(/archived 2026-10-30/)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /Cache the install in CI/ }));
    expect(canvas.getByText('skips specs')).toBeInTheDocument();
  },
};

/** Zen's own openspec folder: the spec for these very stories, and the change that made them. */
export const Zen: Story = {
  args: { repo: ZEN, name: 'zen' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    expect(args.repo.schema).toBe('zen-flow');
    expect(args.repo.specs.map((s) => s.capability)).toContain('openspec-viewer');
    await userEvent.click(canvas.getByRole('button', { name: /openspec-viewer/ }));
    expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(/openspec-viewer/);
    expect(canvas.getAllByRole('region', { name: /^Requirement:/ }).length).toBeGreaterThanOrEqual(3);
  },
};

/** A root with nothing in it yet, as `openspec init` leaves it. */
export const Empty: Story = {
  args: { repo: readRepo({ 'config.yaml': 'schema: spec-driven\n' }), name: 'fresh' },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByText(/nothing here yet/i)).toBeInTheDocument();
  },
};

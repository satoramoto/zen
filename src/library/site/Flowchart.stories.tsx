import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { scenario } from 'story-spec';
import { withLibraryTheme } from '../storybook';
import { Flowchart } from './Flowchart';

const meta = {
  title: 'Site/Flowchart', component: Flowchart, decorators: [withLibraryTheme],
  args: { chart: {
    title: 'Execution flow', description: 'A request branches into execution or compilation.',
    nodes: [
      { id: 'lookup', label: 'Lookup', detail: 'Find cached work', x: 0, y: 0 },
      { id: 'compile', label: 'Compile', detail: 'Translate missing work', x: 340, y: 180 },
      { id: 'run', label: 'Execute', detail: 'Run ready work', x: 0, y: 360 },
    ],
    edges: [{ from: 'lookup', to: 'compile', label: 'miss' }, { from: 'lookup', to: 'run', label: 'hit' }, { from: 'compile', to: 'run', label: 'ready' }],
  } },
  parameters: { spec: { capability: 'site-documentation' } },
} satisfies Meta<typeof Flowchart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FollowDirectedStages: Story = scenario({
  requirement: 'Authored documentation flowcharts',
  shall: 'The site SHALL render validated Markdown flowchart data using Zen graph components with directed labelled connections, read-only nodes, keyboard zoom and fit controls, and a searchable server-rendered textual equivalent. Invalid graph data SHALL fail the build with source context.',
  when: 'a reader opens an authored flowchart',
  then: 'the stages and labelled directed connections are visible without editing the diagram',
  check: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll('[data-part="cord"]').length).toBe(3));
    const canvas = within(canvasElement);
    await expect(canvas.getByText('miss')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Zoom in' })).toBeVisible();
    expect([...canvasElement.querySelectorAll('[data-part="dot"]')].every(node => (node as HTMLButtonElement).disabled)).toBe(true);
  },
});

export const ZoomAndFit: Story = scenario({
  requirement: 'Authored documentation flowcharts',
  when: 'a reader zooms into a diagram using the keyboard and then fits it',
  then: 'the canvas zoom changes and fit returns every stage to view',
  check: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvasElement.querySelectorAll('[data-part="cord"]').length).toBe(3));
    await userEvent.click(canvas.getByRole('button', { name: 'Fit diagram' }));
    const graph = canvasElement.querySelector<HTMLElement>('.lib-graph')!;
    const scale = () => Number(graph.style.getPropertyValue('--lib-graph-zoom'));
    const initial = scale();
    canvas.getByRole('button', { name: 'Zoom in' }).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(scale()).toBeGreaterThan(initial));
    await userEvent.click(canvas.getByRole('button', { name: 'Fit diagram' }));
    await waitFor(() => expect(scale()).toBeCloseTo(initial, 2));
  },
});

export const ReadRelationships: Story = scenario({
  requirement: 'Authored documentation flowcharts',
  when: 'a reader opens the textual equivalent of a diagram',
  then: 'each stage description and directed relationship is readable as text',
  act: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('button', { name: 'Fit diagram' });
    await userEvent.click(canvas.getByText('Read diagram as text'));
  },
  check: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Lookup → Compile: miss')).toBeVisible();
    await expect(within(canvasElement).getByText('Compile → Execute: ready')).toBeVisible();
  },
});

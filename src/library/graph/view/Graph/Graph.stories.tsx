import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import { Graph, GraphNode, type GraphCord, type GraphView } from './Graph';
import { Port } from './Port';

interface PortSpec {
  id: string;
  label: string;
  kind: string;
}

interface NodeSpec {
  id: string;
  name: string;
  x: number;
  y: number;
  inlets: PortSpec[];
  outlets: PortSpec[];
}

const PATCH: NodeSpec[] = [
  { id: 'osc', name: 'Osc', x: 24, y: 40, inlets: [{ id: 'osc/pitch', label: 'Pitch', kind: 'note' }], outlets: [{ id: 'osc/out', label: 'Out', kind: 'audio' }] },
  { id: 'seq', name: 'Seq', x: 24, y: 200, inlets: [], outlets: [{ id: 'seq/note', label: 'Note', kind: 'note' }] },
  {
    id: 'filter',
    name: 'Filter',
    x: 260,
    y: 80,
    inlets: [
      { id: 'filter/in', label: 'In', kind: 'audio' },
      { id: 'filter/key', label: 'Key', kind: 'note' },
    ],
    outlets: [{ id: 'filter/out', label: 'Out', kind: 'audio' }],
  },
  { id: 'amp', name: 'Amp', x: 500, y: 120, inlets: [{ id: 'amp/in', label: 'In', kind: 'audio' }], outlets: [] },
];

const kindOf = (nodes: NodeSpec[], id: string) =>
  nodes.flatMap((n) => [...n.inlets, ...n.outlets]).find((p) => p.id === id)?.kind;

/** A plain box with a focusable head: the head is the node's tab stop for the arrow keys. */
function Box({ node, cords }: { node: NodeSpec; cords: readonly GraphCord[] }) {
  const rows = Math.max(node.inlets.length, node.outlets.length);
  const cell = (p: PortSpec | undefined, side: 'in' | 'out'): ReactNode =>
    p ? (
      <Port
        key={p.id}
        id={p.id}
        side={side}
        label={p.label}
        kind={p.kind}
        connected={cords.some((c) => (side === 'in' ? c.to : c.from) === p.id)}
      />
    ) : (
      <span />
    );
  return (
    <Surface layer="raised" border style={{ minWidth: 'calc(var(--space-6) * 4)', display: 'grid' }}>
      <div tabIndex={0} aria-label={`${node.name}, arrow keys move`} style={{ padding: 'var(--space-2) var(--space-3)', cursor: 'grab' }}>
        <Text role="label">{node.name}</Text>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-1) var(--space-3)', padding: '0 var(--space-2) var(--space-2)' }}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} style={{ display: 'contents' }}>
            {cell(node.inlets[i], 'in')}
            <span style={{ justifySelf: 'end' }}>{cell(node.outlets[i], 'out')}</span>
          </div>
        ))}
      </div>
    </Surface>
  );
}

const FRAME: CSSProperties = { height: 'calc(var(--space-6) * 14)', color: 'var(--text-1)' };
const INKS = { '--lib-cord-audio': 'var(--hue-1)', '--lib-cord-note': 'var(--hue-3)' } as CSSProperties;

/** Host-owned positions and cords; a connection between different kinds is refused. */
function PatchHarness() {
  const [nodes, setNodes] = useState(PATCH);
  const [cords, setCords] = useState<GraphCord[]>([{ from: 'osc/out', to: 'filter/in', kind: 'audio' }]);
  const [last, setLast] = useState('none');
  const move = useCallback((id: string, x: number, y: number) => {
    setNodes((all) => all.map((n) => (n.id === id ? { ...n, x, y } : n)));
  }, []);
  const connect = useCallback(
    (from: string, to: string) => {
      const a = kindOf(nodes, from);
      const b = kindOf(nodes, to);
      if (a !== b) {
        setLast(`refused ${from} → ${to} (${a} ≠ ${b})`);
        return;
      }
      setLast(`connected ${from} → ${to}`);
      // One cord per inlet: a new one replaces the old.
      setCords((all) => [...all.filter((c) => c.to !== to), { from, to, kind: a }]);
    },
    [nodes],
  );
  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <Text role="caption" tone="muted" data-testid="last">
        Last: {last}
      </Text>
      <div style={{ ...FRAME, ...INKS }}>
        <Graph label="Patch" cords={cords} onMove={move} onConnect={connect}>
          {nodes.map((n) => (
            <GraphNode key={n.id} id={n.id} x={n.x} y={n.y}>
              <Box node={n} cords={cords} />
            </GraphNode>
          ))}
        </Graph>
      </div>
    </div>
  );
}

/** A spread patch bigger than its frame; Fit frames it. */
function FitHarness({ fitOnResize }: { fitOnResize: boolean }) {
  const view = useRef<GraphView>(null);
  const [scale, setScale] = useState(1);
  const spread = PATCH.map((n, i) => ({ ...n, x: n.x * 3, y: n.y * 2 + i * 60 }));
  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => {
            view.current?.fit();
            requestAnimationFrame(() => setScale(view.current?.scale() ?? 1));
          }}
        >
          Fit
        </button>
        <Text role="caption" tone="muted" data-testid="scale">
          Zoom {scale.toFixed(2)}
        </Text>
      </div>
      <div style={{ ...FRAME, ...INKS, width: 'calc(var(--space-6) * 16)', maxWidth: '100%', resize: 'both', overflow: 'hidden' }}>
        <Graph label="Spread patch" viewRef={view} fitOnResize={fitOnResize} cords={[{ from: 'osc/out', to: 'filter/in', kind: 'audio' }]}>
          {spread.map((n) => (
            <GraphNode key={n.id} id={n.id} x={n.x} y={n.y}>
              <Box node={n} cords={[]} />
            </GraphNode>
          ))}
        </Graph>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Design OS/Graph/Graph',
  decorators: [withLibraryTheme],
  parameters: { layout: 'padded' },
};
export default meta;

export const Patch: StoryObj = {
  render: () => <PatchHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cords = () => canvasElement.querySelectorAll('[data-part="cord"]:not([data-pending])').length;
    await waitFor(() => expect(cords()).toBe(1));
    // Keyboard, inlet first: Amp In, then Filter Out. Normalised to filter/out → amp/in.
    const [, ampIn] = canvas.getAllByRole('button', { name: 'In' });
    ampIn.focus();
    await userEvent.keyboard('{Enter}');
    const outs = canvas.getAllByRole('button', { name: 'Out' });
    outs[1].focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByTestId('last')).toHaveTextContent('connected filter/out → amp/in'));
    await waitFor(() => expect(cords()).toBe(2));
    // Mismatched kinds: Seq Note → Filter In is refused, and nothing is drawn.
    canvas.getByRole('button', { name: 'Note' }).focus();
    await userEvent.keyboard('{Enter}');
    canvas.getAllByRole('button', { name: 'In' })[0].focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByTestId('last')).toHaveTextContent('refused'));
    expect(cords()).toBe(2);
  },
};

export const Fit: StoryObj<{ fitOnResize: boolean }> = {
  args: { fitOnResize: false },
  render: (args) => <FitHarness {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Fit' }));
    await waitFor(() => {
      const zoom = parseFloat(canvas.getByTestId('scale').textContent?.replace('Zoom ', '') ?? '1');
      expect(zoom).toBeLessThan(1);
    });
  },
};

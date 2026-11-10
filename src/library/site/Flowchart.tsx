import { useId, useRef, useState, useEffect, type CSSProperties } from 'react';
import { Graph, GraphNode, type GraphView } from '../graph/view/Graph/Graph';
import { Port } from '../graph/view/Graph/Port';
import { Text } from '../primitives/Text';
import './Flowchart.css';

/** Authored coordinates keep diagrams reproducible; labels carry no application semantics. */
export interface FlowchartData {
  title: string;
  description: string;
  nodes: Array<{ id: string; label: string; detail?: string; x: number; y: number }>;
  edges: Array<{ from: string; to: string; label: string }>;
}

/** Read-only Graph with an always-available, server-rendered textual equivalent. */
export function Flowchart({ chart }: { chart: FlowchartData }) {
  const view = useRef<GraphView>(null);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const names = new Map(chart.nodes.map(node => [node.id, node.label]));
  const cords = chart.edges.map((edge, i) => ({
    from: `edge-${i}-out`, to: `edge-${i}-in`, label: edge.label,
  }));
  return <figure className="zen-flowchart" aria-label={chart.title}>
    <figcaption><strong>{chart.title}</strong><p>{chart.description}</p></figcaption>
    {ready && <>
      <div className="zen-flowchart__tools" role="group" aria-label="Diagram controls">
        <button type="button" onClick={() => view.current?.zoom?.(1.25)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => view.current?.zoom?.(0.8)} aria-label="Zoom out">−</button>
        <button type="button" onClick={() => view.current?.fit()}>Fit diagram</button>
        <span>Drag background to pan · scroll to zoom</span>
      </div>
      <div className="zen-flowchart__canvas">
        <svg width="0" height="0" aria-hidden="true" className="zen-flowchart__defs"><defs>
          <marker id={`arrow-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
          </marker>
        </defs></svg>
        <div className="zen-flowchart__graph" style={{ '--flowchart-arrow': `url(#arrow-${id})` } as CSSProperties}>
          <Graph label={`${chart.title} canvas`} viewRef={view} cords={cords} fitOnResize minZoom={0.1} maxZoom={2} fitAlign="center">
            {chart.nodes.map(node => <GraphNode key={node.id} id={node.id} x={node.x} y={node.y}>
              <div className="zen-flowchart__node">
                <Text role="label">{node.label}</Text>
                {node.detail && <Text role="caption" tone="secondary">{node.detail}</Text>}
                {chart.edges.flatMap((edge, i) => {
                  const out = edge.from === node.id;
                  if (!out && edge.to !== node.id) return [];
                  const other = chart.nodes.find(n => n.id === (out ? edge.to : edge.from))!;
                  const dx = other.x - node.x, dy = other.y - node.y;
                  const face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
                  return [<Port key={`${i}-${out}`} id={`edge-${i}-${out ? 'out' : 'in'}`} side={out ? 'out' : 'in'}
                    face={face} connected disabled showLabel={false} className={`zen-flowchart__port zen-flowchart__port--${face}`}
                    label={`${names.get(edge.from)} → ${names.get(edge.to)}: ${edge.label}`} />];
                })}
              </div>
            </GraphNode>)}
          </Graph>
        </div>
      </div>
    </>}
    <details className="zen-flowchart__text" open={!ready || undefined}>
      <summary>Read diagram as text</summary>
      <dl>{chart.nodes.map(node => <div key={node.id}><dt>{node.label}</dt><dd>{node.detail ?? node.label}</dd></div>)}</dl>
      <ol>{chart.edges.map((edge, i) => <li key={i}>{names.get(edge.from)} → {names.get(edge.to)}: {edge.label}</li>)}</ol>
    </details>
  </figure>;
}

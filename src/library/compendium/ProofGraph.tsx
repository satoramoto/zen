import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Stack } from '../primitives/Stack';
import { Surface } from '../primitives/Surface';
import { Text } from '../primitives/Text';
import './ProofGraph.css';

export interface ProofNode {
  id: string;
  /** The declaration's name, e.g. `Real.tendsto_sum_range_one_div_nat_succ_atTop`. */
  name: string;
  /** What it says, in words. */
  says: string;
  kind: 'theorem' | 'lemma' | 'definition';
}

export interface ProofGraphData {
  nodes: ProofNode[];
  /** `[uses, usedBy]`: the proof of `usedBy` cites `uses`. */
  edges: [string, string][];
}

/** Each node's layer: 0 for what uses nothing here, else one above the highest thing it uses. */
function layers({ nodes, edges }: ProofGraphData): ProofNode[][] {
  const uses = new Map(nodes.map((n) => [n.id, [] as string[]]));
  for (const [from, to] of edges) uses.get(to)?.push(from);
  const rank = new Map<string, number>();
  const rankOf = (id: string, seen = new Set<string>()): number => {
    const known = rank.get(id);
    if (known !== undefined) return known;
    if (seen.has(id)) return 0; // a cycle: not a DAG, but don't hang
    seen.add(id);
    const r = Math.max(-1, ...(uses.get(id) ?? []).map((u) => rankOf(u, seen))) + 1;
    rank.set(id, r);
    return r;
  };
  const rows: ProofNode[][] = [];
  for (const n of nodes) (rows[rankOf(n.id)] ??= []).push(n);
  return rows.reverse(); // the goal on top, foundations at the bottom
}

interface Wire {
  key: string;
  d: string;
}

/**
 * **Job.** (Compendium mockup stub.) A dependency DAG in a layered layout: the goal on top, what
 * it rests on in rows beneath (longest-path layering, in the data's order within a row). Nodes
 * are raised `Surface` chips laid out by the browser (rows wrap at narrow widths); the edges are
 * an SVG drawn over them from the chips' measured boxes, re-measured on resize. Not the circuit
 * `Graph`: that is a freely placed, zoomable canvas of ports and cords, and a proof wants rows.
 */
export function ProofGraph({ data, label }: { data: ProofGraphData; label: string }) {
  const rows = useMemo(() => layers(data), [data]);
  const box = useRef<HTMLDivElement>(null);
  const chips = useRef(new Map<string, HTMLElement>());
  const [wires, setWires] = useState<Wire[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const o = el.getBoundingClientRect();
      setSize({ w: o.width, h: o.height });
      const next: Wire[] = [];
      for (const [from, to] of data.edges) {
        const a = chips.current.get(from)?.getBoundingClientRect();
        const b = chips.current.get(to)?.getBoundingClientRect();
        if (!a || !b) continue;
        const x1 = a.left + a.width / 2 - o.left;
        const y1 = a.top - o.top;
        const x2 = b.left + b.width / 2 - o.left;
        const y2 = b.bottom - o.top;
        const bend = Math.max(12, (y1 - y2) / 2);
        next.push({ key: `${from}>${to}`, d: `M${x1} ${y1} C${x1} ${y1 - bend} ${x2} ${y2 + bend} ${x2} ${y2}` });
      }
      setWires(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data, rows]);

  const markerId = `cmp-proof-arrow-${label.replace(/\W+/g, '-')}`;
  return (
    <div className="cmp-proof" ref={box} role="group" aria-label={label}>
      <svg className="cmp-proof__wires" width={size.w} height={size.h} aria-hidden="true">
        <defs>
          <marker id={markerId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L8 4 L0 8 Z" className="cmp-proof__head" />
          </marker>
        </defs>
        {wires.map((w) => (
          <path key={w.key} d={w.d} className="cmp-proof__wire" markerEnd={`url(#${markerId})`} />
        ))}
      </svg>
      <Stack gap={6} className="cmp-proof__rows">
        {rows.map((row, i) => (
          <Stack key={i} direction="row" gap={3} wrap justify="center" as="ul" className="cmp-proof__row">
            {row.map((n) => (
              <li key={n.id} className="cmp-proof__item">
                <Surface
                  layer="raised"
                  radius="control"
                  border={n.kind === 'theorem' ? 'strong' : true}
                  className="cmp-proof__chip"
                  data-kind={n.kind}
                  ref={(el: HTMLElement | null) => {
                    if (el) chips.current.set(n.id, el);
                    else chips.current.delete(n.id);
                  }}
                >
                  <Stack gap={1}>
                    <Text role="code" size="caption" tone={n.kind === 'theorem' ? 'primary' : 'secondary'} truncate title={n.name}>
                      {n.name}
                    </Text>
                    <Text role="caption" tone="muted">
                      {n.says}
                    </Text>
                  </Stack>
                </Surface>
              </li>
            ))}
          </Stack>
        ))}
      </Stack>
    </div>
  );
}

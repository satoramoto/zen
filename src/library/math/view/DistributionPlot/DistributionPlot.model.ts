import { textNode } from '../../../primitives/Text.model';
import { h, wire, type Handlers, type Node } from '../../../view/Tree.model';

/** Counts are supplied by the owner, never estimated from rendered marks. */
export interface DistributionBin { id: string; label: string; count: number; total: number }
export interface DistributionPlotProps {
  bins: readonly DistributionBin[];
  label?: string;
  hue?: 1 | 2 | 3 | 4;
  selectedId?: string | null;
  startLabel?: string;
  endLabel?: string;
  onSelect?(id: string): void;
}
/** No observations and malformed counts are unavailable, not a measured zero. */
export function binProportion(bin: Pick<DistributionBin, 'count' | 'total'>): number | null {
  return Number.isSafeInteger(bin.count) && Number.isSafeInteger(bin.total) && bin.total > 0 && bin.count >= 0 && bin.count <= bin.total
    ? bin.count / bin.total : null;
}
export function distributionBinLabel(bin: DistributionBin): string {
  const rate = binProportion(bin);
  return rate === null ? `${bin.label}: no valid observations` : `${bin.label}: ${bin.count} of ${bin.total} (${(rate * 100).toFixed(2)}%)`;
}
export function distributionPlotView(p: DistributionPlotProps): Node {
  const left = 40, width = 584, top = 14, height = 112, bottom = top + height;
  const step = width / Math.max(1, p.bins.length);
  return h('div', { class: 'lib-distribution-plot', 'data-hue': String(p.hue ?? 1) },
    textNode({ role: 'caption', tone: 'secondary' }, {}, p.label ?? 'Distribution'),
    h('div', { class: 'lib-distribution-plot__chart' },
    h('div', { class: 'lib-distribution-plot__scale', 'aria-hidden': 'true' },
      textNode({ role: 'caption', tone: 'muted' }, {}, '100%'),
      textNode({ role: 'caption', tone: 'muted' }, {}, '0%')),
    h('svg', { viewBox: '36 0 592 138', role: 'group', 'aria-label': p.label ?? 'Distribution' },
      h('desc', {}, 'Each bar is the proportion of matching observations in its interval. The vertical scale is fixed from zero to one hundred percent.'),
      h('line', { x1: String(left), x2: String(left + width), y1: String(top), y2: String(top), class: 'lib-distribution-plot__guide' }),
      h('line', { x1: String(left), x2: String(left + width), y1: String(bottom), y2: String(bottom), class: 'lib-distribution-plot__baseline' }),
      p.bins.map((bin, i) => {
        const rate = binProportion(bin), x = left + i * step;
        return { ...wire(h('g', {
          class: 'lib-distribution-plot__bin', 'data-bin-id': bin.id, 'data-selected': String(bin.id === p.selectedId),
          role: p.onSelect ? 'button' : 'group', tabindex: '0', 'aria-label': distributionBinLabel(bin),
        },
          h('title', {}, distributionBinLabel(bin)),
          h('rect', { x: String(x), y: String(top), width: String(step), height: String(height + 4), class: 'lib-distribution-plot__target' }),
          rate === null ? null : h('rect', { x: String(x + step * .12), y: String(bottom - rate * height), width: String(step * .76), height: String(rate * height), class: 'lib-distribution-plot__bar' }),
        ), { on: { click: `select:${i}`, keydown: `key:${i}` } }), key: bin.id };
      }),
    )),
    p.bins.length === 0 ? textNode({ role: 'caption', tone: 'muted' }, {}, 'No observations') : null,
    h('div', { class: 'lib-distribution-plot__endpoints' },
      textNode({ role: 'caption', tone: 'muted' }, {}, p.startLabel ?? p.bins[0]?.label ?? ''),
      textNode({ role: 'caption', tone: 'muted' }, {}, p.endLabel ?? p.bins.at(-1)?.label ?? ''),
    ),
  );
}
export function distributionPlotHandlers(p: DistributionPlotProps): Handlers {
  const handlers: Handlers = {};
  p.bins.forEach((bin, i) => {
    handlers[`select:${i}`] = () => p.onSelect?.(bin.id);
    handlers[`key:${i}`] = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); p.onSelect?.(bin.id); }
    };
  });
  return handlers;
}

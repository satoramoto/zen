import { flag, h, slot, type Child, type Node } from '../../view/Tree.model';
import { stemConnectionsView } from './StemConnections.model';

export interface KnobStackProps {
  count?: number;
  stems?: boolean;
  full?: boolean;
}

/** Shared column geometry for stem and EQ knobs; compact rows keep full-size faces. */
export function knobStackTree(knobs: Child[], { stems = false, full = false }: Omit<KnobStackProps, 'count'> = {}): Node {
  const staggered = knobs.length > 4;
  return h('div', {
    class: 'play-eq-stack play-knob-stack', 'data-staggered': flag(staggered), 'data-full': flag(full),
    style: `--play-knob-count: ${knobs.length}`,
  },
  stems && staggered ? stemConnectionsView() : null,
  [0, 1].map(column => ({ ...h('div', { class: 'play-knob-column' },
    h('div', { class: 'play-knob-controls' }, knobs.map((knob, index) => index % 2 === column
      ? { ...h('div', { class: 'play-knob-cell', 'data-stem-order': stems ? String(index) : undefined, style: `grid-row: ${index + 1}` }, knob), key: String(index) }
      : null)),
    h('div', { class: 'play-knob-spacer', 'aria-hidden': 'true' }, stems && staggered && column === 0
      ? h('svg', { class: 'play-stem-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round' },
        h('path', { d: 'M3 10v4 M7.5 6v12 M12 3v18 M16.5 7v10 M21 10v4' }))
      : null)), key: String(column) })),
  );
}

export function knobStackView({ count = 4, ...props }: KnobStackProps = {}): Node {
  return knobStackTree(Array.from({ length: count }, (_, index) => slot(`knob${index}`)), props);
}

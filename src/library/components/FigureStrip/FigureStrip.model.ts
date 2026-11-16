// FigureStrip's model: a strip of figures, framework-free. Each is a term and its value with a
// small note, a direction tone when it moved and a link when it goes somewhere; the first can lead.
import { each, h, when, type Node } from '../../foundation/view/Tree.model';
import { textNode } from '../../primitives/Text/Text.model';

export interface Figure {
  label: string;
  value: string;
  note?: string;
  /** Which way it moved: the value takes success or danger. */
  direction?: 'up' | 'down';
  href?: string;
}

export interface FigureStripModelProps {
  figures: readonly Figure[];
  /** The first figure leads: larger, on a raised ground. */
  lead?: boolean;
  /** The strip's accessible name. */
  label?: string;
}

export function figureStripView({ figures, lead = false, label }: FigureStripModelProps): Node {
  return h(
    'dl',
    { class: 'lib-strip', 'data-part': 'root', 'aria-label': label },
    each(
      figures as Figure[],
      (f) => f.label,
      (f, i) => {
        const value = textNode(
          { role: 'numeral', size: lead && i === 0 ? 'display' : 'heading', tabular: true, tone: f.direction === 'up' ? 'success' : f.direction === 'down' ? 'danger' : undefined, className: 'lib-strip__value' },
          {},
          f.value,
        );
        return h(
          'div',
          { class: 'lib-strip__figure', 'data-part': 'figure', 'data-lead': lead && i === 0 ? 'true' : undefined },
          h('dt', { class: 'lib-strip__label' }, textNode({ role: 'body', size: 'caption', tone: 'muted' }, {}, f.label)),
          h(
            'dd',
            { class: 'lib-strip__body' },
            f.href ? h('a', { class: 'lib-strip__link', href: f.href }, value) : value,
            when(f.note !== undefined, () => textNode({ role: 'body', size: 'caption', tone: 'muted', className: 'lib-strip__note' }, {}, f.note!)),
          ),
        );
      },
    ),
  );
}

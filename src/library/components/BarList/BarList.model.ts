// BarList's model: ranked bars, framework-free. Each item's bar is its value as a share of the
// largest, never narrower than a sliver so a tiny one still shows; its name can link; its value and
// a note sit beside the bar.
import { each, h, styleText, when, type Node } from '../../foundation/view/Tree.model';
import { textNode } from '../../primitives/Text/Text.model';

export interface BarListItem {
  name: string;
  value: number;
  /** The value as it reads (`$1.2k`). Default the number. */
  display?: string;
  note?: string;
  href?: string;
}

export interface BarListModelProps {
  items: readonly BarListItem[];
  /** The list's accessible name. */
  label?: string;
}

/** Each bar's width, a percentage of the largest value, at least half a percent. */
export function barWidths(items: readonly BarListItem[]): number[] {
  const most = Math.max(0, ...items.map((i) => i.value));
  return items.map((i) => (most > 0 ? Math.max(Number(((Math.max(i.value, 0) / most) * 100).toFixed(1)), 0.5) : 0.5));
}

export function barListView({ items, label }: BarListModelProps): Node {
  const widths = barWidths(items);
  return h(
    'ul',
    { class: 'lib-bars', 'data-part': 'root', 'aria-label': label },
    each(
      items as BarListItem[],
      (item) => item.name,
      (item, i) =>
        h(
          'li',
          { class: 'lib-bars__item', 'data-part': 'item' },
          item.href
            ? h('a', { class: 'lib-bars__name', href: item.href }, textNode({ role: 'body', size: 'label' }, {}, item.name))
            : textNode({ role: 'body', size: 'label', className: 'lib-bars__name' }, {}, item.name),
          h('span', { class: 'lib-bars__rail', 'aria-hidden': 'true' }, h('i', { class: 'lib-bars__bar', style: styleText({ width: `${widths[i]}%` }) })),
          textNode({ role: 'body', size: 'label', weight: 'strong', tabular: true, className: 'lib-bars__value' }, {}, item.display ?? String(item.value)),
          when(item.note !== undefined, () => textNode({ role: 'body', size: 'caption', tone: 'muted', className: 'lib-bars__note' }, {}, item.note!)),
        ),
    ),
  );
}

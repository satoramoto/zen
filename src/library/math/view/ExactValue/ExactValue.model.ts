import { textNode } from '../../../primitives/Text.model';
import { h, when, type Node } from '../../../view/Tree.model';

/** Exact transport stays a string; the component never rounds or evaluates it. */
export interface ExactValueProps {
  value: string;
  label?: string;
  domain?: string;
  kind?: 'exact' | 'approximate';
  /** A human-readable precision statement supplied by the computation engine. */
  precision?: string;
  size?: 'body' | 'numeral';
}

export function exactValueView({ value, label, domain, kind = 'exact', precision, size = 'body' }: ExactValueProps): Node {
  return h('div', { class: 'lib-exact-value', 'data-kind': kind },
    when(!!label, () => textNode({ role: 'caption', tone: 'secondary' }, {}, label!)),
    textNode({ as: 'output', role: size === 'numeral' ? 'numeral' : 'code', className: 'lib-exact-value__value' },
      { 'aria-label': label ? `${label}: ${value}` : undefined, 'data-canonical': value }, value),
    textNode({ role: 'caption', tone: 'secondary' }, {},
      [domain, kind === 'exact' ? 'Exact' : 'Approximate', kind === 'approximate' ? precision : undefined].filter(Boolean).join(' · ')),
  );
}

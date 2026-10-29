import type { HueSlot } from '../../../components/core/hue';
import { textNode } from '../../../primitives/Text.model';
import { stackNode } from '../../../primitives/Stack.model';
import { h, when, type Node } from '../../../view/Tree.model';
import { exactValueView } from '../ExactValue/ExactValue.model';

export interface MathProperty { label: string; value: string }
export interface MathMembership {
  id: string;
  label: string;
  expression: string;
  matches: boolean;
  hue?: HueSlot;
}
/** Inspection is supplied by an owner: this component never infers mathematical facts. */
export interface MathInspectorProps {
  title: string;
  value: string;
  domain?: string;
  properties: readonly MathProperty[];
  memberships: readonly MathMembership[];
}

export function mathInspectorView({ title, value, domain, properties, memberships }: MathInspectorProps): Node {
  return stackNode({ as: 'section', gap: 4, className: 'lib-math-inspector' }, { 'aria-label': title },
    textNode({ as: 'h3', role: 'heading', className: 'lib-math-inspector__heading' }, {}, title),
    exactValueView({ value, domain, size: 'numeral', kind: 'exact' }),
    stackNode({ gap: 2 }, {},
      textNode({ as: 'h4', role: 'label', className: 'lib-math-inspector__heading' }, {}, 'Properties'),
      when(properties.length === 0, () => textNode({ role: 'caption', tone: 'secondary' }, {}, 'No properties supplied.')),
      h('dl', { class: 'lib-math-inspector__properties' }, properties.map((property, index) => ({
        ...h('div', { class: 'lib-math-inspector__property' },
          textNode({ as: 'dt', role: 'body', tone: 'secondary' }, {}, property.label),
          textNode({ as: 'dd', role: 'code', className: 'lib-math-inspector__property-value' }, {}, property.value),
        ), key: `${property.label}:${index}`,
      }))),
    ),
    stackNode({ gap: 2 }, {},
      textNode({ as: 'h4', role: 'label', className: 'lib-math-inspector__heading' }, {}, 'Membership'),
      when(memberships.length === 0, () => textNode({ role: 'caption', tone: 'secondary' }, {}, 'No membership predicates supplied.')),
      stackNode({ as: 'ul', gap: 3, className: 'lib-math-inspector__memberships' }, {}, memberships.map(membership => ({
        ...stackNode({ as: 'li', gap: 1 }, { 'data-membership': membership.id, 'data-matches': String(membership.matches) },
          stackNode({ direction: 'row', gap: 2, align: 'baseline', justify: 'between', wrap: true }, {},
            textNode({ role: 'body' }, {},
              textNode({ tone: membership.hue }, { 'aria-hidden': 'true' }, membership.matches ? '● ' : '○ '), membership.label),
            textNode({ role: 'caption', tone: 'secondary' }, {}, membership.matches ? 'Included' : 'Not included'),
          ),
          textNode({ as: 'code', role: 'code', size: 'caption', tone: 'secondary', className: 'lib-math-inspector__expression' }, {}, membership.expression),
        ), key: membership.id,
      }))),
    ),
  );
}

// Panel's model: a titled card, framework-free. Its heading (a link when it goes somewhere) at the
// level given, a small aside beside it (words, or a slot), an actions slot (a span switch), and its
// body, or its empty message when it has none.
import { component, h, slot, when, type ComponentNode } from '../../foundation/view/Tree.model';
import { textNode } from '../../primitives/Text/Text.model';

export interface PanelModelProps {
  title: string;
  href?: string;
  /** The heading's level. Default 2. */
  level?: 2 | 3 | 4;
  /** The title's type size: `heading` (default), or `body` or `label` (set strong) for a dense dashboard of many panels. */
  titleSize?: 'heading' | 'body' | 'label';
  /** Words beside the title (an `aside` slot takes their place). */
  aside?: string;
  /** What it says with no body. */
  empty?: string;
  className?: string;
}

/** Which of its slots the binding fills. */
export interface PanelSlots {
  children?: boolean;
  actions?: boolean;
  aside?: boolean;
}

export function panelView({ title, href, level = 2, titleSize, aside, empty, className }: PanelModelProps, slots: PanelSlots = {}): ComponentNode {
  const heading = textNode({ role: 'heading', size: titleSize === 'heading' ? undefined : titleSize, weight: titleSize && titleSize !== 'heading' ? 'strong' : undefined, className: 'lib-panel__title' }, {}, title);
  // The card is a raised Surface: a layout paints nothing itself.
  const body = [
    h(
      'header',
      { class: 'lib-panel__head', 'data-part': 'head' },
      h(`h${level}`, { class: 'lib-panel__heading' }, href ? h('a', { class: 'lib-panel__link', href }, heading) : heading),
      slots.aside ? h('span', { class: 'lib-panel__aside', 'data-part': 'aside' }, slot('aside')) : when(aside !== undefined, () => textNode({ role: 'body', size: 'caption', tone: 'muted', className: 'lib-panel__aside' }, { 'data-part': 'aside' }, aside!)),
      when(slots.actions === true, () => h('div', { class: 'lib-panel__actions', 'data-part': 'actions' }, slot('actions'))),
    ),
    slots.children
      ? h('div', { class: 'lib-panel__body', 'data-part': 'body' }, slot('children'))
      : when(empty !== undefined, () => textNode({ role: 'body', size: 'label', tone: 'muted', as: 'p', className: 'lib-panel__empty' }, { 'data-part': 'empty' }, empty!)),
  ];
  return component('Surface', { layer: 'raised', radius: 'card', border: true, as: 'section', className: className ? `lib-panel ${className}` : 'lib-panel', 'data-part': 'root' }, { slots: { children: body } });
}

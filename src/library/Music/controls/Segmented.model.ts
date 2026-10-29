import { flag, h, when, wire, type Handlers, type Node } from '../../view/Tree.model';

export interface SegmentedModelProps {
  items: readonly string[];
  itemLabels?: readonly (string | undefined)[];
  index: number;
  onChange?(next: number): void;
  disabled?: boolean;
  label?: string;
  name?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  title?: string;
  hint?: string;
}

/** The members of an enum parameter; accepts the source Param shape structurally. */
export const itemsOf = (param: { items?: readonly string[] }): readonly string[] => param.items ?? [];

export function segmentedView({ items, itemLabels, index, disabled = false, label, name, orientation = 'horizontal', className, title, hint }: SegmentedModelProps): Node {
  return h('div', { class: `wdg wdg-segmented${className ? ` ${className}` : ''}`, 'data-hint': hint },
    when(!!name, () => h('span', { class: 'wdg-caption' }, name!)),
    wire(h('div', {
      class: `wdg-segmented-body wdg-body wdg-segmented-${orientation}`,
      role: 'radiogroup', 'aria-label': label ?? name, 'aria-disabled': disabled ? 'true' : undefined, title,
    }, items.map((item, at) => ({ ...h('button', {
      type: 'button', role: 'radio', 'aria-checked': flag(at === index), 'aria-label': itemLabels?.[at] || undefined,
      tabindex: String(at === index ? 0 : -1), disabled: disabled ? '' : undefined,
    }, item), key: `${item}-${at}` }))), { bind: [['musicSegmented', { items, index, disabled, onChange: 'change' }]] }));
}

export const segmentedHandlers = (props: SegmentedModelProps): Handlers => ({ change: props.onChange });

import { flag, h, styleText, when, wire, type Handlers, type Node } from '../../view/Tree.model';
import type { SelectState } from '../../components/core/Select/Select.model';

export type { SelectState } from '../../components/core/Select/Select.model';
export const SELECT_CLOSED: SelectState = { open: false, active: 0 };
export interface SelectModelProps {
  items: readonly string[];
  index: number;
  onChange?(next: number): void;
  disabled?: boolean;
  label?: string;
  name?: string;
  width?: number;
  className?: string;
  title?: string;
  hint?: string;
}

export function selectView({ items, index, disabled = false, label, name, width, className, title, hint }: SelectModelProps,
  { open, active, id }: SelectState & { id: string } = { ...SELECT_CLOSED, id: 'music-select' }): Node {
  const chars = Math.max(0, ...items.map(item => item.length));
  const at = Math.max(0, Math.min(items.length - 1, index));
  const optionId = (which: number) => `${id}-option-${which}`;
  return h('div', {
    class: `wdg wdg-select${className ? ` ${className}` : ''}`, 'data-hint': hint,
    style: styleText({ '--wdg-select-chars': String(chars), '--wdg-select-width': width === undefined ? undefined : `${width}px` }),
  }, when(!!name, () => h('span', { class: 'wdg-caption' }, name!)),
  wire(h('button', {
    type: 'button', class: 'wdg-select-body wdg-body', role: 'combobox', 'aria-haspopup': 'listbox',
    'aria-expanded': flag(open), 'aria-controls': `${id}-menu`, 'aria-activedescendant': open ? optionId(active) : undefined,
    'aria-label': label ?? name, disabled: disabled ? '' : undefined, title,
  }, h('span', { class: 'wdg-select-label' }, items[at] ?? ''), h('span', { class: 'wdg-select-caret', 'aria-hidden': 'true' })), {
    bind: [['musicSelect', { items, index: at, open, active, disabled, onState: 'state', onChange: 'change' }]],
  }),
  when(open, () => wire(h('div', {
    id: `${id}-menu`, class: 'wdg-popup wdg-select-menu', popover: 'manual', role: 'listbox', 'aria-label': label ?? name,
  }, items.map((item, which) => ({ ...h('div', {
    id: optionId(which), class: 'wdg-select-option', role: 'option', 'aria-selected': flag(which === at),
    'data-active': which === active ? '' : undefined, 'data-chosen': which === at ? '' : undefined,
  }, h('span', { class: 'wdg-select-label' }, item)), key: `${item}-${which}` }))), {
    bind: [['musicSelectMenu', { items, index: at, active, onState: 'state', onChange: 'change' }]],
  })));
}

export const selectHandlers = (props: SelectModelProps, state: (next: SelectState) => void): Handlers => ({ state, change: props.onChange });

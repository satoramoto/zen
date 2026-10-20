// Checkbox's model: its props, the tree it draws from them (shared with Radio: the check and dash
// marks, the input's attributes) and the handlers that tree names. No framework: `Checkbox.tsx`
// (React) and `Checkbox.svelte` (Svelte) both pass `checkboxView` and `checkboxHandlers` to their
// `Tree`; an uncontrolled input's starting state, and a controlled one's restore after a rejected change,
// are the `checkDefault.ts` stores beside it.
import { textNode } from '../../../primitives/Text.model';
import { h, slot, when, wire, type Bind, type Handlers, type Node } from '../../../view/Tree.model';
import type { ControlSize } from '../Toggle/sizes';

/** A checkbox's or radio button's value: on, off, or mixed (some of what it stands for is on). */
export type ToggleValue = boolean | 'mixed';

/** The props a checkbox and a radio button share, besides the label (the `children` slot). */
export interface CheckModelProps {
  /** Without a label, give one. */
  'aria-label'?: string;
  size?: ControlSize;
  disabled?: boolean;
  /** Controlled; leave it out to let the input keep its own state, starting from `defaultChecked`. */
  checked?: ToggleValue;
  defaultChecked?: ToggleValue;
  /** The input's new state: true or false (a click always ends mixed). */
  onChange?: (checked: boolean) => void;
  name?: string;
  value?: string;
}

/** What the bindings tell the model about their slots: whether a label (`children`) was given. */
export interface CheckSlots {
  label: boolean;
}

/** The check, on a 16-unit box: it scales with the box. */
export function checkMarkNode(): Node {
  return h(
    'svg',
    { class: 'lib-check__mark lib-check__check', 'data-part': 'check', viewBox: '0 0 16 16', 'aria-hidden': 'true' },
    h('path', {
      d: 'M4.6 8.4 7 10.75 11.4 5.3',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.9',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }),
  );
}

/** The mixed state's dash, on the same 16-unit box. */
export function dashMarkNode(): Node {
  return h(
    'svg',
    { class: 'lib-check__mark lib-check__dash', 'data-part': 'dash', viewBox: '0 0 16 16', 'aria-hidden': 'true' },
    h('rect', { x: '4.75', y: '7', width: '6.5', height: '2', rx: '1', fill: 'currentColor' }),
  );
}

/**
 * The input both draw, laid over the box: controlled, its state in attrs (`checked`, and
 * `indeterminate` when `mixed` says so); uncontrolled, the `checkDefault` store sets it once.
 */
export function checkInputNode(type: 'checkbox' | 'radio', props: CheckModelProps, mixed: boolean): Node {
  const { checked, defaultChecked = false, disabled, name, value, 'aria-label': ariaLabel } = props;
  const controlled = checked !== undefined;
  const bind: Bind[] = controlled
    ? [['checkControlled', { checked: checked === true, ...(mixed ? { indeterminate: checked === 'mixed' } : {}) }]]
    : [['checkDefault',{ checked: defaultChecked === true, mixed: mixed && defaultChecked === 'mixed' }]];
  return wire(
    h('input', {
      class: 'lib-check__input',
      'data-part': 'input',
      type,
      name,
      // Only when given: an absent `value` keeps the input's own ("on").
      ...(value !== undefined ? { value } : {}),
      'aria-label': ariaLabel,
      disabled: disabled ? '' : undefined,
      ...(controlled ? { checked: checked === true ? '' : undefined, ...(mixed ? { indeterminate: checked === 'mixed' ? '' : undefined } : {}) } : {}),
    }),
    { on: { change: 'change' }, ...(bind.length ? { bind } : {}) },
  );
}

/** The root label, the box (input, face, `marks`) and the label slot, shared with Radio. */
export function checkRootNode(
  kind: 'checkbox' | 'radio',
  props: CheckModelProps,
  slots: CheckSlots,
  input: Node,
  marks: Node[],
  attrs: Record<string, string | undefined> = {},
): Node {
  const { size = 'regular', disabled } = props;
  return textNode(
    { as: 'label', role: 'body', className: `lib-check lib-${kind} lib-sized` },
    { 'data-part': 'root', 'data-size': size, ...attrs, 'data-disabled': disabled ? '' : undefined },
    h('span', { class: 'lib-check__box', 'data-part': 'box' }, input, h('span', { class: 'lib-check__face', 'data-part': 'face', 'aria-hidden': 'true' }), ...marks),
    when(slots.label, () => h('span', { class: 'lib-check__label', 'data-part': 'label' }, slot('children'))),
  );
}

/** The tree a checkbox draws: the label root, the box (input, face, check, dash) and the label. */
export function checkboxView(props: CheckModelProps, slots: CheckSlots): Node {
  return checkRootNode('checkbox', props, slots, checkInputNode('checkbox', props, true), [checkMarkNode(), dashMarkNode()]);
}

/** The callbacks the tree names: `change` hears the input's new state. */
export function checkboxHandlers({ onChange }: CheckModelProps): Handlers {
  return { change: (e: Event) => onChange?.((e.currentTarget as HTMLInputElement).checked) };
}

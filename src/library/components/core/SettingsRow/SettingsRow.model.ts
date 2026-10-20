// SettingsRow's model: its props and the tree it draws (the root Text's class, ARIA and inline
// style; the label, the control's box with its `children` slot, the hint). No framework:
// `SettingsRow.tsx` (React) and `SettingsRow.svelte` (Svelte) both pass `settingsRowView` to their
// `Tree`, with the control as the `children` slot.
import { textView } from '../../../primitives/Text.model';
import { h, slot, styleText, type Node } from '../../../view/Tree.model';

/** Every SettingsRow prop but its control (a React node or a Svelte snippet, so each renderer adds its own). */
export interface SettingsRowModelProps {
  /** The setting's name, in the label column ("Main timing"). */
  label: string;
  /** A short note after the control ("Fader button 7"). Empty: none. */
  hint?: string;
  /** The label column's width in px (the boards' 120). */
  labelWidth?: number;
  /** The base of the label's and hint's ids (`<id>-label`, `<id>-hint`). Default: one the renderer generates. */
  id?: string;
}

/**
 * The tree SettingsRow draws from its props: the root (a `body` Text as a `div`, a group named by
 * its label), the label, the control's box holding the `children` slot, and the hint.
 * `generatedId` is the renderer's own id (React's `useId`, Svelte's `$props.id()`), used when `id`
 * is unset.
 */
export function settingsRowView({ label, hint = '', labelWidth = 120, id }: SettingsRowModelProps, generatedId: string): Node {
  const base = id ?? generatedId;
  const labelId = `${base}-label`;
  const hintId = `${base}-hint`;
  const text = textView({ role: 'body', tabular: true, ariaRole: 'group', className: 'yh-settings-row' });
  return h(
    'div',
    {
      class: text.className,
      ...text.attrs,
      'data-part': 'root',
      'aria-labelledby': labelId,
      'aria-describedby': hint ? hintId : undefined,
      style: styleText({ '--yh-settings-label-w': `${labelWidth}px` }),
    },
    h('span', { class: 'yh-settings-row__label', 'data-part': 'label', id: labelId, title: label }, label),
    h('span', { class: 'yh-settings-row__control', 'data-part': 'control' }, slot('children')),
    hint ? h('span', { class: 'yh-settings-row__hint', 'data-part': 'hint', id: hintId, title: hint }, hint) : null,
  );
}

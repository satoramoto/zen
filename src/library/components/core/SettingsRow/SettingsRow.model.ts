// SettingsRow's model: its props and the row it draws (the root Text's props, class, ARIA and
// inline style; the label and hint parts). No framework: `SettingsRow.tsx` (React) and
// `SettingsRow.svelte` (Svelte) both render `settingsRowView`; each adds the control (its children).
import type { ElementView, TextModelProps } from '../../../primitives/Text.model';

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

/** What a renderer draws: the root (a `Text` rendered as a `div`), its inline style, the label, the control's box and the hint. */
export interface SettingsRowView {
  /** The root's Text props. */
  text: TextModelProps;
  /** The root's class and its `data-*` and ARIA attributes. */
  root: ElementView;
  /** The root's inline style as declarations (`style`, for React) and as text (`styleText`, for Svelte). */
  style: Record<string, string>;
  styleText: string;
  /** The label's text and attributes. */
  label: { text: string; className: string; attrs: Record<string, string | undefined> };
  /** The control's box. */
  control: ElementView;
  /** The hint's text and attributes, or null for none. */
  hint: { text: string; className: string; attrs: Record<string, string | undefined> } | null;
}

/** The row SettingsRow draws from its props; `generatedId` is the renderer's own id, used when `id` is unset. */
export function settingsRowView({ label, hint = '', labelWidth = 120, id }: SettingsRowModelProps, generatedId: string): SettingsRowView {
  const base = id ?? generatedId;
  const labelId = `${base}-label`;
  const hintId = `${base}-hint`;
  const width = `${labelWidth}px`;
  return {
    text: { role: 'body', tabular: true, ariaRole: 'group' },
    root: {
      className: 'yh-settings-row',
      attrs: { 'data-part': 'root', 'aria-labelledby': labelId, 'aria-describedby': hint ? hintId : undefined },
    },
    style: { '--yh-settings-label-w': width },
    styleText: `--yh-settings-label-w: ${width}`,
    label: { text: label, className: 'yh-settings-row__label', attrs: { 'data-part': 'label', id: labelId, title: label } },
    control: { className: 'yh-settings-row__control', attrs: { 'data-part': 'control' } },
    hint: hint ? { text: hint, className: 'yh-settings-row__hint', attrs: { 'data-part': 'hint', id: hintId, title: hint } } : null,
  };
}

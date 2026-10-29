import { textNode } from '../../../primitives/Text.model';
import { surfaceNode } from '../../../primitives/Surface.model';
import { focusRing } from '../../../primitives/Ring';
import { h, when, wire, type Handlers, type Node } from '../../../view/Tree.model';

/** A controlled expression string. Parsing and evaluation belong to its owner. */
export interface ExpressionFieldProps {
  /** Unique within the document; links the label and supporting messages. */
  id: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  /** Enter commits; IME composition does not. No code executes in this component. */
  onCommit?: (value: string) => void;
  onCancel?: () => void;
  description?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
}
export function expressionFieldView(props: ExpressionFieldProps): Node {
  const { id, label, value, description, error, placeholder, disabled, readOnly } = props;
  const describedBy = [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return h('div', { class: 'lib-expression-field', 'data-invalid': error ? '' : undefined },
    textNode({ as: 'label', role: 'label' }, { for: id }, label),
    surfaceNode({ material: 'well', radius: 'input', className: 'lib-expression-field__well' }, {},
      wire(textNode({ as: 'input', role: 'code', className: `lib-expression-field__input ${focusRing}` }, {
        id, type: 'text', value, placeholder, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
        'aria-describedby': describedBy, 'aria-invalid': error ? 'true' : undefined,
        disabled: disabled ? '' : undefined, readonly: readOnly ? '' : undefined,
      }), { on: { input: 'change', keydown: 'key' } }),
    ),
    when(!!description, () => textNode({ as: 'div', role: 'caption', tone: 'secondary' }, { id: `${id}-description` }, description!)),
    when(!!error, () => textNode({ as: 'div', role: 'caption', tone: 'danger' }, { id: `${id}-error`, role: 'alert' }, error!)),
  );
}
export function expressionFieldHandlers(props: ExpressionFieldProps): Handlers {
  return {
    change: (event: Event) => { if (!props.disabled && !props.readOnly) props.onChange?.((event.currentTarget as HTMLInputElement).value); },
    key: (event: KeyboardEvent) => {
      if (props.disabled || event.isComposing) return;
      if (event.key === 'Enter') { event.preventDefault(); if (!props.error && !props.readOnly) props.onCommit?.((event.currentTarget as HTMLInputElement).value); }
      if (event.key === 'Escape') { event.preventDefault(); props.onCancel?.(); }
    },
  };
}

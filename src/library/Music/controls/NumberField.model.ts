import { h, styleText, when, wire, type Handlers, type Node } from '../../view/Tree.model';
import { paramSurface } from '../gesture/paramGesture';
import { format } from '../param/format';
import { clamp, fractionOf, quantize, type Param } from '../param/param';
import { defaultOrigin, fillFrom, type FillOrigin } from './fill';
import { hintAttribute } from './hint';
import { reserved } from './reserve';

export interface NumberFieldProps {
  param: Param;
  value: number;
  onChange(next: number): void;
  onRelease?(): void;
  disabled?: boolean;
  display?: string;
  label?: string;
  name?: string;
  editable?: boolean;
  showFill?: boolean;
  origin?: FillOrigin;
  width?: number;
  travel?: number;
  className?: string;
  title?: string;
  hint?: string;
}
export function numberFieldView(props: NumberFieldProps, draft: string | null = null): Node {
  const { param, value, disabled = false, display, label, name = param.shortName ?? param.name, editable = true, showFill = true, origin = defaultOrigin(param), width, travel, className, title, hint } = props;
  const text = display ?? format(param, value);
  const body = draft === null
    ? wire(h('div', { class: 'wdg-number-body wdg-body', title, ...paramSurface({ ...props, axis: 'horizontal', label: label ?? name }) },
      when(showFill, () => h('span', { class: 'wdg-number-fill', 'aria-hidden': 'true' })),
      h('span', { class: 'wdg-number-text' }, text),
      when(showFill, () => h('span', { class: 'wdg-number-ink', 'aria-hidden': 'true' }, text)),
    ), { bind: [['musicParamGesture', { param, value, disabled, axis: 'horizontal', travel, typeable: editable && param.kind !== 'enum' && param.kind !== 'blob' && !disabled, onChange: 'change', onRelease: 'release', onEdit: 'edit' }]] })
    : wire(h('input', { class: 'wdg-number-body wdg-body wdg-number-input', value: draft, 'aria-label': label ?? name, inputmode: 'decimal' }), { bind: [['musicNumberFieldEditor', { onDraft: 'edit', onCommit: 'commit', onCancel: 'cancel' }]] });
  return h('div', {
    class: `wdg wdg-number${className ? ` ${className}` : ''}`, ...hintAttribute(hint),
    style: styleText(Object.fromEntries(Object.entries({ ...reserved(param), ...fillFrom(param, origin, fractionOf(param, value)), ...(width === undefined ? {} : { '--wdg-number-width': `${width}px` }) }).map(([key, v]) => [key, String(v)]))),
  }, when(!!name, () => h('span', { class: 'wdg-caption' }, name)), { ...body, key: draft === null ? 'body' : 'editor' });
}
export function numberFieldHandlers(props: NumberFieldProps, setDraft: (draft: string | null) => void): Handlers {
  return {
    change: props.onChange, release: props.onRelease, edit: setDraft,
    commit(text: string) {
      setDraft(null);
      const parsed = Number.parseFloat(text);
      if (Number.isNaN(parsed)) return;
      props.onChange(quantize(props.param, clamp(props.param, parsed)));
      props.onRelease?.();
    },
    cancel: () => setDraft(null),
  };
}

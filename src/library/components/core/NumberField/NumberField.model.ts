// NumberField's model: its props, the tree it draws from them and the text being typed (classes,
// `data-*`, ARIA, the `--lib-param-*` its inline style carries, the stores it binds) and the
// handlers that tree names. No framework: `NumberField.tsx` (React) and `NumberField.svelte`
// (Svelte) both pass `numberFieldView` and `numberFieldHandlers` to their `Tree`, keeping the draft
// text as view state (`music/viewState.ts`); the drag, keys and editor are the `numberField` and
// `numberFieldEditor` stores (`numberFieldInput.ts`).
import { focusRing } from '../../../primitives/Ring';
import { textNode } from '../../../primitives/Text.model';
import { h, styleText, when, wire, type Handlers, type Node } from '../../../view/Tree.model';
import { defaultOrigin, fillFrom, hintAttribute, type FillOrigin } from '../Param/fill';
import { format, widestText } from '../Param/format';
import { clamp, fractionOf, quantize, type Param } from '../Param/param';

export type { FillOrigin };

/** `live.numbox`: drag it like a fader, or type into it. Mirrors `@openflow/widgets` NumberField. */
export interface NumberFieldModelProps {
  param: Param;
  value: number;
  onChange(next: number): void;
  onRelease?(): void;
  disabled?: boolean;
  /** Authoritative text; wins over the parameter's own formatting. */
  display?: string;
  /** For assistive technology. Defaults to the caption. */
  label?: string;
  /** The printed caption. Defaults to the parameter's short name, then its name. */
  name?: string;
  /** Typing a digit or pressing Enter opens the editor. Never for an enum. */
  editable?: boolean;
  /** The value drawn as a bar behind the text, as Live's own value boxes do. */
  showFill?: boolean;
  /** Where that bar grows from. Defaults to the middle when zero is the middle. */
  origin?: FillOrigin;
  /** In px. Defaults to the parameter's longest reading, so it never resizes. */
  width?: number;
  /** Pixels of drag for the full range. */
  travel?: number;
  className?: string;
  title?: string;
  /** A sentence for the window's hint strip, on the root as `data-hint`. Falls back to `title`. */
  hint?: string;
}

/** Whether a digit or Enter opens the editor: `editable`, not an enum or blob, not disabled. */
const typeableOf = ({ param, editable = true, disabled = false }: NumberFieldModelProps): boolean =>
  editable && param.kind !== 'enum' && param.kind !== 'blob' && !disabled;

/**
 * The tree NumberField draws from its props and `draft` (the text being typed, or `null` when not
 * editing): the root carrying the `--lib-param-*` variables, the caption (a `caption` Text), then
 * either the value window (a `numeral` Text binding the `numberField` store, holding the fill, the
 * reading and its ink) or the editor (a `numeral` input binding `numberFieldEditor`).
 */
export function numberFieldView(props: NumberFieldModelProps, draft: string | null = null): Node {
  const {
    param,
    value,
    disabled = false,
    display,
    label,
    name = param.shortName ?? param.name,
    showFill = true,
    origin = defaultOrigin(param),
    width,
    travel,
    className,
    title,
    hint,
  } = props;
  const text = display ?? format(param, value);
  const style: Record<string, string> = {
    '--lib-param-chars': String(widestText(param)),
    ...Object.fromEntries(Object.entries(fillFrom(param, origin, fractionOf(param, value))).map(([k, v]) => [k, String(v)])),
    ...(width === undefined ? {} : { '--lib-number-field-width': `${width}px` }),
  };

  const body =
    draft === null
      ? wire(
          textNode(
            { as: 'div', role: 'numeral', size: 'label', ariaRole: 'slider', className: `lib-number-field__body ${focusRing}` },
            {
              'data-part': 'body',
              title,
              tabindex: disabled ? '-1' : '0',
              'aria-label': label ?? name,
              'aria-valuemin': String(param.min),
              'aria-valuemax': String(param.max),
              'aria-valuenow': String(value),
              'aria-valuetext': text,
              'aria-orientation': 'horizontal',
              'aria-disabled': disabled ? 'true' : undefined,
            },
            when(showFill, () => h('span', { class: 'lib-number-field__fill', 'data-part': 'fill', 'aria-hidden': 'true' })),
            h('span', { class: 'lib-number-field__text', 'data-part': 'text' }, text),
            when(showFill, () => h('span', { class: 'lib-number-field__ink', 'data-part': 'ink', 'aria-hidden': 'true' }, text)),
          ),
          {
            bind: [
              [
                'numberField',
                { param, value, disabled, travel, typeable: typeableOf(props), onChange: 'change', onRelease: 'release', onEdit: 'edit' },
              ],
            ],
          },
        )
      : wire(
          textNode(
            { as: 'input', role: 'numeral', size: 'label', className: 'lib-number-field__body lib-number-field__input' },
            { 'data-part': 'input', value: draft, 'aria-label': label ?? name, inputmode: 'decimal' },
          ),
          { bind: [['numberFieldEditor', { onDraft: 'edit', onCommit: 'commit', onCancel: 'cancel' }]] },
        );

  return h(
    'div',
    {
      class: `lib-number-field${className ? ` ${className}` : ''}`,
      'data-disabled': disabled ? 'true' : undefined,
      ...hintAttribute(hint),
      style: styleText(style),
    },
    when(!!name, () => textNode({ role: 'caption', case: 'label', className: 'lib-number-field__caption' }, { 'data-part': 'caption' }, name)),
    { ...body, key: draft === null ? 'body' : 'input' },
  );
}

/**
 * The callbacks `numberFieldView`'s tree names: the value asked for and the gesture's end (the
 * props'), and the editor's draft, commit and cancel, which write the draft through `setDraft`.
 */
export function numberFieldHandlers(props: NumberFieldModelProps, setDraft: (draft: string | null) => void): Handlers {
  const { param, onChange, onRelease } = props;
  return {
    change: onChange,
    release: onRelease,
    edit: setDraft,
    commit(text: string) {
      setDraft(null);
      const parsed = Number.parseFloat(text);
      if (Number.isNaN(parsed)) return;
      onChange(quantize(param, clamp(param, parsed)));
      onRelease?.();
    },
    cancel: () => setDraft(null),
  };
}

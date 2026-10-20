// SearchField's model: its props, the tree it draws (the field, its hidden name, the input as a body
// Text, the clear button while filled) and the handlers that tree names. No framework:
// `SearchField.tsx` (React) and `SearchField.svelte` (Svelte) both pass `searchFieldView` to their
// `Tree`. The clear button's press is the `searchClear` store (`clear.ts`); the caller's `ref` is
// the `ref` store on the input.
import { textNode } from '../../../primitives/Text.model';
import { h, styleText, when, wire, type Handlers, type Node } from '../../../view/Tree.model';
import type { ElementRef } from '../../../layout/Screen.model';

/** What SearchField decides from, in any framework (each binding adds its own `ref`). */
export interface SearchFieldModelProps {
  /** The text in the field. The parent owns it: typing only calls `onInput`. */
  value?: string;
  /** The field's accessible name, visually hidden ("Search styles"). */
  label: string;
  /** The hint shown while the field is empty ("Search"). */
  placeholder?: string;
  /** A fixed width in px. Default: fills its container. */
  width?: number;
  /** The tooltip key, set as `data-tip` on the input for the app's tooltip layer. */
  tip?: string;
  /** Called with the field's text on every edit, and with '' when Esc or the clear button clears it. */
  onInput?: (value: string) => void;
  /** Called on every key the field doesn't handle itself (all but Esc on a non-empty field). */
  onKeyDown?: (event: KeyboardEvent) => void;
  /** Shown, not editable: the input is disabled, dimmed, and the clear button goes. */
  disabled?: boolean;
  /** The native hover hint on the field, e.g. "Search presets (⌘F)". */
  title?: string;
}

/** The field: the label (magnifier, hidden name, input), then the clear button while filled and enabled. */
export function searchFieldView({ value = '', label, placeholder, width, tip, disabled = false, title }: SearchFieldModelProps): Node {
  const filled = value !== '';
  return h(
    'div',
    {
      class: 'yh-search-field',
      'data-filled': filled ? 'true' : undefined,
      'data-disabled': disabled ? 'true' : undefined,
      title,
      style: styleText({ width: width === undefined ? '100%' : `${width}px` }),
    },
    h(
      'label',
      { class: 'yh-search-field__label' },
      h(
        'svg',
        { class: 'yh-search-field__glass', width: '14', height: '14', viewBox: '0 0 14 14', 'aria-hidden': 'true' },
        h('circle', { cx: '6', cy: '6', r: '4.5', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' }),
        h('line', { x1: '9.4', y1: '9.4', x2: '13', y2: '13', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round' }),
      ),
      h('span', { class: 'yh-search-field__name' }, label),
      wire(
        textNode(
          { as: 'input', role: 'body', className: 'yh-search-field__input' },
          {
            type: 'search',
            value,
            disabled: disabled ? '' : undefined,
            placeholder,
            autocomplete: 'off',
            spellcheck: 'false',
            'data-tip': tip,
          },
        ),
        { on: { input: 'input', keydown: 'keydown' }, bind: [['ref', { onRef: 'ref' }]] },
      ),
    ),
    when(filled && !disabled, () =>
      wire(
        h(
          'button',
          { type: 'button', class: 'yh-search-field__clear', 'aria-label': 'Clear search', tabindex: '-1' },
          h(
            'svg',
            { width: '10', height: '10', viewBox: '0 0 10 10', 'aria-hidden': 'true' },
            h('path', { d: 'M1.5 1.5l7 7M8.5 1.5l-7 7', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round' }),
          ),
        ),
        { bind: [['searchClear', { onClear: 'clear' }]] },
      ),
    ),
  );
}

/**
 * The handlers SearchField's tree names: `input` reports each edit; `keydown` clears a filled field
 * on Esc and stops it there, and hands every other key to `onKeyDown`; `clear` (the clear button)
 * asks for ''; `ref` hands the input to the caller's `ref`.
 */
export function searchFieldHandlers({ value = '', onInput, onKeyDown, ref }: SearchFieldModelProps & { ref?: ElementRef }): Handlers {
  return {
    input: (event: Event) => onInput?.((event.currentTarget as HTMLInputElement).value),
    keydown: (event: KeyboardEvent) => {
      if (event.key === 'Escape' && value !== '') {
        event.preventDefault();
        event.stopPropagation();
        onInput?.('');
        return;
      }
      onKeyDown?.(event);
    },
    clear: () => onInput?.(''),
    ref: (element: HTMLElement | null) => {
      if (typeof ref === 'function') ref(element);
      else if (ref) ref.current = element;
    },
  };
}

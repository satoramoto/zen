// StatusLine's model: its props, its assembly form, and the tree it draws (the root Text, the
// hint's parts, the message button) with its handlers. No framework: `StatusLine.tsx` (React) and
// `StatusLine.svelte` (Svelte) both pass `statusLineView` to their `Tree`.
import type { Forms } from '../../layout/assembly/types';
import { textView, type TextModelProps } from '../../primitives/Text.model';
import { each, h, styleText, wire, type Child, type Handlers, type Node } from '../../view/Tree.model';

/** The line's one form, for an assembled screen's footer: one control height, full width. */
export const STATUS_LINE_FORMS: Forms<'line'> = [
  { id: 'line', min: { w: 0, h: { control: 1 } }, ideal: { w: 0, h: { control: 1 } }, grow: { w: true } },
];

/** A control's tooltip, shown in the line's place while the control is hovered or focused. */
export interface StatusHint {
  /** The entry's title. */
  title: string;
  /** What the control does. */
  body: string;
  /** Its keys, already labelled ("Y", "Shift+Y / F5"). */
  keys?: string | null;
  /** Where it is on the Launchkey. */
  launchkey?: string | null;
}

/** Every StatusLine prop (it has no children). */
export interface StatusLineModelProps {
  /** The hovered or focused control's tooltip: shown in place of the message while set. */
  hint?: StatusHint | null;
  /** `message.text`. `null` or `''`: no message, the line is empty. */
  text?: string | null;
  /** `message.error`: the error mark shows before the text. Ignored while there is no text. */
  error?: boolean;
  /** `message.seq`. A new value re-creates the button's contents, so a repeat is announced again. */
  seq?: number;
  /** A fixed width in px. Unset, the line fills its container. */
  width?: number;
  /** The tooltip key from `app/src/help/tooltips.ts`, as `data-tip` on the button. `null` turns it off. */
  tip?: string | null;
  /** Called on click, Enter or Space on the line's button; the parent sends `clearMessage`. */
  onClear?: () => void;
}

/** One place a hinted control is reached: its label ("Key", "Launchkey") and the keycap text. */
export interface StatusHintPlace {
  label: string;
  key: string;
}

/** A Text primitive's element: its tag, with `textView`'s class and attributes, then `attrs`. */
function text(tag: string, model: TextModelProps, attrs: Record<string, string | undefined>, ...children: Child[]): Node {
  const view = textView(model);
  return h(tag, { class: view.className, ...view.attrs, ...attrs }, ...children);
}

/** The hint drawn in the message's place: its title, its body and, when it has any, the places it is reached. */
function hintView(hint: StatusHint): Node {
  const places: StatusHintPlace[] = [];
  if (hint.keys) places.push({ label: 'Key', key: hint.keys });
  if (hint.launchkey) places.push({ label: 'Launchkey', key: hint.launchkey });
  return h(
    'span',
    { class: 'yh-status-line-hint', 'data-part': 'hint', 'aria-hidden': 'true' },
    text('span', { weight: 'strong', tabular: true, className: 'yh-status-line-hint-title' }, { 'data-part': 'hint-title' }, hint.title),
    h('span', { class: 'yh-status-line-hint-body', 'data-part': 'hint-body' }, hint.body),
    places.length > 0
      ? h(
          'span',
          { class: 'yh-status-line-hint-meta', 'data-part': 'hint-meta' },
          each(
            places,
            (place) => place.label,
            (place) =>
              h(
                'span',
                { class: 'yh-status-line-hint-place', 'data-part': 'hint-place' },
                text('span', { role: 'caption', case: 'label', tabular: true, className: 'yh-status-line-hint-label' }, { 'data-part': 'hint-label' }, place.label),
                ' ',
                text('kbd', { role: 'caption', tabular: true, className: 'yh-status-line-key' }, { 'data-part': 'key' }, place.key),
              ),
          ),
        )
      : null,
  );
}

/** The error chip: the warning triangle and the word "Error", hidden from assistive tech. */
const errorTag = (): Node =>
  text(
    'span',
    { role: 'label', leading: 'tight', tabular: true, className: 'yh-status-line-tag' },
    { 'data-part': 'tag', 'aria-hidden': 'true' },
    h(
      'svg',
      { 'data-hue': 'warn', class: 'yh-status-line-mark', 'data-part': 'mark', width: '12', height: '12', viewBox: '0 0 12 12' },
      h('path', { d: 'M6 1.5 L11 10.5 H1 Z' }),
      h('path', { d: 'M6 5 V7.4' }),
      h('circle', { cx: '6', cy: '8.9', r: '0.6' }),
    ),
    'Error',
  );

/**
 * The tree the line draws from its props: the root (a body Text as a `p`, the polite status
 * region), the hint while one is set, and the message button while there is text. The button's
 * contents (the error chip and the text) are keyed on `seq`, so a new seq re-creates them inside
 * the same button, which keeps focus; its click is the `clear` handler.
 */
export function statusLineView({ hint = null, text: message = null, error = false, seq = 0, width, tip = 'display.status' }: StatusLineModelProps): Node {
  const root = textView({ tabular: true, ariaRole: 'status', className: 'yh-status-line' });
  return h(
    'p',
    { class: root.className, ...root.attrs, 'data-part': 'root', 'aria-live': 'polite', style: styleText(width === undefined ? undefined : { width: `${width}px` }) },
    hint ? hintView(hint) : null,
    message
      ? wire(
          h(
            'button',
            {
              type: 'button',
              class: hint ? 'yh-status-line-button yh-status-line-under' : 'yh-status-line-button',
              'data-part': 'button',
              'data-tip': tip ?? undefined,
            },
            error ? { ...errorTag(), key: `tag-${seq}` } : null,
            // The space after "Error:" sits outside the hidden span: the accessible name trims each
            // element's text, so a space inside it would be lost ("Error:Can't").
            {
              ...h(
                'span',
                { class: 'yh-status-line-text', 'data-part': 'text' },
                error ? h('span', { class: 'yh-status-line-hidden', 'data-part': 'hidden' }, 'Error:') : null,
                error ? ` ${message}` : message,
              ),
              key: `text-${seq}`,
            },
            h(
              'svg',
              { class: 'yh-status-line-clear', 'data-part': 'clear', 'aria-hidden': 'true', width: '10', height: '10', viewBox: '0 0 10 10' },
              h('path', { d: 'M2 2 L8 8 M8 2 L2 8' }),
            ),
          ),
          { on: { click: 'clear' } },
        )
      : null,
  );
}

/** The callbacks the tree names: `clear`, the button's click (`onClear`, with no arguments). */
export function statusLineHandlers({ onClear }: StatusLineModelProps): Handlers {
  return { clear: () => onClear?.() };
}

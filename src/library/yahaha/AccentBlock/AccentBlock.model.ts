// AccentBlock's model: its props, the tree it draws from them (the element, its classes, `data-*`,
// ARIA and inline style, the shown text, the chevron) and the handlers that tree names. No
// framework: `AccentBlock.tsx` (React) and `AccentBlock.svelte` (Svelte) both pass
// `accentBlockView` and `accentBlockHandlers` to their `Tree`; the tooltip is the kernel's `tip`
// store (`src/library/view/tip.ts`).
import { textView } from '../../primitives/Text.model';
import { h, styleText, when, wire, type Handlers, type Node } from '../../view/Tree.model';
import type { TipAction } from '../../components/core/Button/Button.model';

export type { TipAction };

export interface AccentBlockModelProps {
  /** The text in the block ("Sunday Drive Pop", "Style", "Swap R1"). */
  label: string;
  /** Shown when the label is empty or whitespace only. */
  empty?: string;
  /** `button` calls `onPress` (the style name); `span` is a plain label (the knob page). */
  as?: 'span' | 'button';
  /** `line`: a control's height (the style line); `knob`: three quarters of it (a band header row). */
  size?: 'line' | 'knob';
  /** A fixed width in px; a longer label ends in an ellipsis. Default: as wide as the label. */
  width?: number;
  /** The button's accessible name when the label alone isn't enough ("Sunday Drive Pop: open the Browser"). */
  name?: string;
  /** The tooltip key, set as `data-tip` on the button. Ignored for `span`. */
  tip?: string;
  /** The app's tooltip hook, applied to the button when `tip` is set. Ignored for `span`. */
  tipAction?: TipAction;
  /** Called on a click, Space or Enter (`button` only). */
  onPress?: () => void;
  /**
   * The button's trailing chevron. Default `true`; `false` where the block already sits between
   * step keys (‹ name ›), so the line doesn't carry three arrows. Ignored for `span`.
   */
  chevron?: boolean;
}

/**
 * The tree AccentBlock draws from its props: the block (a `label` Text as a `button` or a `span`),
 * its text (the label, or `empty` when the label is blank) and, on a button, the chevron. A button
 * calls `press` on a click and binds the tooltip store when it has a `tip` (a span never does).
 */
export function accentBlockView({
  label,
  empty = '—',
  as = 'span',
  size = 'line',
  width,
  name,
  tip,
  chevron = true,
}: AccentBlockModelProps): Node {
  const button = as === 'button';
  const text = textView({ role: 'label', size: 'body', leading: 'tight', tabular: true, className: 'yh-accentblock' });
  const block = h(
    button ? 'button' : 'span',
    {
      class: text.className,
      ...text.attrs,
      style: styleText(width === undefined ? undefined : { width: `${width}px` }),
      ...(button
        ? {
            type: 'button',
            'aria-label': name,
            'data-part': 'block',
            'data-material': 'key',
            'data-face': 'accent',
            'data-size': size,
            'data-tip': tip,
          }
        : { 'data-part': 'block', 'data-face': 'accent', 'data-size': size }),
    },
    h('span', { class: 'yh-accentblock__text', 'data-part': 'text' }, label.trim() === '' ? empty : label),
    when(button && chevron, () =>
      h('svg', { class: 'yh-accentblock__chevron', 'data-part': 'chevron', viewBox: '0 0 12 12', 'aria-hidden': 'true' }, h('path', { d: 'M4.5 2.5 8 6l-3.5 3.5' })),
    ),
  );
  if (!button) return block;
  return wire(block, {
    on: { click: 'press' },
    // A blank key draws no tooltip; the store applies a key only with an action to apply.
    ...(tip ? { bind: [['tip', { tip, tipAction: 'tipAction' }]] } : {}),
  });
}

/** The callbacks `accentBlockView`'s tree names: `press` (the button's click) and the tooltip's. */
export function accentBlockHandlers(props: AccentBlockModelProps): Handlers {
  return {
    press: () => props.onPress?.(),
    tipAction: props.tipAction,
  };
}

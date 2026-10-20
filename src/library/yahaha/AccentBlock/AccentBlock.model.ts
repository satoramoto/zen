// AccentBlock's model: its props and the block it draws from them (the element, its classes,
// `data-*`, ARIA and inline style, the shown text, the chevron). No framework: `AccentBlock.tsx`
// (React) and `AccentBlock.svelte` (Svelte) both render `accentBlockView`; the tooltip binding is
// the store beside it (`tip.ts`).
import type { ElementView, TextModelProps } from '../../primitives/Text.model';
import type { TipAction } from './tip';

export type { TipAction } from './tip';

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

/** Inline style declarations, property to value (custom properties included). */
export type StyleMap = Record<string, string>;

/** What a renderer draws: the block (a `Text`), its text and whether it has a chevron. */
export interface AccentBlockView {
  /** The block's element: `button` or `span`. */
  as: 'button' | 'span';
  /** The block's Text props. */
  text: TextModelProps;
  /** The block's class (beside Text's own) and its `type`, `data-*` and ARIA attributes. */
  block: ElementView;
  /** The block's inline style, or undefined for none. */
  style: StyleMap | undefined;
  /** The text shown: the label, or `empty` when the label is blank. */
  shown: string;
  /** Whether the trailing chevron is drawn (`button` only). */
  chevron: boolean;
  /** Whether the tooltip hook applies: a button with both `tip` and `tipAction`. */
  tip: boolean;
}

/** The block AccentBlock draws from its props. */
export function accentBlockView({
  label,
  empty = '—',
  as = 'span',
  size = 'line',
  width,
  name,
  tip,
  tipAction,
  chevron = true,
}: AccentBlockModelProps): AccentBlockView {
  const button = as === 'button';
  return {
    as: button ? 'button' : 'span',
    text: { role: 'label', size: 'body', leading: 'tight', tabular: true },
    block: {
      className: 'yh-accentblock',
      attrs: button
        ? {
            type: 'button',
            'aria-label': name,
            'data-part': 'block',
            'data-material': 'key',
            'data-face': 'accent',
            'data-size': size,
            'data-tip': tip,
          }
        : { 'data-part': 'block', 'data-face': 'accent', 'data-size': size },
    },
    style: width === undefined ? undefined : { width: `${width}px` },
    shown: label.trim() === '' ? empty : label,
    chevron: button && chevron,
    tip: button && !!tip && tipAction !== undefined,
  };
}

/** A style map as an inline `style` string (`width: 240px`), or undefined for none. */
export function styleText(style: StyleMap | undefined): string | undefined {
  return style === undefined ? undefined : Object.entries(style).map(([property, value]) => `${property}: ${value}`).join('; ');
}

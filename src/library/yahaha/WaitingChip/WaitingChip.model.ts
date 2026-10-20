// WaitingChip's model: its props and the chip it draws from them (classes, `data-*`, the inline
// arrow role, the label), or nothing for a blank label. No framework: `WaitingChip.tsx` (React) and
// `WaitingChip.svelte` (Svelte) both render `waitingChipView`.
import type { ElementView, TextModelProps } from '../../primitives/Text.model';
import { SECTION_STATE_COLOUR } from '../hues';

export type WaitingHue = 'intro' | 'main' | 'ending' | 'brk' | 'fill' | 'a' | 't';
export type WaitingSize = 'count' | 'line' | 'display';

const SECTIONS: ReadonlySet<WaitingHue> = new Set<WaitingHue>(['intro', 'main', 'ending', 'brk', 'fill']);

export interface WaitingChipModelProps {
  /** The text, drawn as given (a section's shown name or a style's name). Blank: nothing renders. */
  label: string;
  /**
   * Which thing is waiting: a section (`intro`, `main`, `ending`, `brk`, `fill`), `a` a queued
   * style, `t` (default) anything else. It tints the "next" arrow, not the words. Next is
   * `--accent` everywhere, so every value but `a` draws the arrow in it (a section takes no hue of
   * its own); a queued style (`a`) reads `--style`.
   */
  hue?: WaitingHue;
  /** `count` control-height label text; `line` the same, capped and ellipsized (style line); `display` the display size. */
  size?: WaitingSize;
}

/** Inline style declarations, property to value (custom properties included). */
export type StyleMap = Record<string, string>;

/** What a renderer draws: the chip (a `Text`), its inline style, the arrow and the label. */
export interface WaitingChipView {
  /** The chip's Text props. */
  text: TextModelProps;
  /** The chip's class (beside Text's own) and its `data-*` attributes. */
  chip: ElementView;
  /** The chip's inline style (a section's arrow role), or undefined for none. */
  style: StyleMap | undefined;
  /** The arrow's class and attributes. */
  arrow: ElementView;
  /** The label, untrimmed. */
  label: string;
}

/** The chip WaitingChip draws from its props, or null when the label is blank (nothing renders). */
export function waitingChipView({ label, hue = 't', size = 'count' }: WaitingChipModelProps): WaitingChipView | null {
  if (label.trim() === '') return null;
  return {
    text: { role: size === 'display' ? 'display' : 'body', size: size === 'display' ? undefined : 'label', tabular: true },
    chip: {
      className: `yh-waiting-chip yh-waiting-chip--${size}`,
      attrs: { 'data-part': 'chip', 'data-face': 'waiting', 'data-hue': hue, 'data-size': size },
    },
    style: SECTIONS.has(hue) ? { '--yh-waiting-chip-hue': SECTION_STATE_COLOUR.next } : undefined,
    arrow: { className: 'yh-waiting-chip__arrow', attrs: { 'data-part': 'arrow', 'aria-hidden': 'true' } },
    label,
  };
}

/** A style map as an inline `style` string (`--yh-waiting-chip-hue: var(--accent)`), or undefined for none. */
export function styleText(style: StyleMap | undefined): string | undefined {
  return style === undefined ? undefined : Object.entries(style).map(([property, value]) => `${property}: ${value}`).join('; ');
}

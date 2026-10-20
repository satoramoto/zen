// WaitingChip's model: its props and the tree it draws from them (classes, `data-*`, the inline
// arrow role, the label), or nothing for a blank label. No framework: `WaitingChip.tsx` (React) and
// `WaitingChip.svelte` (Svelte) both pass `waitingChipView` to their `Tree`.
import { textView } from '../../primitives/Text.model';
import { h, styleText, type Node } from '../../view/Tree.model';
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

/**
 * The tree WaitingChip draws from its props (the chip, a `Text`, holding the arrow and the label
 * untrimmed), or null when the label is blank (nothing renders). It names no handlers.
 */
export function waitingChipView({ label, hue = 't', size = 'count' }: WaitingChipModelProps): Node | null {
  if (label.trim() === '') return null;
  const text = textView({
    role: size === 'display' ? 'display' : 'body',
    size: size === 'display' ? undefined : 'label',
    tabular: true,
    className: `yh-waiting-chip yh-waiting-chip--${size}`,
  });
  return h(
    'span',
    {
      class: text.className,
      ...text.attrs,
      'data-part': 'chip',
      'data-face': 'waiting',
      'data-hue': hue,
      'data-size': size,
      style: styleText(SECTIONS.has(hue) ? { '--yh-waiting-chip-hue': SECTION_STATE_COLOUR.next } : undefined),
    },
    h('span', { class: 'yh-waiting-chip__arrow', 'data-part': 'arrow', 'aria-hidden': 'true' }),
    label,
  );
}

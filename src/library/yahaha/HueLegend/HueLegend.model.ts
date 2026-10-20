// HueLegend's model: its props, the default entries, and the tree it draws (the list, each entry
// with its part's `data-hue`, the chip and the word). No framework: `HueLegend.tsx` (React) and
// `HueLegend.svelte` (Svelte) both draw `hueLegendView` with `Tree`.
import type { HueSlot as Hue } from '../../components/core/hue';
import { stackView } from '../../primitives/Stack.model';
import { textView } from '../../primitives/Text.model';
import { each, h, type Node } from '../../view/Tree.model';
import { PART_HUE_INDEX, type Part } from '../hues';

/** A section family, as the original names its colour token. Sections take no hue now. */
export type Section = 'intro' | 'main' | 'ending' | 'brk' | 'fill';

/**
 * @deprecated Sections take no hue (`../hues`): every entry is `undefined`. Kept so code built on
 * the old API compiles; key parts with `PART_HUE_INDEX` instead.
 */
export const SECTION_HUE: Record<Section, Hue | undefined> = {
  intro: undefined,
  main: undefined,
  ending: undefined,
  brk: undefined,
  fill: undefined,
};

export interface HueLegendItem {
  /** The word ("Right 1"). */
  label: string;
  /** The part whose controls it keys (`r1`); its hue comes from `PART_HUE_INDEX`. */
  part?: Part;
  /**
   * @deprecated A section ("intro"). Accepted for older callers, but a section has no hue, so the
   * entry draws the outlined "no colour" chip.
   */
  hue?: Section;
}

/** The four parts in keyboard order, the legend's default entries. */
export const PART_LEGEND: HueLegendItem[] = [
  { label: 'Right 1', part: 'r1' },
  { label: 'Right 2', part: 'r2' },
  { label: 'Right 3', part: 'r3' },
  { label: 'Left', part: 'l' },
];

export interface HueLegendProps {
  /** The entries, left to right. Default: the four parts (`PART_LEGEND`). */
  items?: HueLegendItem[];
  /** The list's accessible name. */
  label?: string;
}

/** The `data-hue` of an entry: its part's hue slot, or none for a section. */
export function entryHue(item: HueLegendItem): string | undefined {
  return item.part ? String(PART_HUE_INDEX[item.part]) : undefined;
}

/**
 * The tree HueLegend draws: a row Stack as a `ul` named by `label`, and per entry a row Stack as an
 * `li` (its part's `data-hue`), a decorative chip and the word, a `caption` Text.
 */
export function hueLegendView({ items = PART_LEGEND, label = 'Part colours' }: HueLegendProps): Node {
  const list = stackView({ direction: 'row', gap: 4, align: 'center', className: 'yh-huelegend' });
  const entry = stackView({ direction: 'row', gap: 2, align: 'center', className: 'yh-huelegend__item' });
  const word = textView({ role: 'caption', case: 'label', leading: 'tight', className: 'yh-huelegend__word' });
  return h(
    'ul',
    { class: list.className, ...list.attrs, 'aria-label': label },
    each(
      items,
      (item, i) => `${i}-${item.label}`,
      (item) =>
        h(
          'li',
          { class: entry.className, ...entry.attrs, 'data-part': item.part, 'data-section': item.hue, 'data-hue': entryHue(item) },
          h('span', { class: 'yh-huelegend__chip', 'aria-hidden': 'true' }),
          h('span', { class: word.className, ...word.attrs }, item.label),
        ),
    ),
  );
}

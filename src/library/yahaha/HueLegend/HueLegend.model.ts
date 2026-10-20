// HueLegend's model: its props, the default entries, and the view a renderer draws (the list, each
// entry with its part's `data-hue`, the chip and the word). No framework: `HueLegend.tsx` (React)
// and `HueLegend.svelte` (Svelte) both render `hueLegendView`.
import type { HueSlot as Hue } from '../../components/core/hue';
import type { StackModelProps } from '../../primitives/Stack.model';
import type { ElementView, TextModelProps } from '../../primitives/Text.model';
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

/** A Stack-rendered element: its Stack props, its class (beside Stack's own) and its attributes. */
export interface StackElementView extends ElementView {
  stack: Omit<StackModelProps, 'className'>;
}

/** One entry: the `li` Stack, then a chip and the word. */
export interface HueLegendEntryView extends StackElementView {
  key: string;
  label: string;
}

/** What a renderer draws. */
export interface HueLegendView {
  /** The `ul` Stack. */
  list: StackElementView;
  entries: HueLegendEntryView[];
  /** Every entry's chip (a `span`). */
  chip: ElementView;
  /** Every entry's word: a Text with these props and class. */
  word: { text: TextModelProps; className: string };
}

/** The `data-hue` of an entry: its part's hue slot, or none for a section. */
export function entryHue(item: HueLegendItem): string | undefined {
  return item.part ? String(PART_HUE_INDEX[item.part]) : undefined;
}

export function hueLegendView({ items = PART_LEGEND, label = 'Part colours' }: HueLegendProps): HueLegendView {
  return {
    list: { stack: { direction: 'row', gap: 4, align: 'center' }, className: 'yh-huelegend', attrs: { 'aria-label': label } },
    entries: items.map((item, i) => ({
      key: `${i}-${item.label}`,
      label: item.label,
      stack: { direction: 'row', gap: 2, align: 'center' },
      className: 'yh-huelegend__item',
      attrs: { 'data-part': item.part, 'data-section': item.hue, 'data-hue': entryHue(item) },
    })),
    chip: { className: 'yh-huelegend__chip', attrs: { 'aria-hidden': 'true' } },
    word: { text: { role: 'caption', case: 'label', leading: 'tight' }, className: 'yh-huelegend__word' },
  };
}

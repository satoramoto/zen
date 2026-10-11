import type { Hue } from '../../components';
import './HueLegend.css';

/** A section family, as the original names its colour token. */
export type Section = 'intro' | 'main' | 'ending' | 'brk' | 'fill';

/**
 * The categorical hue each section wears on its pads. Fill has none: it is a one-bar variation
 * of whatever section is playing, not a fifth family, and the original's slate already read as grey.
 */
export const SECTION_HUE: Record<Section, Hue | undefined> = {
  intro: 1,
  main: 2,
  ending: 3,
  brk: 4,
  fill: undefined,
};

export interface HueLegendItem {
  /** The word ("Intro"). */
  label: string;
  /** The section whose pads it keys ("intro"); its hue comes from `SECTION_HUE`. */
  hue: Section;
}

export interface HueLegendProps {
  /** The entries, left to right. */
  items: HueLegendItem[];
  /** The list's accessible name. */
  label?: string;
}

/**
 * HueLegend: the key to the section pads' colours, in the pads header.
 *
 * **Job.** Tell a player which colour means which section (Intro, Main, Ending, Break, Fill) so a
 * lit pad's family reads at a glance without its label. It is a key, not a control, and should
 * sit quieter than the pads it explains.
 *
 * **Changed.** *Colour meaning*: the original gave five sections five private hues, while the
 * contract has four categorical hues. Intro, Main, Ending and Break take hues 1 to 4, the same
 * `data-hue` the library's pads wear, so the key and the pads cannot drift; Fill takes no hue and
 * is drawn as an outlined chip, because a fill is a one-bar variation of the playing section
 * rather than a family of its own (the original's slate was already near grey). *Legibility*:
 * the original wrote each word in its own hue, which put coloured text at caption size on the
 * ground (hard to read for the darker hues, and failing contrast in light palettes). Here the
 * words are secondary text and the colour lives in a chip shaped like a miniature pad (the
 * theme's control radius), large enough to identify the hue at small sizes (color.md › fewer
 * colours, stricter purpose; colour is never the text). *Rhythm*: a wider gap between entries
 * than between chip and word, so each pair groups (craft-details.md › proximity).
 *
 * **Kept.** One row, left to right in the given order, no wrapping, not interactive; the chips
 * are decorative and the words carry the meaning.
 */
export function HueLegend({ items, label = 'Section colours' }: HueLegendProps) {
  return (
    <ul className="yh-huelegend" aria-label={label}>
      {items.map((item) => (
        <li key={item.label} className="yh-huelegend__item" data-section={item.hue} data-hue={SECTION_HUE[item.hue]}>
          <span className="yh-huelegend__chip" aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

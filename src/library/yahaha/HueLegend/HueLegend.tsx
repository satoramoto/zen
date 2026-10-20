import { Tree } from '../../view/Tree';
import { hueLegendView, type HueLegendProps } from './HueLegend.model';
import '../../primitives/Stack.css';
import '../../primitives/Text.css';
import './HueLegend.css';

export { SECTION_HUE, PART_LEGEND, hueLegendView, entryHue, type Section, type HueLegendItem, type HueLegendProps } from './HueLegend.model';

/**
 * HueLegend: the key to the four part colours.
 *
 * **Job.** Tell a player which colour means which keyboard part (Right 1, Right 2, Right 3, Left),
 * so a fader, a keyboard zone or a sound name in that colour reads as that part at a glance. It is
 * a key, not a control, and should sit quieter than the controls it explains.
 *
 * **Changed.** *Colour meaning*: the four categorical hues now belong to the four parts and
 * nothing else (`../hues`), so this is no longer the key to the section pads: sections take no
 * hue (playing is `--selected`, next `--accent`) and need no key, since their pads already say
 * their name. It became the part legend instead, the one place a hue needs explaining: each entry
 * takes its part's `data-hue` from `PART_HUE_INDEX`, the same index the part's controls wear, so
 * the key and the controls cannot drift. An entry with only a section draws the outlined
 * "no colour of its own" chip. *Legibility*: the original wrote each word in its own hue, which
 * put coloured text at caption size on the ground (failing contrast in light palettes). Here the
 * words are secondary text and the colour lives in a chip shaped like a miniature pad (the
 * theme's control radius), large enough to identify the hue at small sizes (color.md › fewer
 * colours, stricter purpose; colour is never the text). *Rhythm*: a wider gap between entries
 * than between chip and word, so each pair groups (craft-details.md › proximity).
 *
 * **Kept.** One row, left to right in the given order, no wrapping, not interactive; the chips
 * are decorative and the words carry the meaning; `items` of `{ label, hue }` still render.
 *
 * **Tuning knobs.** `--yh-huelegend-radius` (the chip's corners: a third of `--radius-control`,
 * a pad in miniature).
 */
export function HueLegend(props: HueLegendProps) {
  return <Tree tree={hueLegendView(props)} />;
}

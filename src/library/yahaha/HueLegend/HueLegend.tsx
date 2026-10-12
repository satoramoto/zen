import type { HueSlot as Hue } from '../../components/core/hue';
import { Stack } from '../../primitives/Stack';
import { Text } from '../../primitives/Text';
import { PART_HUE_INDEX, type Part } from '../hues';
import './HueLegend.css';

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
export function HueLegend({ items = PART_LEGEND, label = 'Part colours' }: HueLegendProps) {
  return (
    <Stack as="ul" direction="row" gap={4} align="center" className="yh-huelegend" aria-label={label}>
      {items.map((item, i) => (
        <Stack
          as="li"
          direction="row"
          gap={2}
          align="center"
          key={`${i}-${item.label}`}
          className="yh-huelegend__item"
          data-part={item.part}
          data-section={item.hue}
          data-hue={item.part ? PART_HUE_INDEX[item.part] : undefined}
        >
          <span className="yh-huelegend__chip" aria-hidden="true" />
          <Text role="caption" case="label" leading="tight" className="yh-huelegend__word">
            {item.label}
          </Text>
        </Stack>
      ))}
    </Stack>
  );
}

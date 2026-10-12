import type { CSSProperties } from 'react';
import { SECTION_STATE_COLOUR } from '../hues';
import './WaitingChip.css';

export type WaitingHue = 'intro' | 'main' | 'ending' | 'brk' | 'fill' | 'a' | 't';
export type WaitingSize = 'count' | 'line' | 'display';

const SECTIONS: ReadonlySet<WaitingHue> = new Set<WaitingHue>(['intro', 'main', 'ending', 'brk', 'fill']);

export interface WaitingChipProps {
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
 * WaitingChip: names what comes next (the next section, a style waiting for the bar line).
 *
 * **Job.** Say what will play next, quieter than what plays now, so a player can read it at a
 * glance and know it is coming, not playing. A readout, not a control: no click, focus or tooltip.
 *
 * **Changed.** *Colour meaning, never colour alone:* the original tinted the words themselves in
 * the section's hue, so "coming" was carried only by a paler colour, and some hues failed contrast
 * as text on light grounds. Now a small forward-pointing arrow before the words says "next" by
 * shape, and only that arrow takes colour. The four categorical hues belong to the four parts
 * (`../hues`), so a waiting section no longer wears one: what is queued next reads `--accent`
 * (`SECTION_STATE_COLOUR.next`) whichever section it is, and the words name the section. A queued
 * style's arrow wears the contract's `--style` role hue, the colour of the style and what belongs
 * to it, so a waiting style reads as the style's and never as the section "next" role. The default
 * (`t`) arrow is `--accent` too: next is `--accent` everywhere, by default, so a caller that
 * forgets to pass a section still says "next" (it used to fall back to a grey `--text-3` arrow).
 * The words sit in secondary text so they pass contrast in every pack
 * (color.md, "Semantic Colors" and "Contrast and Readability"). *Hierarchy:* secondary text keeps
 * the chip a step below what plays; the `display` size uses the display face and weight so the
 * next section reads from across the room (typography.md, "Type Scale"), and its arrow is 0.45 ×
 * 0.6 em, as large in proportion as at label size, so beside display words it reads as an arrow,
 * not a bullet. *Rhythm:* heights come from the density's control height, the style line's cap
 * from it too (six control heights, where the original fixed 200px), and the arrow's gap from the
 * spacing scale, so the chip sits on the same line as the controls beside it. *Materials:* named
 * parts (`data-part`: chip, arrow); words and an arrow on whatever holds it, so no material.
 *
 * **Kept.** An empty or whitespace-only label renders nothing at all; the label is drawn untrimmed;
 * only `line` caps its width and ends in "…" (and shrinks in a flex row); tabular figures; the
 * section values of `hue`; the `data-face="waiting"`, `data-hue` and `data-size` hooks; no role,
 * focus or motion.
 */
export function WaitingChip({ label, hue = 't', size = 'count' }: WaitingChipProps) {
  if (label.trim() === '') return null;
  const style = SECTIONS.has(hue) ? ({ '--yh-waiting-chip-hue': SECTION_STATE_COLOUR.next } as CSSProperties) : undefined;
  return (
    <span
      className={`yh-waiting-chip yh-waiting-chip--${size}`}
      data-part="chip"
      data-face="waiting"
      data-hue={hue}
      data-size={size}
      style={style}
    >
      <span className="yh-waiting-chip__arrow" data-part="arrow" aria-hidden="true" />
      {label}
    </span>
  );
}

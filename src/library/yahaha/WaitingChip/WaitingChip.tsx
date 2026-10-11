import './WaitingChip.css';

export type WaitingHue = 'intro' | 'main' | 'ending' | 'brk' | 'fill' | 'a' | 't';
export type WaitingSize = 'count' | 'line' | 'display';

export interface WaitingChipProps {
  /** The text, drawn as given (a section's shown name or a style's name). Blank: nothing renders. */
  label: string;
  /**
   * Which thing is waiting: a section (`intro`, `main`, `ending`, `brk`, `fill`), `a` a queued
   * style (the accent), `t` neutral. It tints the "next" arrow, not the words.
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
 * shape, the hue colours only that arrow (which section, or the accent for a queued style), and the
 * words sit in secondary text so they pass contrast in every pack (color.md, "Semantic Colors" and
 * "Contrast and Readability"). *Hierarchy:* secondary text keeps the chip a step below what plays;
 * the `display` size uses the display face and weight so the next section reads from across the
 * room (typography.md, "Type Scale"). *Rhythm:* heights come from the density's control height and
 * the arrow's gap from the spacing scale, so the chip sits on the same line as the controls beside it.
 *
 * **Kept.** An empty or whitespace-only label renders nothing at all; the label is drawn untrimmed;
 * only `line` caps its width and ends in "…" (and shrinks in a flex row); tabular figures; the
 * `data-face="waiting"`, `data-hue` and `data-size` hooks; no role, focus or motion.
 */
export function WaitingChip({ label, hue = 't', size = 'count' }: WaitingChipProps) {
  if (label.trim() === '') return null;
  return (
    <span className={`yh-waiting-chip yh-waiting-chip--${size}`} data-face="waiting" data-hue={hue} data-size={size}>
      <span className="yh-waiting-chip__arrow" aria-hidden="true" />
      {label}
    </span>
  );
}

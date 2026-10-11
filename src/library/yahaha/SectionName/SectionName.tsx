import type { CSSProperties } from 'react';
import { SECTION_STATE_COLOUR, type SectionState } from '../hues';
import './SectionName.css';

/** The five section kinds. Kept as a hook (`data-hue`); a section takes no colour from its kind. */
export type SectionHue = 'intro' | 'main' | 'ending' | 'brk' | 'fill';

export interface SectionNameProps {
  /** The section's shown name ("Main B", "Intro II", "Fill"). Empty: "—". */
  label: string;
  /**
   * The section kind. Accepted for older callers and kept on `data-hue`, but it no longer picks a
   * colour: sections take no hue (`../hues`).
   */
  hue?: SectionHue;
  /** Where the section stands, which picks its colour role (`SECTION_STATE_COLOUR`). Default `playing`. */
  state?: SectionState;
  /** The band is stopped: the name steps back to the idle role, without its bloom. Same as `state="idle"`. */
  idle?: boolean;
  /**
   * The name's size, a CSS length ("64px", "var(--size-display)"), set as `--yh-section-name-size`
   * on the root. Default: that property's value, `--size-numeral`.
   */
  size?: string;
}

/**
 * The playing section's name on the display ("Main B"). A readout, not a control.
 *
 * **Job**: tell a player across the room which section is playing, and whether the band is
 * running at all. The name is the one thing on the display read from a distance.
 *
 * **Changed**: the name now sits on the display type at the numeral size, with tight display
 * tracking, so it shares a baseline and weight with the tempo beside it (hierarchy; see
 * `references/typography.md` on one display size per screen). The variation letter ("B",
 * "II") is set in the readout face with tabular numerals, so "Main A" → "Main B" changes one
 * glyph without the word moving (numerals). *Colour meaning*: the four categorical hues belong
 * to the four parts (`../hues`), so a section no longer wears one; its colour says where it
 * stands, not what kind it is: playing in `--selected` with the palette's `--bloom` (flat packs
 * draw it flat), next in `--accent`, idle in secondary text, absent in faint text
 * (`SECTION_STATE_COLOUR`). The word itself names the section (`references/color.md`: colour
 * carries meaning, not decoration). *Sizing*: the size is one custom property,
 * `--yh-section-name-size` (default `--size-numeral`), which a parent sets on the root or passes
 * as `size`, so a display can make the name its hero without overriding this widget's CSS.
 *
 * **Kept**: one line, never wrapping; idle drops out of the playing colour with no glow; an empty
 * name shows "—" rather than collapsing the layout; the `hue` prop and `data-hue` hook.
 */
export function SectionName({ label, hue = 'main', state, idle = false, size }: SectionNameProps) {
  const stands: SectionState = idle ? 'idle' : (state ?? 'playing');
  const shown = label.trim() === '' ? '—' : label.trim();
  // Split "Main B" into its word and its variation so the variation can use numerals.
  const match = /^(.*\S)\s+(\S{1,3})$/.exec(shown);
  const word = match ? match[1] : shown;
  const variant = match ? match[2] : '';
  return (
    <span
      className="yh-section-name"
      data-hue={hue}
      data-state={stands}
      data-idle={idle ? 'true' : undefined}
      style={
        {
          '--yh-section-tone': SECTION_STATE_COLOUR[stands],
          ...(size === undefined ? {} : { '--yh-section-name-size': size }),
        } as CSSProperties
      }
    >
      {word}
      {variant && (
        <>
          {' '}
          <span className="yh-section-name__variant">{variant}</span>
        </>
      )}
    </span>
  );
}

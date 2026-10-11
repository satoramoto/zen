import './SectionName.css';

/** The five section kinds; each maps onto one contract colour (see SectionName.css). */
export type SectionHue = 'intro' | 'main' | 'ending' | 'brk' | 'fill';

export interface SectionNameProps {
  /** The section's shown name ("Main B", "Intro II", "Fill"). Empty: "—". */
  label: string;
  /** The section kind, which picks its colour. */
  hue?: SectionHue;
  /** The band is stopped: the name steps back to muted text, without its bloom. */
  idle?: boolean;
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
 * glyph without the word moving (numerals). The glow follows the palette's `--bloom`, so flat
 * packs draw it flat instead of a fake shadow (colour meaning: light only where the
 * hardware glows). Five section kinds share four categorical hues: Fill, the shortest
 * section, takes the accent (`references/color.md`: colour carries meaning, not decoration).
 *
 * **Kept**: one line, never wrapping; idle drops to muted text with no glow; an empty name
 * shows "—" rather than collapsing the layout.
 */
export function SectionName({ label, hue = 'main', idle = false }: SectionNameProps) {
  const shown = label.trim() === '' ? '—' : label.trim();
  // Split "Main B" into its word and its variation so the variation can use numerals.
  const match = /^(.*\S)\s+(\S{1,3})$/.exec(shown);
  const word = match ? match[1] : shown;
  const variant = match ? match[2] : '';
  return (
    <span className="yh-section-name" data-hue={hue} data-idle={idle ? 'true' : undefined}>
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

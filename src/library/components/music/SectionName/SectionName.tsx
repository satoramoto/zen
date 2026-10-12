import type { CSSProperties } from 'react';
import './SectionName.css';

/**
 * Where a section stands: playing now, queued next, stopped, or not in the song. The app's holder
 * maps it to a contract colour (playing `--selected`, next `--accent`, idle `--text-2`, absent
 * `--text-4` in Yahaha's case); the name itself stays neutral.
 */
export type SectionState = 'playing' | 'next' | 'idle' | 'absent';

/** The five section kinds. Kept as a hook (`data-hue`); a section takes no colour from its kind. */
export type SectionHue = 'intro' | 'main' | 'ending' | 'brk' | 'fill';

export interface SectionNameProps {
  /** The section's shown name ("Main B", "Intro II", "Fill"). Empty: "—". */
  label: string;
  /**
   * The section kind. Accepted for older callers and kept on `data-hue`, but it no longer picks a
   * colour: sections take no hue.
   */
  hue?: SectionHue;
  /** Where the section stands, on `data-state` for the parent (the name itself stays neutral). Default `playing`. */
  state?: SectionState;
  /** The band is stopped. Same as `state="idle"`. */
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
 * **Job**: tell a player across the room which section is playing. The name is the one thing on
 * the display read from a distance.
 *
 * **Changed**: the name sits on the display type with tight display tracking (hierarchy; see
 * `references/typography.md` on one display size per screen). *Typography, one face per word:*
 * the variation ("B", "III") stays in the display face with tabular figures; it used to switch
 * to the readout face, which on mono packs set "Main **B**" in two faces and drew "III" as three
 * ticks, and the variations are letters, not digits. *Colour meaning, said once:* the name is
 * neutral and inherits its ink; whatever holds it says where it stands (in Yahaha, the Display's
 * `--selected` block while playing, its "then" tab for next). The state colours and the playing
 * glow it used to carry were overridden by every parent, so playing and idle differed only by a
 * halo; they are gone (what plays is `--selected`, and that is the holder's job).
 * `state` and `idle` still land on `data-state` for the parent's CSS. *Sizing*: the size is one
 * custom property, `--yh-section-name-size` (default `--size-numeral`), which a parent sets on the
 * root or passes as `size`, so a display can make the name its hero without overriding this
 * widget's CSS. *Materials:* two named parts (`data-part`: name, variant); ink on whatever holds
 * it, so it reads no material of its own.
 *
 * **Kept**: one line, never wrapping; an empty name shows "—" rather than collapsing the layout;
 * the `hue` prop and `data-hue` hook; `state` / `idle` on `data-state`.
 *
 * **Tuning knobs.**
 * - `--yh-section-name-size`: the name's size (default `--size-numeral`); a parent sets it on
 *   the element, or `size` inline.
 */
export function SectionName({ label, hue = 'main', state, idle = false, size }: SectionNameProps) {
  const stands: SectionState = idle ? 'idle' : (state ?? 'playing');
  const shown = label.trim() === '' ? '—' : label.trim();
  // Split "Main B" into its word and its variation, so a parent can style the variation.
  const match = /^(.*\S)\s+(\S{1,3})$/.exec(shown);
  const word = match ? match[1] : shown;
  const variant = match ? match[2] : '';
  return (
    <span
      className="yh-section-name"
      data-part="name"
      data-hue={hue}
      data-state={stands}
      data-idle={idle ? 'true' : undefined}
      style={size === undefined ? undefined : ({ '--yh-section-name-size': size } as CSSProperties)}
    >
      {word}
      {variant && (
        <>
          {' '}
          <span className="yh-section-name__variant" data-part="variant">{variant}</span>
        </>
      )}
    </span>
  );
}

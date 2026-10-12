import type { CSSProperties } from 'react';
import { SECTION_STATE_COLOUR } from '../hues';
import './StatusDot.css';

/**
 * A song section, as older callers passed it to `hue`. Every section reads the playing role.
 * @deprecated A section takes no hue of its own: every section draws the same playing role, so the
 * value adds nothing. Let the word beside the dot name the section. Kept so older callers compile.
 */
export type StatusDotSection = 'intro' | 'main' | 'ending' | 'brk' | 'fill';

/** The colour role: `ok` connected or running, `d` absent, `t` modified or waiting, or a section (the playing role). */
export type StatusDotHue = 'ok' | 'd' | 't' | StatusDotSection;

const SECTIONS: ReadonlySet<StatusDotHue> = new Set<StatusDotHue>(['intro', 'main', 'ending', 'brk', 'fill']);

export interface StatusDotProps {
  /**
   * The colour role: `ok` connected or running, `d` absent, `t` modified or waiting. A section
   * (`intro`, `main`, `ending`, `brk`, `fill`) is still accepted but takes no hue of its own: the
   * dot before "Section" marks what is playing, so every section reads `--selected`.
   */
  hue?: StatusDotHue;
  /** A ring in the hue, empty inside and never glowing: "armed, not yet" or "not there". */
  hollow?: boolean;
  /** The bloom around a solid dot (only palettes with a lamp bloom draw it). Ignored when `hollow`. */
  glow?: boolean;
  /** `md` every status dot, `sm` the rack readout's modified dot. */
  size?: 'md' | 'sm';
  /** `false` hides the dot but keeps its box, so the text after it doesn't move. */
  visible?: boolean;
  /** The accessible name for a dot with no word beside it ("Running"). Without it the dot is decorative. */
  name?: string;
}

/**
 * A small round light that says at a glance whether something is connected, running, waiting or
 * changed.
 *
 * **Job:** sit beside a word ("Launchkey", "Running", "Section") and let a player read its state
 * from across the room without reading the word. The parent picks every prop from state.
 *
 * **Changed:** *colour meaning*: `ok` reads `--success`, `d` (absent) the tertiary text role and `t`
 * the primary text role, so each pack keeps its own semantics instead of fixed greens (refero-design
 * `color.md` › Semantic colors). The four categorical hues belong to the four parts only
 * (`../hues`), so a section takes none: the section dot marks what is playing and reads
 * `--selected` (`SECTION_STATE_COLOUR.playing`) whichever section it is, the same role as
 * BarBeat; the word beside it names the section. *Never colour alone*: the face carries the
 * second channel, a filled lamp for "on" and a ring for "armed, not yet" or "not there", and the
 * ring is at least 1.5px so it stays a ring, not a smudge, under light palettes
 * (`craft-details.md`). Absent (`d`) is always that ring, in `--text-3`: a solid `--text-4` dot was
 * about 1.4:1 on black and vanished from a metre. *Alignment and rhythm*: the dot is sized in `em` (half the line's font
 * size, `sm` four tenths), so it scales with the word it marks under every type facet instead of
 * a fixed 6px that vanishes beside a 16px label (`typography.md`). The glow is the palette's own
 * `--bloom`, so it shows only on lamp palettes and needs no new token. Shape follows the dot, not
 * the chrome: a status lamp stays round even on square packs, so it never reads as a checkbox.
 *
 * **Kept:** the props (hue × hollow × glow × size rather than a state enum), the section values
 * of `hue` (so older callers compile), hidden keeping its box, decorative unless `name` is
 * given, a hidden dot silent to screen readers even when named, and no motion, focus or click.
 */
export function StatusDot({ hue = 'ok', hollow = false, glow = true, size = 'md', visible = true, name }: StatusDotProps) {
  // Absent is always the "not there" ring: a faint solid dot was invisible from a metre.
  const ring = hollow || hue === 'd';
  const glows = glow && !ring;
  const named = visible && name !== undefined;
  const style: CSSProperties = {};
  if (SECTIONS.has(hue)) (style as Record<string, string>)['--yh-status-dot-hue'] = SECTION_STATE_COLOUR.playing;
  if (!visible) style.visibility = 'hidden';
  return (
    <span
      className="yh-status-dot"
      data-part="root"
      data-hue={hue}
      data-face={ring ? 'hollow' : 'solid'}
      data-glow={glows ? 'true' : 'false'}
      data-size={size}
      style={Object.keys(style).length ? style : undefined}
      role={named ? 'img' : undefined}
      aria-label={named ? name : undefined}
      aria-hidden={named ? undefined : true}
    />
  );
}

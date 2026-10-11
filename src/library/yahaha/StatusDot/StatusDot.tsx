import './StatusDot.css';

/** The colour role: `ok` connected or running, `d` absent, `t` modified or waiting, or a section hue. */
export type StatusDotHue = 'ok' | 'd' | 't' | 'intro' | 'main' | 'ending' | 'brk' | 'fill';

export interface StatusDotProps {
  /** The colour role: `ok` connected or running, `d` absent, `t` modified or waiting, or a section hue. */
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
 * changed, in the colour of what it belongs to.
 *
 * **Job:** sit beside a word ("Launchkey", "Running", "Section") and let a player read its state
 * from across the room without reading the word. The parent picks every prop from state.
 *
 * **Changed:** *colour meaning*: `ok` reads `--success`, `d` the faint text role and `t` the
 * primary text role, and the five sections take the palette's categorical hues (`--hue-1..4` for intro,
 * main, ending and break, and an even mix of the first two for Fill, the same mapping as BarBeat
 * and WaitingChip), so each pack keeps its own semantics instead of fixed greens
 * (refero-design `color.md` › Semantic colors). *Never colour alone*: the face carries the second
 * channel, a filled lamp for "on" and a ring for "armed, not yet" or "not there", and the ring is at
 * least 1.5px so it stays a ring, not a smudge, under light palettes (`craft-details.md`).
 * *Alignment and rhythm*: the dot is sized in `em` (half the line's font size, `sm` four tenths), so
 * it scales with the word it marks under every type facet instead of a fixed 6px that vanishes beside
 * a 16px label (`typography.md`). The glow is the palette's own `--bloom`, so it shows only on lamp
 * palettes and needs no new token. Shape follows the dot, not the chrome: a status lamp stays round
 * even on square packs, so it never reads as a checkbox.
 *
 * **Kept:** the props (hue × hollow × glow × size rather than a state enum), hidden keeping its box,
 * decorative unless `name` is given, a hidden dot silent to screen readers even when named, and no
 * motion, focus or click.
 */
export function StatusDot({ hue = 'ok', hollow = false, glow = true, size = 'md', visible = true, name }: StatusDotProps) {
  const glows = glow && !hollow;
  const named = visible && name !== undefined;
  return (
    <span
      className="yh-status-dot"
      data-hue={hue}
      data-face={hollow ? 'hollow' : 'solid'}
      data-glow={glows ? 'true' : 'false'}
      data-size={size}
      style={visible ? undefined : { visibility: 'hidden' }}
      role={named ? 'img' : undefined}
      aria-label={named ? name : undefined}
      aria-hidden={named ? undefined : true}
    />
  );
}

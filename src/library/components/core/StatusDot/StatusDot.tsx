import { Tree } from '../../../view/Tree';
import { statusDotView, type StatusDotModelProps } from './StatusDot.model';
import './StatusDot.css';

// The props and the face are framework-free, in the model; this file and `StatusDot.svelte` only
// hand the model's tree to their `Tree`.
export type { StatusDotSection, StatusDotHue, StatusDotModelProps } from './StatusDot.model';

export type StatusDotProps = StatusDotModelProps;

/**
 * A small round light that says at a glance whether something is connected, running, waiting or
 * changed.
 *
 * **Job:** sit beside a word ("Launchkey", "Running", "Section") and let a player read its state
 * from across the room without reading the word. The parent picks every prop from state.
 *
 * **Changed:** *colour meaning*: `ok` reads `--success`, `d` (absent) the tertiary text role and `t`
 * the primary text role, so each pack keeps its own semantics instead of fixed greens (refero-design
 * `color.md` › Semantic colors). The categorical hue slots are an app's identity colours (Yahaha
 * gives them to its parts), so a status takes none: the section dot marks what is playing and
 * reads `--selected` whichever section it is; the word beside it names the section. *Never colour alone*: the face carries the
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
 *
 * **Tuning knobs**
 * - `--yh-status-dot-*`: the dot's `-hue` (its colour role; set inline for a section), `-size`
 *   (its diameter in `em`, per `size`) and `-round` (its corner radius, round on every pack).
 */
export function StatusDot(props: StatusDotProps) {
  return <Tree tree={statusDotView(props)} />;
}

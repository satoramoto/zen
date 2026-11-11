// A lamp's colour as CSS, shared by the surface's cells and the display's. A table colour is its
// `--push-lamp-N` property; a meaning is one of the pack's own meaning colours, so a pack can
// restate it (openspec: push-theme, "State colours are named, not indexed"). The `--push-white`,
// `--push-select`, `--push-solo` and `--push-unlit` properties are set by the part that draws the
// lamp, where `--text-1` and `--hue-1` still mean the pack's.
import { lampShadeCss, lampVar } from '../../foundation/themes/lamps';
import type { Lamp, LampMeaning } from '../model/types';

const MEANING: Record<LampMeaning, string> = {
  white: 'var(--push-white)',
  play: 'var(--success)',
  queue: 'var(--success)',
  note: 'var(--success)',
  record: 'var(--danger)',
  stop: 'var(--danger)',
  select: 'var(--push-select)',
  solo: 'var(--push-solo)',
  root: 'var(--push-solo)',
  mute: 'var(--warning)',
  warn: 'var(--warning)',
  accent: 'var(--accent)',
};

/** A colour (a table index or a meaning) as CSS. No colour is white. */
export const colourCss = (colour: Lamp['colour']): string => (typeof colour === 'number' ? lampVar(colour) : MEANING[colour ?? 'white']);

/** A lamp's colour as CSS, in the shade asked for (dim by default when the lamp is dim). */
export function lampCss(lamp: Lamp): string {
  return lampShadeCss(colourCss(lamp.colour), lamp.shade ?? (lamp.state === 'dim' ? 'dim' : 'lit'), 'var(--push-unlit)');
}

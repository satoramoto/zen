// StatusDot's model: its props and the dot it draws from them (class, `data-*`, ARIA and the inline
// style). No framework: `StatusDot.tsx` (React) and `StatusDot.svelte` (Svelte) both render `statusDotView`.
import type { ElementView } from '../../../primitives/Text.model';

/** What a deprecated section value draws: the playing (selected) role, whichever section it is. */
const SECTION_COLOUR = 'var(--selected)';

/**
 * A song section, as older callers passed it to `hue`. Every section reads the playing role.
 * @deprecated A section takes no hue of its own: every section draws the same playing role, so the
 * value adds nothing. Let the word beside the dot name the section. Kept so older callers compile.
 */
export type StatusDotSection = 'intro' | 'main' | 'ending' | 'brk' | 'fill';

/** The colour role: `ok` connected or running, `d` absent, `t` modified or waiting, or a section (the playing role). */
export type StatusDotHue = 'ok' | 'd' | 't' | StatusDotSection;

const SECTIONS: ReadonlySet<StatusDotHue> = new Set<StatusDotHue>(['intro', 'main', 'ending', 'brk', 'fill']);

export interface StatusDotModelProps {
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

/** The dot's element, plus its inline style as declarations (`style`, for React) and as text (`styleText`, for Svelte). */
export interface StatusDotView extends ElementView {
  style: Record<string, string> | undefined;
  styleText: string | undefined;
}

/** The dot StatusDot draws from its props. */
export function statusDotView({ hue = 'ok', hollow = false, glow = true, size = 'md', visible = true, name }: StatusDotModelProps): StatusDotView {
  // Absent is always the "not there" ring: a faint solid dot was invisible from a metre.
  const ring = hollow || hue === 'd';
  const glows = glow && !ring;
  const named = visible && name !== undefined;
  const style: Record<string, string> = {};
  if (SECTIONS.has(hue)) style['--yh-status-dot-hue'] = SECTION_COLOUR;
  if (!visible) style.visibility = 'hidden';
  const declarations = Object.entries(style);
  return {
    className: 'yh-status-dot',
    attrs: {
      'data-part': 'root',
      'data-hue': hue,
      'data-face': ring ? 'hollow' : 'solid',
      'data-glow': glows ? 'true' : 'false',
      'data-size': size,
      role: named ? 'img' : undefined,
      'aria-label': named ? name : undefined,
      'aria-hidden': named ? undefined : 'true',
    },
    style: declarations.length ? style : undefined,
    styleText: declarations.length ? declarations.map(([property, value]) => `${property}: ${value}`).join('; ') : undefined,
  };
}

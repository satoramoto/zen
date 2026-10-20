// SectionName's model: its props and the view it draws (the name's Text, its `data-*`, the inline
// size, and the name split into its word and variation). No framework: `SectionName.tsx` (React)
// and `SectionName.svelte` (Svelte) both render `sectionNameView`.
import type { ElementView, TextModelProps } from '../../../primitives/Text.model';

/**
 * Where a section stands: playing now, queued next, stopped, or not in the song. The app's holder
 * maps it to a contract colour (playing `--selected`, next `--accent`, idle `--text-2`, absent
 * `--text-4` in Yahaha's case); the name itself stays neutral.
 */
export type SectionState = 'playing' | 'next' | 'idle' | 'absent';

/** The five section kinds. Kept as a hook (`data-hue`); a section takes no colour from its kind. */
export type SectionHue = 'intro' | 'main' | 'ending' | 'brk' | 'fill';

export interface SectionNameModelProps {
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

/** A Text part: its Text props (no class), its class and its attributes. */
export interface SectionNameTextPart extends ElementView {
  text: TextModelProps;
}

/** What a renderer draws: the name (its word, then a space and the variation's Text, if any). */
export interface SectionNameView {
  name: SectionNameTextPart;
  /** The name's inline custom property, or undefined for no `style`. */
  style: Record<string, string> | undefined;
  /** The word ("Main"), or the whole name, or "—". */
  word: string;
  /** The variation ("B", "III") and its Text, or null for none. */
  variant: (SectionNameTextPart & { content: string }) | null;
}

/** "Main B" split into its word and its variation (up to three characters after the last space). */
export function splitSectionName(label: string): { word: string; variant: string } {
  const shown = label.trim() === '' ? '—' : label.trim();
  const match = /^(.*\S)\s+(\S{1,3})$/.exec(shown);
  return match ? { word: match[1], variant: match[2] } : { word: shown, variant: '' };
}

/** The name SectionName draws from its props. */
export function sectionNameView({ label, hue = 'main', state, idle = false, size }: SectionNameModelProps): SectionNameView {
  const stands: SectionState = idle ? 'idle' : (state ?? 'playing');
  const { word, variant } = splitSectionName(label);
  return {
    name: {
      text: { role: 'display', leading: 'tight' },
      className: 'yh-section-name',
      attrs: { 'data-part': 'name', 'data-hue': hue, 'data-state': stands, 'data-idle': idle ? 'true' : undefined },
    },
    style: size === undefined ? undefined : { '--yh-section-name-size': size },
    word,
    variant: variant
      ? {
          text: { role: 'display', size: 'inherit', leading: 'tight', tabular: true },
          className: 'yh-section-name__variant',
          attrs: { 'data-part': 'variant' },
          content: variant,
        }
      : null,
  };
}

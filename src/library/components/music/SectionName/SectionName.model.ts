// SectionName's model: its props and the tree both renderers draw from them (the name's Text, its
// `data-*`, the inline size, and the name split into its word and variation). No framework:
// `SectionName.tsx` (React) and `SectionName.svelte` (Svelte) both pass `sectionNameView` to their `Tree`.
import { textView, type TextModelProps } from '../../../primitives/Text.model';
import { h, styleText, type Node } from '../../../view/Tree.model';

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

/** "Main B" split into its word and its variation (up to three characters after the last space). */
export function splitSectionName(label: string): { word: string; variant: string } {
  const shown = label.trim() === '' ? '—' : label.trim();
  const match = /^(.*\S)\s+(\S{1,3})$/.exec(shown);
  return match ? { word: match[1], variant: match[2] } : { word: shown, variant: '' };
}

/** A Text's attributes (its class and `data-*`). */
function text(props: TextModelProps): Record<string, string | undefined> {
  const view = textView(props);
  return { class: view.className, ...view.attrs };
}

/** The tree SectionName draws: the name's Text (its word, then a space and the variation's Text, if any). */
export function sectionNameView({ label, hue = 'main', state, idle = false, size }: SectionNameModelProps): Node {
  const stands: SectionState = idle ? 'idle' : (state ?? 'playing');
  const { word, variant } = splitSectionName(label);
  return h(
    'span',
    {
      ...text({ role: 'display', leading: 'tight', className: 'yh-section-name' }),
      'data-part': 'name',
      'data-hue': hue,
      'data-state': stands,
      'data-idle': idle ? 'true' : undefined,
      style: styleText(size === undefined ? undefined : { '--yh-section-name-size': size }),
    },
    word,
    variant
      ? [' ', h('span', { ...text({ role: 'display', size: 'inherit', leading: 'tight', tabular: true, className: 'yh-section-name__variant' }), 'data-part': 'variant' }, variant)]
      : null,
  );
}

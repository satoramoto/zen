// ChordReadout's model: its props and what it draws from them (the window's Surface attributes,
// the chord split at its slash bass, the notes, the fingering and its tip, the spoken name). No
// framework: `ChordReadout.tsx` (React) and `ChordReadout.svelte` (Svelte) both render
// `chordReadoutView`; the hero's fit is a store beside it (`fit.ts`).
import type { TipAction } from '../../core/Button/Button.model';
import type { ElementView } from '../../../primitives/Text.model';

export type { TipAction };

export interface ChordNote {
  /** The note's name ("A", "C", "F♯"). */
  note: string;
  /** Its interval from the root ("R", "m3", "5", "m7"). Not drawn; kept for callers. */
  interval?: string;
}

/** Every ChordReadout prop (it takes no framework children). */
export interface ChordReadoutModelProps {
  /** The chord before its extension ("Am", "C", "F♯m"). Empty: "—". */
  chord: string;
  /** The extension, drawn after the chord, raised and smaller ("7", "maj7", "sus4"); a "/bass" stays on the line. */
  extension?: string;
  /** The chord's notes, root first. */
  notes?: ChordNote[];
  /** The fingering mode's word ("Fingered", "Fingered On Bass", "AI Full Keyboard · played Gm7"). */
  fingering?: string;
  /** Detection is unsure and the last chord is held: muted, with a "held" tag. */
  held?: boolean;
  /** The readout's name, spoken before the chord ("Chord"). Not drawn: a chord symbol names itself. */
  label?: string;
  /** The fingering's tooltip key ("fingering.select"), set as `data-tip`, with the whole fingering as `data-tip-text`. */
  tip?: string;
  /** The app's tooltip action (`use:tip`), applied to the fingering with `tip` when both are set. */
  tipAction?: TipAction;
  /**
   * The hero's full size, a CSS length ("96px", "var(--size-display)"), set as
   * `--yh-chord-readout-hero` on the root. Default: that property's value, `--size-display`.
   */
  size?: string;
}

/** The window's material: a readout is a `screen`. */
export const MATERIAL = 'screen' as const;

/** The extension split at its slash bass: "maj9(♯11)/G♯" → ["maj9(♯11)", "/G♯"]. */
export function splitBass(extension: string): [string, string] {
  const i = extension.lastIndexOf('/');
  return i < 0 ? [extension, ''] : [extension.slice(0, i), extension.slice(i)];
}

/** What a renderer draws. */
export interface ChordReadoutView {
  /** What `Surface material="screen"` puts on the window (React draws it through `Surface`; Svelte writes it). */
  surface: ElementView;
  /** The window's own class and attributes beside the Surface's (role, spoken name, `data-held`). */
  root: ElementView;
  /** The hero size for `--yh-chord-readout-hero` on the root, or undefined for none. */
  heroSize: string | undefined;
  /** The chord line (a display Text, snug), its class and attributes beside `data-fit`. */
  hero: ElementView;
  /** The chord's text ("Am", or "—" for none). */
  chord: string;
  /** The raised extension, or null for none. */
  raised: string | null;
  /** The slash bass ("/G♯"), or null for none. */
  bass: string | null;
  /** The notes' names, or null to draw no tones. */
  tones: string[] | null;
  /** The fingering's text and its attributes (`data-tip`, `data-tip-text`), or null for none. */
  fingering: { text: string; attrs: Record<string, string | undefined> } | null;
  /** Whether the "held" tag shows. */
  held: boolean;
}

/** The readout ChordReadout draws from its props. */
export function chordReadoutView({
  chord,
  extension = '',
  notes = [],
  fingering = '',
  held = false,
  label = 'Chord',
  tip,
  size,
}: ChordReadoutModelProps): ChordReadoutView {
  const none = chord.trim() === '';
  const [raised, bass] = splitBass(none ? '' : extension);
  const spoken =
    `${label} ${none ? 'none' : chord + extension}${held ? ', held' : ''}` +
    (notes.length ? `: ${notes.map((n) => n.note).join(' ')}` : '') +
    (fingering ? `, ${fingering}` : '');
  return {
    surface: { className: 'lib-surface', attrs: { 'data-material': MATERIAL, 'data-radius': 'control' } },
    root: {
      className: `yh-chord-readout${held ? ' yh-chord-readout--held' : ''}`,
      attrs: {
        'data-part': 'window',
        role: 'img',
        'aria-label': spoken,
        'data-held': held ? 'true' : 'false',
      },
    },
    heroSize: size,
    hero: {
      className: `yh-chord-readout__chord${none ? ' yh-chord-readout__chord--none' : ''}`,
      attrs: { 'data-part': 'chord', 'aria-hidden': 'true' },
    },
    chord: none ? '—' : chord,
    raised: raised !== '' ? raised : null,
    bass: bass !== '' ? bass : null,
    tones: notes.length > 0 ? notes.map((n) => n.note) : null,
    fingering: fingering
      ? { text: fingering, attrs: { 'data-part': 'fingering', 'data-tip': tip, 'data-tip-text': tip ? fingering : undefined } }
      : null,
    held,
  };
}

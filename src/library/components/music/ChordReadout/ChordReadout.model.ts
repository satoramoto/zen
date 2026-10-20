// ChordReadout's model: its props and the tree both renderers draw from them (the window's Surface
// attributes, the chord split at its slash bass, the notes, the fingering and its tip, the spoken
// name). No framework: `ChordReadout.tsx` (React) and `ChordReadout.svelte` (Svelte) both pass
// `chordReadoutView` and `chordReadoutHandlers` to their `Tree`. The hero's fit is the `chordFit`
// store (`fit.ts`), reporting its step to the binding's view state, which passes it back as `fit`.
import type { TipAction } from '../../core/Button/Button.model';
import { textView, type TextModelProps } from '../../../primitives/Text.model';
import { each, h, styleText, wire, type Handlers, type Node } from '../../../view/Tree.model';
import type { Fit } from './fit';

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

/** A Text's attributes (its class and `data-*`). */
function text(props: TextModelProps): Record<string, string | undefined> {
  const view = textView(props);
  return { class: view.className, ...view.attrs };
}

/**
 * The tree ChordReadout draws: the `screen` window (a Surface without a layer, so no shader), the
 * hero chord at the step `fit` (binding the `chordFit` store, keyed by what changes its width),
 * and the small line of tones, fingering (binding the app's `tip`) and the "held" tag.
 */
export function chordReadoutView(
  { chord, extension = '', notes = [], fingering = '', held = false, label = 'Chord', tip, size }: ChordReadoutModelProps,
  fit: Fit = 'full',
): Node {
  const none = chord.trim() === '';
  const [raised, bass] = splitBass(none ? '' : extension);
  const spoken =
    `${label} ${none ? 'none' : chord + extension}${held ? ', held' : ''}` +
    (notes.length ? `: ${notes.map((n) => n.note).join(' ')}` : '') +
    (fingering ? `, ${fingering}` : '');
  return h(
    'div',
    {
      class: `lib-surface yh-chord-readout${held ? ' yh-chord-readout--held' : ''}`,
      'data-material': MATERIAL,
      'data-radius': 'control',
      'data-part': 'window',
      role: 'img',
      'aria-label': spoken,
      'data-held': held ? 'true' : 'false',
      style: styleText(size === undefined ? undefined : { '--yh-chord-readout-hero': size }),
    },
    wire(
      h(
        'div',
        {
          ...text({ role: 'display', leading: 'snug', className: `yh-chord-readout__chord${none ? ' yh-chord-readout__chord--none' : ''}` }),
          'data-part': 'chord',
          'aria-hidden': 'true',
          'data-fit': fit,
        },
        none ? '—' : chord,
        raised !== '' ? h('span', { ...text({ role: 'display', leading: 'tight', className: 'yh-chord-readout__ext' }), 'data-part': 'extension' }, raised) : null,
        bass !== '' ? h('span', { ...text({ role: 'display', leading: 'snug', className: 'yh-chord-readout__bass' }), 'data-part': 'bass' }, bass) : null,
      ),
      { bind: [['chordFit', { onFit: 'fit', key: JSON.stringify([chord, extension, held, size ?? null]) }]] },
    ),
    // Drawn only: the readout's spoken name already says it whole.
    h(
      'p',
      { ...text({ role: 'body', size: 'label', className: 'yh-chord-readout__line' }), 'data-part': 'line', 'aria-hidden': 'true' },
      notes.length > 0
        ? h(
            'span',
            { ...text({ role: 'body', size: 'inherit', weight: 'numeral', className: 'yh-chord-readout__tones' }), 'data-part': 'tones' },
            each(notes, (_, i) => String(i), (n) => h('span', { class: 'yh-chord-readout__tone', 'data-part': 'tone' }, n.note)),
          )
        : null,
      fingering
        ? wire(
            h(
              'span',
              { class: 'yh-chord-readout__fingering', 'data-part': 'fingering', 'data-tip': tip, 'data-tip-text': tip ? fingering : undefined },
              fingering,
            ),
            { bind: [['tip', { tip, tipAction: 'tipAction' }]] },
          )
        : null,
      held ? h('span', { ...text({ role: 'body', size: 'caption', case: 'label', className: 'yh-chord-readout__held' }), 'data-part': 'held' }, 'held') : null,
    ),
  );
}

/** The callbacks `chordReadoutView`'s tree names: the app's tooltip action, and `fit`, where the
 *  `chordFit` store reports the hero's step (the binding's view state's `set`). */
export function chordReadoutHandlers(props: ChordReadoutModelProps, onFit: (fit: Fit) => void): Handlers {
  return { tipAction: props.tipAction, fit: onFit };
}

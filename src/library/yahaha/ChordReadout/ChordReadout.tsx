import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { TipAction } from '../Pad/Pad';
import './ChordReadout.css';

export interface ChordNote {
  /** The note's name ("A", "C", "F♯"). */
  note: string;
  /** Its interval from the root ("R", "m3", "5", "m7"). Not drawn; kept for callers. */
  interval?: string;
}

export interface ChordReadoutProps {
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

/** Hero sizes, largest first: the chord takes the first at which it fits its column. */
const FITS = ['full', '4', '5', '6', '8'] as const;
type Fit = (typeof FITS)[number];

/** The extension split at its slash bass: "maj9(♯11)/G♯" → ["maj9(♯11)", "/G♯"]. */
function splitBass(extension: string): [string, string] {
  const i = extension.lastIndexOf('/');
  return i < 0 ? [extension, ''] : [extension.slice(0, i), extension.slice(i)];
}

/**
 * ChordReadout: the display's chord, the thing a player looks up to read mid-song.
 *
 * **Job.** Say which chord the arranger hears, at a glance from a playing position: the chord big,
 * then one small line with its notes and the fingering mode. Held (detection unsure, the band keeps
 * the last chord) must read as "not live" without hiding the chord. A readout, not a control: its
 * spoken name (`role="img"`) says everything drawn, the whole fingering included.
 *
 * **Changed.** *Hierarchy:* the chord is the one display-size line, and the notes and fingering
 * sit well below it in size and ink (`--text-2`, `--text-3`), so the eye lands on the chord first
 * (typography.md, "Type Scale", "Text Color System"). The "Chord" caption above it is no longer
 * drawn (a chord symbol names itself; the row goes to the chord), only spoken. *Rhythm:* the
 * extension is set the way chord symbols are printed, raised and smaller after the root and quality
 * ("Am⁷"), with a slash bass back on the line ("C♯m maj9(♯11) /G♯") in the chord's own ink, since
 * the left hand needs the bass more than the extension. *Contrast:* the chord is primary text
 * rather than the accent, which reads on every pack, light ones included, and leaves the accent to
 * focus and selection (color.md, "Primary Accent", 60/30/10). *State clarity:* held keeps the chord
 * in primary ink and draws a dashed `--border-strong` rule under it, plus an outlined "held" tag:
 * from a metre a dimmed chord just looked faint, a dashed underline reads as "not live", and
 * unsure isn't an error. No chord is "—" in `--text-3`, never the faint `--text-4`.
 * *Numerals:* the notes use the readout face so their spacing stays even as they change.
 * *Sizing:* the hero's full size is one custom property, `--yh-chord-readout-hero` (default
 * `--size-display`), which a parent sets on the root or passes as `size`, so a display can scale
 * the chord without overriding this widget's CSS; the fit steps scale from it. *Materials:* the
 * parts are named (`data-part`: window, chord, extension, bass, line, tones, tone, fingering,
 * held); the readout is a `screen` window, none of its own when it already sits on a screen (the
 * Display).
 *
 * **Kept.** The chord stepping down through hero sizes until it fits its column (measured after each
 * change and again once the web font loads); the small line that wraps the fingering onto a second
 * line rather than cutting it off; "—" when there's no chord; the spoken name ("Chord Am7: A C E G,
 * Fingered On Bass"); the fingering's tooltip as `data-tip` with the whole text as `data-tip-text`,
 * and the app's `tipAction` applied to the fingering with `tip`, as the original does.
 */
export function ChordReadout({
  chord,
  extension = '',
  notes = [],
  fingering = '',
  held = false,
  label = 'Chord',
  tip,
  tipAction,
  size,
}: ChordReadoutProps) {
  const hero = useRef<HTMLDivElement>(null);
  const fingeringRef = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState<Fit>('full');
  const hasFingering = fingering !== '';

  // The app's tooltip on the fingering, the readout's one hover target.
  useEffect(() => {
    const node = fingeringRef.current;
    if (!node || !tipAction || tip === undefined) return;
    const handle = tipAction(node, tip);
    return () => handle?.destroy?.();
  }, [tip, tipAction, hasFingering]);

  const none = chord.trim() === '';
  const [raised, bass] = splitBass(none ? '' : extension);
  const spoken =
    `${label} ${none ? 'none' : chord + extension}${held ? ', held' : ''}` +
    (notes.length ? `: ${notes.map((n) => n.note).join(' ')}` : '') +
    (fingering ? `, ${fingering}` : '');

  // The largest hero step at which the chord fits its column (the last step when none does).
  useLayoutEffect(() => {
    const el = hero.current;
    if (!el) return;
    let live = true;
    const fit = () => {
      if (!live) return;
      let chosen: Fit = FITS[FITS.length - 1];
      for (const step of FITS) {
        el.dataset.fit = step;
        if (el.scrollWidth <= el.clientWidth) {
          chosen = step;
          break;
        }
      }
      setFit(chosen);
    };
    fit();
    // Measured again once the web font has loaded (the fallback is a different width) and when the column resizes.
    document.fonts?.ready.then(fit);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
    observer?.observe(el);
    return () => {
      live = false;
      observer?.disconnect();
    };
  }, [chord, extension, held, size]);

  const classes = ['yh-chord-readout'];
  if (held) classes.push('yh-chord-readout--held');
  const style = size === undefined ? undefined : ({ '--yh-chord-readout-hero': size } as CSSProperties);

  return (
    <div
      className={classes.join(' ')}
      data-part="window"
      data-material="screen"
      role="img"
      aria-label={spoken}
      data-held={held ? 'true' : 'false'}
      style={style}
    >
      <div
        ref={hero}
        className={`yh-chord-readout__chord${none ? ' yh-chord-readout__chord--none' : ''}`}
        data-part="chord"
        data-fit={fit}
        aria-hidden="true"
      >
        {none ? '—' : chord}
        {raised && <span className="yh-chord-readout__ext" data-part="extension">{raised}</span>}
        {bass && <span className="yh-chord-readout__bass" data-part="bass">{bass}</span>}
      </div>
      {/* Drawn only: the readout's spoken name already says it whole. */}
      <p className="yh-chord-readout__line" data-part="line" aria-hidden="true">
        {notes.length > 0 && (
          <span className="yh-chord-readout__tones" data-part="tones">
            {notes.map((n, i) => (
              <span key={i} className="yh-chord-readout__tone" data-part="tone">
                {n.note}
              </span>
            ))}
          </span>
        )}
        {fingering && (
          <span ref={fingeringRef} className="yh-chord-readout__fingering" data-part="fingering" data-tip={tip} data-tip-text={tip ? fingering : undefined}>
            {fingering}
          </span>
        )}
        {held && <span className="yh-chord-readout__held" data-part="held">held</span>}
      </p>
    </div>
  );
}

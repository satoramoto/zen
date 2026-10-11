import { useLayoutEffect, useRef, useState } from 'react';
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
  /** The readout's name, drawn as its caption and spoken before the chord ("Chord"). */
  label?: string;
  /** The fingering's tooltip key ("fingering.select"), set as `data-tip`, with the whole fingering as `data-tip-text`. */
  tip?: string;
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
 * **Changed.** *Hierarchy:* a small caption names the readout, the chord is the one display-size
 * line, and the notes and fingering sit well below it in size and ink (`--text-2`, `--text-3`), so
 * the eye lands on the chord first (typography.md, "Type Scale", "Text Color System"). *Rhythm:* the
 * extension is set the way chord symbols are printed, raised and smaller after the root and quality
 * ("Am⁷"), with a slash bass back on the line ("C♯m maj9(♯11) /G♯"), so a long symbol keeps its
 * shape and fits at a larger size. *Contrast:* the chord is primary text rather than the accent,
 * which reads on every pack, light ones included, and leaves the accent to focus and selection
 * (color.md, "Primary Accent", 60/30/10). *Colour meaning:* held dims the chord to `--text-3` and
 * adds an outlined "held" tag, a state word rather than a colour, since unsure isn't an error.
 * *Numerals:* the notes use the readout face so their spacing stays even as they change.
 *
 * **Kept.** The chord stepping down through hero sizes until it fits its column (measured after each
 * change and again once the web font loads); the small line that wraps the fingering onto a second
 * line rather than cutting it off; "—" when there's no chord; the spoken name ("Chord Am7: A C E G,
 * Fingered On Bass"); the fingering's tooltip as `data-tip` with the whole text as `data-tip-text`.
 */
export function ChordReadout({ chord, extension = '', notes = [], fingering = '', held = false, label = 'Chord', tip }: ChordReadoutProps) {
  const hero = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Fit>('full');

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
      setSize(chosen);
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
  }, [chord, extension, held]);

  const classes = ['yh-chord-readout'];
  if (held) classes.push('yh-chord-readout--held');

  return (
    <div className={classes.join(' ')} role="img" aria-label={spoken} data-held={held ? 'true' : 'false'}>
      <div className="yh-chord-readout__label" aria-hidden="true">
        {label}
      </div>
      <div
        ref={hero}
        className={`yh-chord-readout__chord${none ? ' yh-chord-readout__chord--none' : ''}`}
        data-fit={size}
        aria-hidden="true"
      >
        {none ? '—' : chord}
        {raised && <span className="yh-chord-readout__ext">{raised}</span>}
        {bass && <span className="yh-chord-readout__bass">{bass}</span>}
      </div>
      {/* Drawn only: the readout's spoken name already says it whole. */}
      <p className="yh-chord-readout__line" aria-hidden="true">
        {notes.length > 0 && (
          <span className="yh-chord-readout__tones">
            {notes.map((n, i) => (
              <span key={i} className="yh-chord-readout__tone">
                {n.note}
              </span>
            ))}
          </span>
        )}
        {fingering && (
          <span className="yh-chord-readout__fingering" data-tip={tip} data-tip-text={tip ? fingering : undefined}>
            {fingering}
          </span>
        )}
        {held && <span className="yh-chord-readout__held">held</span>}
      </p>
    </div>
  );
}

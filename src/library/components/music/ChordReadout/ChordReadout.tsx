import { useEffect, useRef, type CSSProperties } from 'react';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import { chordReadoutView, MATERIAL, type ChordReadoutModelProps } from './ChordReadout.model';
import { useFit } from './useFit';
import './ChordReadout.css';

// The props and what they draw are framework-free, in the model; `ChordReadout.svelte` renders the same view.
export type { ChordNote, ChordReadoutModelProps, TipAction } from './ChordReadout.model';

export type ChordReadoutProps = ChordReadoutModelProps;

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
 *
 * **Tuning knobs.**
 * - `--yh-chord-readout-hero`: the chord's full size (default `--size-display`, or `size`); the
 *   fit steps and the fixed line box scale from it.
 */
export function ChordReadout(props: ChordReadoutProps) {
  const { chord, extension, held, size, tip, tipAction } = props;
  const view = chordReadoutView(props);
  const hero = useRef<HTMLDivElement>(null);
  const fingeringRef = useRef<HTMLSpanElement>(null);
  const hasFingering = view.fingering !== null;

  // The app's tooltip on the fingering, the readout's one hover target.
  useEffect(() => {
    const node = fingeringRef.current;
    if (!node || !tipAction || tip === undefined) return;
    const handle = tipAction(node, tip);
    return () => handle?.destroy?.();
  }, [tip, tipAction, hasFingering]);

  // The largest hero step at which the chord fits its column (`fit.ts`), measured again on each change.
  const fit = useFit(hero, [chord, extension, held, size]);

  const style = view.heroSize === undefined ? undefined : ({ '--yh-chord-readout-hero': view.heroSize } as CSSProperties);
  return (
    <Surface material={MATERIAL} className={view.root.className} {...view.root.attrs} style={style}>
      <Text as="div" role="display" leading="snug" ref={hero} className={view.hero.className} {...view.hero.attrs} data-fit={fit}>
        {view.chord}
        {view.raised !== null && (
          <Text role="display" leading="tight" className="yh-chord-readout__ext" data-part="extension">
            {view.raised}
          </Text>
        )}
        {view.bass !== null && (
          <Text role="display" leading="snug" className="yh-chord-readout__bass" data-part="bass">
            {view.bass}
          </Text>
        )}
      </Text>
      {/* Drawn only: the readout's spoken name already says it whole. */}
      <Text as="p" role="body" size="label" className="yh-chord-readout__line" data-part="line" aria-hidden="true">
        {view.tones !== null && (
          <Text role="body" size="inherit" weight="numeral" className="yh-chord-readout__tones" data-part="tones">
            {view.tones.map((note, i) => (
              <span key={i} className="yh-chord-readout__tone" data-part="tone">
                {note}
              </span>
            ))}
          </Text>
        )}
        {view.fingering !== null && (
          <span ref={fingeringRef} className="yh-chord-readout__fingering" {...view.fingering.attrs}>
            {view.fingering.text}
          </span>
        )}
        {view.held && (
          <Text role="body" size="caption" case="label" className="yh-chord-readout__held" data-part="held">
            held
          </Text>
        )}
      </Text>
    </Surface>
  );
}

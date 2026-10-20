import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../../view/Tree';
import { viewState } from '../../../view/viewState';
import { chordReadoutHandlers, chordReadoutView, type ChordReadoutModelProps } from './ChordReadout.model';
import type { Fit } from './fit';
import '../../../primitives/Text.css';
// The window is a `screen` Surface drawn as a plain div with Surface's class and data (no layer, so
// never a shader). Before ChordReadout.css, so its own rules win.
import '../../../primitives/Surface.css';
import './ChordReadout.css';

// The props and the tree are framework-free, in the model; `ChordReadout.svelte` draws the same
// tree. The hero's fit is the `chordFit` store the tree binds, reporting to this view state.
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
  const [fit] = useState(() => viewState<Fit>('full'));
  const step = useSyncExternalStore(fit.subscribe, fit.get);
  return <Tree tree={chordReadoutView(props, step)} handlers={chordReadoutHandlers(props, fit.set)} />;
}

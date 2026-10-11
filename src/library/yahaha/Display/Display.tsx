import { useEffect, useRef, type CSSProperties } from 'react';
import { AccentBlock } from '../AccentBlock/AccentBlock';
import { BarBeat } from '../BarBeat/BarBeat';
import { Button, type TipAction } from '../Button/Button';
import { ChordReadout, type ChordReadoutProps } from '../ChordReadout/ChordReadout';
import { DisplayArt } from '../DisplayArt/DisplayArt';
import { OneTouchPicker } from '../OneTouchPicker/OneTouchPicker';
import { PartMarks } from '../PartMarks/PartMarks';
import { marksText } from '../PartMarks/marks';
import { SectionName } from '../SectionName/SectionName';
import { TempoReadout } from '../TempoReadout/TempoReadout';
import { WaitingChip } from '../WaitingChip/WaitingChip';
import { PART_HUE, type Part } from '../hues';
import './Display.css';

export type { TipAction };

/** The loaded style: the header line, and One Touch. */
export interface DisplayStyle {
  /** The style's name ("Sunday Drive Pop"). Empty: "No style". */
  name: string;
  /** Its category ("Pop & Rock"). */
  category?: string;
  /** Its time signature ("4/4"). */
  timeSignature?: string;
  /** A style waiting for the bar line ("Coastal Highway"). Empty: none. */
  queued?: string;
  /** The applied One Touch, 1–4; 0 when none is. */
  oneTouch?: number;
  /** How many One Touch settings the style has (numbers past it are disabled). */
  oneTouchCount?: number;
}

/** What the band is playing: the section, what's next, the chord, the tempo and the beat. */
export interface DisplayNowPlaying {
  /** The playing section's shown name ("Main B"); stopped, the section the band starts on. */
  playing: string;
  /** The next (queued or armed) section ("Main C"). Empty: none. */
  next?: string;
  /** When the change lands ("fill after bar 4", "after bar 1"). Empty: nothing. */
  fill?: string;
  /** The current bar of the section, 1-based: "bar 3 of 4" when nothing is queued. */
  bar?: number;
  /** Bars in the section. */
  bars?: number;
  /** The tempo in BPM. */
  bpm: number;
  /** The band is running. False: "Stopped", the section without its live block, the beat at rest. */
  running?: boolean;
  /** Stopped with Sync Start armed: "Sync Start armed". */
  syncStart?: boolean;
  /** The chord readout: chord, extension, notes, fingering, held. */
  chord: ChordReadoutProps;
  /** The current beat, 1-based; 0 when stopped. */
  beat?: number;
  /** Beats in the bar: one segment each. */
  beats?: number;
}

/** One keyboard part's sound. */
export interface DisplayPart {
  /** Which part; it picks the part's hue (`hues.ts`). */
  id: Part;
  /** Its full name ("Right 1"). */
  name: string;
  /** The sound's number in its list. Spoken only. */
  number?: string;
  /** The sound's name. */
  sound: string;
  /** The part is off. */
  off?: boolean;
  /** Changed since it was loaded. */
  edited?: boolean;
  /** Its plugin isn't installed. */
  missing?: boolean;
  /** Its plugin failed. */
  failed?: boolean;
  /** It plays the Style's bass. */
  bass?: boolean;
}

export interface DisplayProps {
  /** The style header and One Touch. */
  style: DisplayStyle;
  /** Section, next, chord, tempo and beat. */
  nowPlaying: DisplayNowPlaying;
  /** The four parts' sounds, in order. Omitted or empty: no parts column (the Stage's mixer names them). */
  parts?: DisplayPart[];
  /** Draw the background art at the right edge. */
  art?: boolean;
  /** The app's tooltip hook, applied to the buttons. */
  tipAction?: TipAction;
  /** ‹: the previous style. */
  onPrev?: () => void;
  /** ›: the next style. */
  onNext?: () => void;
  /** The style's name: opens Library › Styles. */
  onBrowse?: () => void;
  /** One Touch 1–4: applies it. */
  onOneTouch?: (n: number) => void;
  /** A part's row: opens its sound list. */
  onSound?: (part: Part) => void;
  /** Tempo + held (`true`) and released (`false`); from the keyboard, `true` then `false`. */
  onTempoUp?: (down: boolean) => void;
  /** Tempo − held and released, as `onTempoUp`. */
  onTempoDown?: (down: boolean) => void;
  /** A drag, scroll or arrow key on the tempo number asks for this tempo. */
  onTempo?: (bpm: number) => void;
  /** Tap: one tap, reported on press (pointer down, or Enter/Space). The caller times the taps. */
  onTap?: () => void;
  /** Back to the style's own tempo (the Style tempo button, or a double-click on the number). */
  onStyleTempo?: () => void;
}

/** The small line under the section: status, then what's next and when, or where the section is. */
function nextLine(n: DisplayNowPlaying): { status: string; next: string; when: string } {
  const next = (n.next ?? '').trim();
  const fill = (n.fill ?? '').trim();
  if (!n.running) return { status: n.syncStart ? 'Sync Start armed' : 'Stopped', next, when: '' };
  if (!next && !fill && (n.bar ?? 0) > 0 && (n.bars ?? 0) > 0) return { status: `bar ${n.bar} of ${n.bars}`, next: '', when: '' };
  return { status: '', next, when: fill };
}

/**
 * Display: the Stage's hero, what the band is doing right now.
 *
 * **Job.** Answer, from a metre away and mid-song, three questions in order: which section is
 * playing (and what comes next), which chord the band hears, and how fast. Then, quieter, which
 * style is loaded and its One Touch, and where the bar is. Every control the hero owns sits next
 * to what it changes: ‹ › and the name step and browse styles, One Touch applies, the tempo's
 * − + Tap and Style tempo set the tempo. This is the Stage's only Tap.
 *
 * **Changed.** *Hierarchy:* the original set chord, section and tempo in three competing hues at
 * three sizes in three equal thirds. Here they share one hero size and neutral ink, ranked by
 * weight and place: the section first, the only element on the `--selected` block (the live
 * thing, `hues.ts`: what plays is `--selected`), then the chord in primary text, then the tempo a
 * step smaller (typography.md, "Type Scale": one display size, rank by weight and position). What's
 * next sits directly under the section in secondary text with WaitingChip's arrow, so "now → next"
 * reads as one phrase. *Colour meaning:* sections take no hue; the beat bar is neutral ink; the
 * only hues left are the four part dots, which mean the same part as the mixer and keyboard
 * (color.md, "Semantic colours"). *Hierarchy, quiet chrome:* the style header and One Touch move to
 * one caption-height line above the readouts, so they are found when wanted and never read first.
 * *Rhythm:* each readout has the same caption above it (Section, Chord, Tempo) on one baseline,
 * and every size scales with the region's width (container units, clamped to the pack's display
 * size), so the hero keeps its proportions from the 1440×900 Stage down to 1217×752.
 * *Affordance:* the beat bar is drawn thick, the lit beat twice as tall, visible from across the
 * room; Tap is a real key, and the style tempo, once a hidden double-click, is a visible quiet key
 * beside it (the double-click still works).
 *
 * **Kept.** The data and every callback of the original (prev/next/browse, One Touch, a part's
 * sound list, tempo up/down holds, drag/scroll/keys on the number, back to the style's tempo); the
 * button names ("Next style (Track right)", "Sunday Drive Pop: open the Browser", "Left sound: 33
 * Finger Bass…", "Apply One Touch 3…", "Tempo up (Scene Launch)"); "Stopped", "Sync Start armed"
 * and "bar 3 of 4" on the small line; the beat bar's states; the chord stepping down to fit.
 */
export function Display({
  style,
  nowPlaying,
  parts,
  art = false,
  tipAction,
  onPrev,
  onNext,
  onBrowse,
  onOneTouch,
  onSound,
  onTempoUp,
  onTempoDown,
  onTempo,
  onTap,
  onStyleTempo,
}: DisplayProps) {
  const name = style.name.trim() || 'No style';
  const queued = (style.queued ?? '').trim();
  const meta = [style.category, style.timeSignature].filter(Boolean).join(' · ');
  const running = nowPlaying.running ?? false;
  const line = nextLine(nowPlaying);
  const hasParts = (parts?.length ?? 0) > 0;

  return (
    <section className="yh-display" aria-label="Stage display" data-running={running || undefined} data-parts={hasParts || undefined}>
      {art && (
        <div className="yh-display__art">
          <DisplayArt />
        </div>
      )}

      <header className="yh-display__header">
        <div className="yh-display__style" role="group" aria-label="Style">
          <Button symbol="prev" size="icon" variant="quiet" name="Previous style (Track left)" tip="style.prev" tipAction={tipAction} onPress={onPrev} />
          <span className="yh-display__style-name" title={name}>
            <AccentBlock as="button" label={name} name={`${name}: open the Browser`} tip="browser.open" tipAction={tipAction} onPress={onBrowse} />
          </span>
          <Button symbol="next" size="icon" variant="quiet" name="Next style (Track right)" tip="style.next" tipAction={tipAction} onPress={onNext} />
          {queued ? (
            <span className="yh-display__queued" title={`Next style: ${queued}`}>
              <WaitingChip label={queued} hue="a" size="line" />
            </span>
          ) : (
            meta && (
              <span className="yh-display__meta" title={meta}>
                {meta}
              </span>
            )
          )}
        </div>
        <div className="yh-display__ots">
          <OneTouchPicker applied={style.oneTouch ?? 0} count={style.oneTouchCount ?? 4} onApply={onOneTouch} />
        </div>
      </header>

      <div className="yh-display__readouts">
        <div className="yh-display__cell yh-display__section" role="group" aria-label="Section">
          <div className="yh-display__caption" aria-hidden="true">
            Section
          </div>
          <div
            className="yh-display__now"
            role="img"
            aria-label={`${running ? 'Playing' : 'Stopped on'} ${nowPlaying.playing.trim() || 'no section'}`}
            data-live={running || undefined}
          >
            <SectionName label={nowPlaying.playing} idle={!running} />
          </div>
          <p className="yh-display__next">
            {line.status && <span className="yh-display__status">{line.status}</span>}
            {line.next && <WaitingChip label={line.next} size="count" />}
            {line.when && <span className="yh-display__when">{line.when}</span>}
          </p>
        </div>

        <div className="yh-display__cell yh-display__chord">
          <ChordReadout {...nowPlaying.chord} tip="fingering.select" />
        </div>

        <div className="yh-display__cell yh-display__tempo" role="group" aria-label="Tempo and Tap">
          <div className="yh-display__caption" aria-hidden="true">
            Tempo
          </div>
          <TempoReadout bpm={nowPlaying.bpm} onTempo={onTempo} onPlus={onTempoUp} onMinus={onTempoDown} onReset={onStyleTempo} />
          <div className="yh-display__tempo-keys">
            <Button
              label="Tap"
              size="md"
              hold
              name="Tap tempo"
              tip="tempo.tap"
              tipAction={tipAction}
              onHold={(down) => down && onTap?.()}
              onPress={onTap}
            />
            <Button label="Style tempo" size="md" variant="quiet" name="Back to the style's tempo" tip="tempo.reset" tipAction={tipAction} onPress={onStyleTempo} />
          </div>
        </div>

        {hasParts && (
          <ul className="yh-display__parts" aria-label="Sounds">
            {parts!.map((p) => (
              <PartRow key={p.id} part={p} tipAction={tipAction} onSound={onSound} />
            ))}
          </ul>
        )}
      </div>

      <div className="yh-display__beat">
        <BarBeat beat={running ? (nowPlaying.beat ?? 0) : 0} beats={nowPlaying.beats ?? 4} />
      </div>
    </section>
  );
}

export default Display;

function PartRow({ part: p, tipAction, onSound }: { part: DisplayPart; tipAction?: TipAction; onSound?: (id: Part) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || !tipAction) return;
    const handle = tipAction(node, 'launchkey.fader_sound');
    return () => handle?.destroy?.();
  }, [tipAction]);
  const tail = p.bass ? ' · bass' : p.off ? ' · off' : '';
  return (
    <li>
      <button
        ref={ref}
        type="button"
        className="yh-display__part"
        data-off={(p.off && !p.bass) || undefined}
        style={{ '--yh-display-part-hue': PART_HUE[p.id] } as CSSProperties}
        aria-label={`${p.name} sound: ${p.number ? `${p.number} ` : ''}${p.sound}${marksText(p)}. Opens the quick sound list`}
        data-tip="launchkey.fader_sound"
        onClick={() => onSound?.(p.id)}
      >
        <span className="yh-display__part-dot" aria-hidden="true" />
        <span className="yh-display__part-sound" aria-hidden="true">
          <span className="yh-display__part-name">{p.sound}</span>
          <PartMarks edited={p.edited} missing={p.missing} failed={p.failed} />
        </span>
        <span className="yh-display__part-part" aria-hidden="true">
          {p.name}
          {tail}
        </span>
      </button>
    </li>
  );
}

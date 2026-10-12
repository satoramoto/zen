import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';
import type * as React from 'react';
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
import { PART_HUE, SECTION_STATE_COLOUR, type Part } from '../hues';
import './Display.css';

export type { TipAction };

/** The hero's chrome and readout cap: see `DisplayProps.density`. */
export type DisplayDensity = 'auto' | 'full' | 'compact';

/**
 * The readouts' sizes, passed to each primitive's `size` (and BarBeat's `thickness`). Each is a
 * local variable the hero's CSS sets from its width (container units) and its density's cap, so
 * the primitives' own CSS is never overridden.
 */
export const DISPLAY_SIZES = {
  section: 'var(--yh-display-section)',
  chord: 'var(--yh-display-chord)',
  tempo: 'var(--yh-display-tempo)',
  beat: 'var(--yh-display-beat-line)',
} as const;

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
  /** The current bar of the section, 1-based. Kept for callers; the beat cells show where the bar is. */
  bar?: number;
  /** Bars in the section. */
  bars?: number;
  /** The tempo in BPM. */
  bpm: number;
  /** The style's own tempo in BPM. When `bpm` equals it, the Style tempo key looks unavailable (nothing to reset). Omitted: the key always looks available. */
  styleTempo?: number;
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
  /**
   * How much room the hero takes around its readouts. `compact`: tight chrome (small padding, a
   * short rule under the header, thinner beat cells) and the section, tempo and chord capped at
   * 60 / 52 / 44px (from the pack's numeral size), so the hero stays within about 200px tall
   * (Display.css works the heights out).
   * `full`: the roomy chrome, the caps at 96 / 84 / 72px (from the pack's display size).
   * `auto` (default): `compact` while the hero is narrower than 1200px, `full` from there (a
   * container query on the hero's own width). In every mode the readouts scale with the hero's
   * width (container units), from the pack's numeral size up to the mode's cap.
   */
  density?: DisplayDensity;
  /** The app's tooltip hook, applied to every control (the primitives apply it to their own). */
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
  /** Back to the style's own tempo (the Style tempo key beside Tap, or a double-click on the number). */
  onStyleTempo?: () => void;
}

/**
 * What hangs under the section: stopped, the status word; then the "then" tab with what's next and
 * when. Where the bar is ("bar 3 of 4") is no longer written: the beat cells under the tempo say it.
 */
function thenLine(n: DisplayNowPlaying): { status: string; next: string; when: string } {
  const next = (n.next ?? '').trim();
  const fill = (n.fill ?? '').trim();
  if (!n.running) return { status: n.syncStart ? 'Sync Start armed' : 'Stopped', next, when: '' };
  return { status: '', next, when: fill };
}

/** Readout scales, largest first: the row takes the first at which the three readouts fit the hero's width. */
const FITS = ['1', '0.9', '0.8', '0.7', '0.6'] as const;

/**
 * Steps the three readouts down together until they fit their row (a long section name such as
 * "Ending III" in a narrow column), so the section is never cut and the ranking holds, and drops
 * the genre · metre before the style's name would end in an ellipsis.
 * Both are measured after each change and whenever the hero resizes; nothing here is state, the
 * results are data attributes the CSS reads.
 */
function useFit(frame: React.RefObject<HTMLDivElement | null>, deps: unknown[]) {
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const readouts = el.querySelector<HTMLElement>('.yh-display__readouts');
    const style = el.querySelector<HTMLElement>('.yh-display__style');
    let live = true;
    const fit = () => {
      if (!live) return;
      if (readouts) {
        let chosen: string = FITS[FITS.length - 1];
        for (const step of FITS) {
          el.dataset.fit = step;
          if (readouts.scrollWidth <= readouts.clientWidth + 1) {
            chosen = step;
            break;
          }
        }
        el.dataset.fit = chosen;
      }
      if (style) {
        delete style.dataset.meta;
        const name = style.querySelector<HTMLElement>('.yh-accentblock__text');
        if (style.querySelector('.yh-display__meta') && name && name.scrollWidth > name.clientWidth + 1) style.dataset.meta = 'dropped';
      }
    };
    fit();
    document.fonts?.ready.then(fit);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
    observer?.observe(el);
    return () => {
      live = false;
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
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
 * **Changed.** *Hierarchy:* the original set chord, section and tempo in three competing hues in
 * three equal thirds. Here they share neutral ink and are ranked by size and place: the section
 * largest (12% of the hero's width, up to 96px at `full`), the only thing on a solid fill, the
 * `--selected` block (a solid fill means "sounding", `hues.ts`); the tempo next (10.5%, up to
 * 84px), the loudest number; the chord a step behind (9%, up to 72px). Each has its own cap per
 * density (`--yh-display-cap-*`) rather than one shared cap, so the ranking holds at every width
 * (typography.md, "Type Scale"). A long section name steps all three down together (by tenths, to
 * 0.6) until they fit the row, so the section is never cut, the chord keeps its cell and the
 * ranking holds.
 * *Hierarchy, one place per job:* what's next is said once, a "then" tab hanging flush under the
 * section block: one and a half control heights, `--text-1` on `--surface-2`, an arrow in the next
 * role (`--accent`, `SECTION_STATE_COLOUR.next`), the next section's name at 35% of the section's
 * size (never below heading size, so about 34px under a 96px block rather than a 14px footnote),
 * then when ("fill after bar 4") at label size. Where the bar is is drawn, not written: four beat
 * cells under the tempo (the lit beat in `--text-1`, beat 1 marked), where the old full-width beat
 * bar made a 300px slab louder than the chord; at `full` the cells are `--space-3` thick, enough to
 * read from a metre. *Rhythm, room to breathe:* the groups (header, readouts, the beat and the
 * tempo keys) stand a step further apart on the `--space-*` scale than the controls inside them,
 * so each reads as one group; spacing makes the room, never smaller or fainter text (color.md).
 * *Hierarchy, quiet chrome:* the "Section / Chord / Tempo" captions are gone (a block, a chord
 * symbol and a number with BPM name themselves), so that row goes to the readouts; the style
 * header and One Touch keep one control-height line above them, the applied One Touch underlined
 * rather than a second solid block, the style name without a chevron between ‹ and ›. Where the
 * header is short the genre · metre drops whole before the style's name would end in an ellipsis
 * (measured, like the section's fit). *Colour meaning:* sections take no hue; the tempo's ± keys
 * are neutral at rest (transport wears its hue only while active); the only hues left are the four
 * part dots, which mean the same part as the mixer and keyboard (color.md, "Semantic colours").
 * *Compact mode* (`density`): in a short region the chrome tightens (padding, the rule under the
 * header, thinner beat cells) and the caps drop to 60 / 52 / 44px; `auto`, the default, is compact
 * below a 1200px wide hero. *Narrow* (container queries): the parts are a fourth column only from a
 * 900px hero, one row under the readouts below that and gone below 600px; below 600px the chord's
 * notes drop too (never read mid-song), the fingering keeps one line with an ellipsis.
 * *Affordance:* Tap is a real key, and the style's tempo, once a hidden double-click, is a visible
 * quiet "Style tempo" key beside it (the double-click still works). It says which tempo it goes
 * back to, so it is never mistaken for the transport's section reset; when the tempo already is
 * the style's (`styleTempo`), it takes the unavailable face (`--text-3`, `aria-disabled`, still
 * focusable), since there is nothing to reset.
 *
 * **Kept.** The data and every callback of the original (prev/next/browse, One Touch, a part's
 * sound list, tempo up/down holds, drag/scroll/keys on the number, back to the style's tempo); the
 * button names ("Next style (Track right)", "Sunday Drive Pop: open the Browser", "Left sound: 33
 * Finger Bass…", "Apply One Touch 3…", "Tempo up (Scene Launch)", "Back to the style's tempo");
 * "Stopped" and "Sync Start armed" under the section; the beat's states; the chord stepping down
 * to fit; the sizes reaching each primitive through its own `size` option (and BarBeat's
 * `thickness`), never by overriding its CSS; the app's `tipAction` on every control, applied once
 * each (the primitives apply it to their own).
 */
export function Display({
  style,
  nowPlaying,
  parts,
  art = false,
  density = 'auto',
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
  const line = thenLine(nowPlaying);
  const hasParts = (parts?.length ?? 0) > 0;
  const frame = useRef<HTMLDivElement>(null);
  const chord = nowPlaying.chord;
  /** Already at the style's tempo: the Style tempo key has nothing to do. */
  const atStyleTempo = nowPlaying.styleTempo !== undefined && nowPlaying.bpm === nowPlaying.styleTempo;
  useFit(frame, [name, meta, queued, nowPlaying.playing, nowPlaying.bpm, chord.chord, chord.extension, hasParts, density]);

  return (
    <section
      className="yh-display"
      aria-label="Stage display"
      data-density={density}
      data-running={running || undefined}
      data-parts={hasParts || undefined}
    >
      {art && (
        <div className="yh-display__art">
          <DisplayArt />
        </div>
      )}

      {/* The frame holds the sizes: a container query styles only what is inside the container. */}
      <div ref={frame} className="yh-display__frame" data-fit="1">
        <header className="yh-display__header">
          <div className="yh-display__style" role="group" aria-label="Style">
            <Button symbol="prev" size="icon" variant="quiet" name="Previous style (Track left)" tip="style.prev" tipAction={tipAction} onPress={onPrev} />
            <span className="yh-display__style-name" title={name}>
              <AccentBlock
                as="button"
                label={name}
                name={`${name}: open the Browser`}
                chevron={false}
                tip="browser.open"
                tipAction={tipAction}
                onPress={onBrowse}
              />
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
            <OneTouchPicker applied={style.oneTouch ?? 0} count={style.oneTouchCount ?? 4} tipAction={tipAction} onApply={onOneTouch} />
          </div>
        </header>

        <div className="yh-display__readouts">
          <div className="yh-display__cell yh-display__section" role="group" aria-label="Section">
            <div
              className="yh-display__now"
              role="img"
              aria-label={`${running ? 'Playing' : 'Stopped on'} ${nowPlaying.playing.trim() || 'no section'}`}
              data-live={running || undefined}
            >
              <SectionName label={nowPlaying.playing} idle={!running} size={DISPLAY_SIZES.section} />
            </div>
            {(line.status || line.next || line.when) && (
              <p className="yh-display__next">
                {line.status && <span className="yh-display__status">{line.status}</span>}
                {(line.next || line.when) && (
                  <span
                    className="yh-display__then"
                    data-docked={running || undefined}
                    style={{ '--yh-display-then-hue': SECTION_STATE_COLOUR.next } as CSSProperties}
                  >
                    <span className="yh-display__then-arrow" aria-hidden="true" />
                    <span className="yh-display__then-word">then </span>
                    {line.next && <span className="yh-display__then-name">{line.next}</span>}
                    {line.when && <span className="yh-display__when">{line.when}</span>}
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="yh-display__cell yh-display__chord">
            <ChordReadout {...nowPlaying.chord} tip="fingering.select" tipAction={tipAction} size={DISPLAY_SIZES.chord} />
          </div>

          <div className="yh-display__cell yh-display__tempo" role="group" aria-label="Tempo and Tap">
            <TempoReadout
              bpm={nowPlaying.bpm}
              size={DISPLAY_SIZES.tempo}
              tipAction={tipAction}
              onTempo={onTempo}
              onPlus={onTempoUp}
              onMinus={onTempoDown}
              onReset={onStyleTempo}
            />
            <div className="yh-display__beat">
              <BarBeat beat={running ? (nowPlaying.beat ?? 0) : 0} beats={nowPlaying.beats ?? 4} thickness={DISPLAY_SIZES.beat} />
            </div>
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
              <Button
                label="Style tempo"
                size="md"
                variant="quiet"
                disabled={atStyleTempo}
                name="Back to the style's tempo"
                tip="tempo.reset"
                tipAction={tipAction}
                onPress={onStyleTempo}
              />
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
  // The " · " before it is CSS, so a one-row parts strip can drop the name and keep "off".
  const tail = p.bass ? 'bass' : p.off ? 'off' : '';
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
          <span className="yh-display__part-label">{p.name}</span>
          {tail && <span className="yh-display__part-tail">{tail}</span>}
        </span>
      </button>
    </li>
  );
}

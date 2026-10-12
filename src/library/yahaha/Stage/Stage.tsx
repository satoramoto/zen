import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { AppBar, type AppBarProps } from '../AppBar/AppBar';
import { Display, type DisplayDensity, type DisplayProps } from '../Display/Display';
import { FaderBank, type FaderBankProps } from '../FaderBank/FaderBank';
import { Keys, type KeysProps } from '../Keys/Keys';
import { KnobBank, type KnobBankProps } from '../KnobBank/KnobBank';
import { PadBank, type PadBankProps } from '../PadBank/PadBank';
import { SongForm, type SongFormProps } from '../SongForm/SongForm';
import { StatusLine, type StatusLineProps } from '../StatusLine/StatusLine';
import { tapTempo } from './tapTempo';
import './Stage.css';

/** The app's tooltip action, handed to every region. */
export type StageTipAction = (node: HTMLElement, key: string) => void | { update?: (key: string) => void; destroy?: () => void };

/** The slowest and fastest tempo a tap may set. */
export const TEMPO_MIN = 40;
export const TEMPO_MAX = 280;

export interface StageProps {
  /** The top bar: pages, the global switches (Metronome and its settings, Unison, Help, Panic), health. */
  appBar: Omit<AppBarProps, 'width' | 'nowPlaying' | 'tipAction'>;
  /**
   * The hero: style, One Touch, section now and next, chord, tempo and the screen's one Tap, beat.
   * Its `parts` column is never shown here (the mixer names every part's sound). `onTap` is
   * called on each tap; once two or more taps are in time the Stage asks `onTempo` for their tempo.
   * Its `density` is the Stage's: `full` where the screen has the height, `compact` where not.
   */
  display: Omit<DisplayProps, 'parts' | 'tipAction' | 'density'>;
  /** The song form and the screen's one transport cluster. */
  songForm: Omit<SongFormProps, 'tipAction'>;
  /** The mixer. */
  faders: Omit<FaderBankProps, 'tipAction'>;
  /** The eight knobs and their pages. */
  knobs: Omit<KnobBankProps, 'tipAction'>;
  /** The sixteen pads and their banks, always two rows of eight here. */
  pads: Omit<PadBankProps, 'tipAction' | 'columns'>;
  /** The keyboard: range, split, held notes. Its width follows the screen. */
  keys: Omit<KeysProps, 'width' | 'tipAction'>;
  /** The status line, at the foot of the knobs and pads. */
  status: Omit<StatusLineProps, 'width'>;
  /** The app's tooltip action, passed to every region. */
  tipAction?: StageTipAction;
  /** The screen's size in px. Unset, it fills its container's width and the viewport's height. */
  width?: number;
  height?: number;
  /**
   * How the top of the screen is arranged. `split` (the default): the hero, and beside it the song
   * form over the transport. `stacked`: the hero with the transport beside it, and the song form as
   * one strip across the screen under them.
   */
  layout?: StageLayout;
}

/** The Stage's top arrangements: see `StageProps.layout`. */
export type StageLayout = 'split' | 'stacked';

/** The keys' width before the slot is measured (the 1440 board inside its margins). */
const KEYS_FALLBACK = 1392;

/** The keys slot's width in its own CSS px, measured as it resizes; `fallback` where nothing measures (jsdom). */
function useSlotWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const w = node.clientWidth;
      if (w > 0) setWidth(w);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** The hero's density: `full` (roomy chrome) wherever the screen has the height, else `compact`. */
export type StageHeroDensity = Extract<DisplayDensity, 'full' | 'compact'>;

/**
 * Fits the screen to its frame, in three steps, each only when the one before still leaves the
 * regions more room than the frame gives:
 *
 * 1. The screen is laid out at the frame's own size, at zoom 1, with the hero at `full` density.
 * 2. If that overflows, the hero goes `compact` (its tight chrome) and the screen refits. The frame
 *    size where `full` overflowed is kept, with the compact screen's content size at that frame.
 *    A larger frame tries `full` again, and so does smaller content at the same frame (a pack
 *    switch to a denser pack, a shorter status): one retry each time, and if `full` still
 *    overflows the hero settles back on `compact` with the new content size remembered.
 * 3. If the compact screen still overflows (a frame below the smallest screen, or a large-density
 *    pack), the whole screen is zoomed down by the one factor that makes it fit, so no region is
 *    squeezed out of shape and nothing is cut off. A zoomed screen is laid out wider than the
 *    frame, so it may refit a little taller; a few passes settle it.
 *
 * It refits when the frame resizes and when the screen's content does: the screen's own box is
 * set here, so its rows are observed too (a pack switch, a status message, the hero's density).
 * Nothing measures in jsdom: the screen stays at zoom 1 and the hero `full`.
 */
function useFit(layout: StageLayout) {
  const frame = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const [hero, setHero] = useState<StageHeroDensity>('full');
  /** The frame size at which the `full` hero last overflowed. */
  const tight = useRef<{ w: number; h: number; content?: { w: number; h: number } } | null>(null);
  useLayoutEffect(() => {
    const outer = frame.current;
    const inner = screen.current;
    if (!outer || !inner || typeof ResizeObserver === 'undefined') return;
    let settled = false;
    const fit = () => {
      if (settled) return;
      const w = outer.clientWidth;
      const h = outer.clientHeight;
      if (w <= 0 || h <= 0) return;
      if (hero === 'compact' && tight.current && (w > tight.current.w || h > tight.current.h)) {
        tight.current = null;
        settled = true;
        setHero('full');
        return;
      }
      let zoom = 1;
      for (let pass = 0; pass < 4; pass++) {
        inner.style.zoom = String(zoom);
        inner.style.width = `${w / zoom}px`;
        inner.style.height = `${h / zoom}px`;
        if (pass === 0 && hero === 'compact' && tight.current) {
          // The compact content at zoom 1; if it shrank since `full` overflowed here, retry `full`.
          const content = { w: inner.scrollWidth, h: inner.scrollHeight };
          const was = tight.current.content;
          if (was && content.w <= was.w && content.h <= was.h && (content.w < was.w || content.h < was.h)) {
            tight.current = null;
            settled = true;
            setHero('full');
            return;
          }
          tight.current.content = content;
        }
        const room = Math.min(inner.clientHeight / inner.scrollHeight, inner.clientWidth / inner.scrollWidth);
        if (room >= 0.999) break;
        if (pass === 0 && hero === 'full') {
          tight.current = { w, h };
          settled = true;
          setHero('compact');
          return;
        }
        zoom *= room;
      }
      outer.dataset.zoom = zoom.toFixed(3);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(outer);
    observer.observe(inner);
    for (const row of Array.from(inner.children)) observer.observe(row);
    return () => observer.disconnect();
  }, [hero, layout]);
  return [frame, screen, hero] as const;
}

/**
 * Stage: the whole app on one screen, what a player looks at while playing live.
 *
 * **Job.** Answer, mid-song and from a metre away, in this order: what is the band playing now
 * (section, chord) and how fast; what comes next and where that sits in the song; then let the
 * hands reach the controls (the mixer, knobs, pads) and see the keyboard's split and held notes.
 * Every concept of the instrument is on this one screen, each in exactly one place.
 *
 * **Changed.** *One hierarchy, read top to bottom and left to right* (`STAGE.md` 1;
 * `references/layout.md`, reading order): under a quiet page bar the screen has two rows. The top
 * row is *now*: the Display (the hero) in the top-left corner, where the eye lands first, and
 * beside it the song form, so "Main B → Main C" in the hero and the NEXT ring on the form read as
 * one line; the form's own transport cluster sits under it, so Start / Stop is the largest key on
 * screen and next to the sections it moves through. The bottom row is *the hands*: the mixer, then
 * the knobs over the pads, the way the Launchkey lays them out, and the keys at the foot. The
 * original put a row of switches above the hero, so the first thing read was not
 * the music. *One place per job* (`STAGE.md` 3): the transport lives only in SongForm, Tap only
 * in the Display (the Stage times its taps, `tapTempo.ts`), the global switches and Panic only in
 * the AppBar. The Display's parts column is not shown: the mixer already names each part's sound
 * under its fader in the part's hue, so a second list of sounds would be a second place for one
 * fact. *Alignment and grouping*: the pads are two rows of eight under the eight knobs, so each
 * knob stands over its two pads as on the hardware and the right half reads as one eight-wide
 * grid; a 4 × 4 block would break that column alignment and leave half the width empty. The mixer
 * stays a little wider than knobs and pads (1.1 : 1), which still leaves each knob room for its
 * name. *Proportion, and no empty space* (`references/layout.md`, whitespace that groups rather
 * than gaps): the top row takes its own height, the bottom row the rest, so the mixer gets the
 * fader travel. The status line closes the knobs-and-pads column, level with the mixer's Functions
 * line, instead of holding a row of its own over the keys: that row was empty whenever there was
 * nothing to say, a dead band between the hands and the keys. *Hierarchy at every size, then fit*:
 * the screen is laid out at the frame's own size. Where it has the height (the 1440 × 900 board)
 * the hero is the Display's `full` density, its roomy chrome and readouts at their largest, so now
 * playing is the loudest thing on screen; where it is short, the hero goes `compact` and the
 * screen closes its gaps a step, and only then, if the regions still need more room than the
 * frame has, is the whole screen zoomed down. So 1217 × 752 is laid out at 100% with a 470 px hero
 * (the hero may shrink to 15.5 control heights, 434 px), not the 1440 board scaled to 0.845; a pack
 * whose density needs more room than the screen has (Ableton's larger controls) is zoomed down
 * just enough, so nothing is ever cut off or pushed off screen.
 *
 * **Kept.** The original's regions and every one of their callbacks, passed straight through,
 * so a region behaves the same here as in its own story; the 1440 × 900 board and the 1217 × 752
 * small screen, each in one layout; the status line in plain sight under the controls; the keys
 * spanning the full width; the tap tempo rule (two or more taps in time, the last four count).
 */
export function Stage({ appBar, display, songForm, faders, knobs, pads, keys, status, tipAction, width, height, layout = 'split' }: StageProps) {
  const [keysSlot, keysWidth] = useSlotWidth(width === undefined ? KEYS_FALLBACK : Math.min(KEYS_FALLBACK, width - 48));
  const [frame, screen, heroDensity] = useFit(layout);
  const taps = useRef<number[]>([]);

  const onTap = () => {
    display.onTap?.();
    const next = tapTempo(taps.current, performance.now());
    taps.current = next.taps;
    if (next.bpm !== undefined) display.onTempo?.(Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, next.bpm)));
  };

  const size: CSSProperties = {};
  if (width !== undefined) size.width = `${width}px`;
  if (height !== undefined) size.height = `${height}px`;

  return (
    <div ref={frame} className="yh-stage" style={size} role="group" aria-label="Stage">
      <div ref={screen} className="yh-stage__screen" data-hero={heroDensity} data-layout={layout}>
        <div className="yh-stage__bar">
          <AppBar {...appBar} tipAction={tipAction} />
        </div>
        <div className="yh-stage__top">
          <div className="yh-stage__display">
            <Display {...display} parts={undefined} density={heroDensity} tipAction={tipAction} onTap={onTap} />
          </div>
          <div className="yh-stage__form">
            <SongForm {...songForm} part={layout === 'stacked' ? 'transport' : 'both'} tipAction={tipAction} />
          </div>
        </div>
        {layout === 'stacked' && (
          <div className="yh-stage__strip">
            <SongForm {...songForm} part="form" tipAction={tipAction} />
          </div>
        )}
        <div className="yh-stage__band">
          <div className="yh-stage__faders">
            <FaderBank {...faders} tipAction={tipAction} />
          </div>
          <div className="yh-stage__controls">
            <div className="yh-stage__knobs">
              <KnobBank {...knobs} tipAction={tipAction} />
            </div>
            <div className="yh-stage__pads">
              <PadBank {...pads} columns={8} tipAction={tipAction} />
            </div>
            <div className="yh-stage__status">
              <StatusLine {...status} />
            </div>
          </div>
        </div>
        <div className="yh-stage__keys" ref={keysSlot}>
          <Keys {...keys} width={keysWidth} tipAction={tipAction} />
        </div>
      </div>
    </div>
  );
}

export default Stage;

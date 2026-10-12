import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Region } from '../../layout/Region';
import { Screen } from '../../layout/Screen';
import { AppBar, type AppBarProps } from '../AppBar/AppBar';
import { Display, type DisplayDensity, type DisplayProps } from '../Display/Display';
import { FaderBankRegion, type FaderBankProps } from '../FaderBank/FaderBank';
import { Keys, type KeysProps } from '../../components/music/Keys/Keys';
import { KnobBankRegion, type KnobBankProps } from '../KnobBank/KnobBank';
import { PadBankRegion, type PadBankProps } from '../PadBank/PadBank';
import { SongForm, type SongFormProps } from '../SongForm/SongForm';
import { StatusLine, type StatusLineProps } from '../StatusLine/StatusLine';
import { pressSectionPad, sectionPads, SECTIONS_BANK } from './sectionPads';
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
  /**
   * The sixteen pads and their banks, always two rows of eight here. While the chosen bank is
   * `Sections`, its pads come from `songForm` (`sectionPads`) and their presses go to `songForm`'s
   * callbacks and the hero's Tap; `pads` and `onPress` are used only for the other banks.
   */
  pads: Omit<PadBankProps, 'tipAction' | 'columns'>;
  /** The keyboard: range, split, held notes. Its width follows the screen. */
  keys: Omit<KeysProps, 'width' | 'tipAction'>;
  /** The status line: in the screen's fixed footer, under the keys, in every layout. */
  status: Omit<StatusLineProps, 'width'>;
  /** The app's tooltip action, passed to every region. */
  tipAction?: StageTipAction;
  /** The screen's size in px. Unset, it fills its container's width and the viewport's height. */
  width?: number;
  height?: number;
  /**
   * How the top of the screen is arranged. `stacked` (the default): the hero with the transport
   * beside it, the song form one strip across the screen under them, and one column seam from the
   * top row through the band. `split`: the hero, and beside it the song form over the transport.
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
 * Fits the screen's grid (the regions between the fixed app bar and the fixed keys and status
 * line) to the room the screen leaves it, in three steps, each only when the one before still
 * leaves the regions more room than that gives:
 *
 * 1. The grid is laid out at its room's own size, at zoom 1, with the hero at `full` density.
 * 2. If that overflows, the hero goes `compact` (its tight chrome) and the grid refits. The room
 *    where `full` overflowed is kept, with the compact grid's content size at that room. A larger
 *    room tries `full` again, and so does smaller content in the same room (a pack switch to a
 *    denser pack): one retry each time, and if `full` still overflows the hero settles back on
 *    `compact` with the new content size remembered.
 * 3. If the compact grid still overflows (a frame below the smallest screen, or a large-density
 *    pack), the grid alone is zoomed down by the one factor that makes it fit, so no region is
 *    squeezed out of shape and nothing is cut off; the header and footer never zoom. A zoomed grid
 *    is laid out wider than its room, so it may refit a little taller; a few passes settle it.
 *
 * The room is the grid's own track: each fit first clears the grid's box and reads it. It refits
 * when the frame resizes, when the header or footer does (a status message, the keys), and when a
 * region's content does (a pack switch, the hero's density). Nothing measures in jsdom: the grid
 * stays at zoom 1 and the hero `full`.
 */
function useFit(layout: StageLayout) {
  const frame = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [hero, setHero] = useState<StageHeroDensity>('full');
  /** The room at which the `full` hero last overflowed. */
  const tight = useRef<{ w: number; h: number; content?: { w: number; h: number } } | null>(null);
  useLayoutEffect(() => {
    const outer = frame.current;
    const inner = grid.current;
    if (!outer || !inner || typeof ResizeObserver === 'undefined') return;
    let settled = false;
    const fit = () => {
      if (settled) return;
      inner.style.zoom = '';
      inner.style.width = '';
      inner.style.height = '';
      const w = inner.clientWidth;
      const h = inner.clientHeight;
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
    // The header and footer (their height is the grid's room), and each region of the grid.
    for (const part of Array.from(inner.parentElement?.children ?? [])) if (part !== inner) observer.observe(part);
    for (const region of Array.from(inner.children)) observer.observe(region);
    return () => observer.disconnect();
  }, [hero, layout]);
  return [frame, grid, hero] as const;
}

/**
 * Stage: the whole app on one screen, what a player looks at while playing live.
 *
 * **Job.** Answer, mid-song and from a metre away, in this order: what is the band playing now
 * (section, chord) and how fast; what comes next and where that sits in the song; then let the
 * hands reach the controls (the mixer, knobs, pads) and see the keyboard's split and held notes.
 * Every concept of the instrument is on this one screen, each in exactly one place.
 *
 * **Changed.** The screen reads *now → next → controls*, top to bottom, in four bands under a
 * quiet page bar (`STAGE.md` 1; `references/layout.md`, reading order). *Now*: the Display (the
 * hero) in the top-left corner, where the eye lands first, and beside it the transport, so the
 * tempo and Start / Stop sit on one line. *Next*: the song form, one strip across the whole
 * screen, Intro → Main A–D → Ending in order with now and next marked on it, the way a player's
 * timeline runs, so "Main B → Main C" in the hero reads straight down onto the form. *Controls*:
 * the mixer, then the knobs over the pads, the way the Launchkey lays them out, and the keys at
 * the foot.
 *
 * *One hierarchy* (`STAGE.md` 1): the hero's column is wide enough (760 px at 1440) for section,
 * tempo and chord to reach their full sizes at the `full` density, so now playing is the loudest
 * thing a metre away. *No dead bands*: the top row is exactly as tall as the hero (282 px at the
 * board, 190 at 1217 × 752), and the transport fills that height beside it (SongForm sizes its
 * own two key rows and their labels to the height; the Stage never reaches in), so the
 * transport is a block of large keys rather than a short row under empty space. The strip and the band share the rest 72 : 380, each never below its floor. The pads are
 * squares (PadBank), so a tall band only left empty height under them; the band's floor now counts
 * only the mixer's and the pads' least, and that height went to the full hero.
 *
 * *A screen of regions that stay put* (`src/library/layout/`): the Stage is a library `Screen`.
 * Its header (the AppBar) and footer (the Keyboard region and the status line) are fixed; between
 * them a named grid (`areas`) holds the regions Hero, Transport, Song form, Mixer, Knobs and Pads.
 * Each is a library `Region` on the theme's `plate` material, so the material decides how a
 * region looks, the room inside it (`--mat-plate-inset`) and the space between regions
 * (`--mat-plate-gap`). Tabs live in the region: the pad banks are the Pads region's views, the
 * knob pages the Knobs region's, the fader pages the Mixer's with its layer `Tabs` in the aside
 * (`PadBankRegion`, `KnobBankRegion`, `FaderBankRegion`), so a tab swaps the content inside a
 * frame that never moves. No region sits inside another's plate, and no text is made smaller to
 * buy the room.
 *
 * *Mapping* (the Launchkey's pads play the sections): the pad tabs are Sections, Quick Racks,
 * Chord, Multi Pads, Setup, as the hardware pages them. The Sections bank's sixteen pads are drawn
 * from the song form's props by one function (`sectionPads.ts`), so they can never disagree with
 * the strip: the playing section filled (only while running), next in the accent ring, absent
 * sections dark, Sync Start, Sync Stop, Auto Fill and Start / Stop wearing the transport's state.
 * A pad press calls exactly what that step or key calls (`onSection`, `onSyncStart`,
 * `onAutoFill`, `onSyncStop`, `onStartStop`), and Tap is the hero's Tap, timed the same way.
 *
 * *One column seam* (`references/layout.md`, alignment): the grid has two columns, so the hero
 * and the mixer share the left track and the transport and the knobs and pads the right one (1.25 : 1, the right never narrower than the
 * transport's 18 control heights). One vertical seam runs from the bar to the keys, the one plate
 * gap beside the hero and beside the mixer. The old screen had two seams 34 px
 * apart (731 and 765 px), which read as a mistake.
 *
 * *One place per job* (`STAGE.md` 3): the transport lives only in SongForm, Tap only in the
 * Display (the Stage times its taps, `tapTempo.ts`), the global switches and Panic only in the
 * AppBar, the part colours only on the parts (no hue legend on this screen: the mixer names each
 * part in its hue). The Display's parts column is not shown: the mixer already names each part's
 * sound under its fader, so a second list would be a second place for one fact. The status line
 * sits in the fixed footer under the keys, so a message never moves a region. The pads are two
 * rows of eight under the eight knobs, so each knob stands over its two pads as on the hardware.
 * The one deliberate second place: on the Sections bank the pads mirror the hardware's pads, so
 * each section and the five transport pads appear there as well as in the strip and transport;
 * they are the same controls (one state, one callback), not a second set.
 *
 * *Hierarchy at every size, then fit*: the grid is laid out at the room the header and footer
 * leave it. Where the screen has the height (1440 × 900) the hero is the Display's `full`
 * density; where it is short (1217 × 752) the hero goes `compact`; only if the regions still need
 * more room than that is the grid (never the bar or the keys) zoomed down, so nothing is cut off. The
 * previous `split` layout (the song form over the transport beside the hero) stays as `layout`.
 *
 * **Kept.** The original's regions and every one of their callbacks, passed straight through,
 * so a region behaves the same here as in its own story; the 1440 × 900 board and the 1217 × 752
 * small screen; the status line in plain sight; the keys spanning the full
 * width; the tap tempo rule (two or more taps in time, the last four count).
 */
export function Stage({ appBar, display, songForm, faders, knobs, pads, keys, status, tipAction, width, height, layout = 'stacked' }: StageProps) {
  const [keysSlot, keysWidth] = useSlotWidth(width === undefined ? KEYS_FALLBACK : Math.min(KEYS_FALLBACK, width - 48));
  const [frame, grid, heroDensity] = useFit(layout);
  const taps = useRef<number[]>([]);

  const onTap = () => {
    display.onTap?.();
    const next = tapTempo(taps.current, performance.now());
    taps.current = next.taps;
    if (next.bpm !== undefined) display.onTempo?.(Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, next.bpm)));
  };

  // The Sections bank mirrors the hardware: its pads are drawn from the song form's props (never
  // from `pads.pads`), and a press does what that step or key does in the strip and the transport.
  const onSections = pads.banks?.[pads.bank ?? 0] === SECTIONS_BANK;
  const shownPads: StageProps['pads'] = onSections
    ? { ...pads, pads: sectionPads(songForm), lit: songForm.lit ?? pads.lit, onPress: (i) => pressSectionPad(i, { ...songForm, onTap }) }
    : pads;

  const size: CSSProperties = {};
  if (width !== undefined) size.width = `${width}px`;
  if (height !== undefined) size.height = `${height}px`;

  const stacked = layout === 'stacked';
  const plan = GRID[layout];

  // A Screen: the app bar fixed on top, the keys and the status line fixed at the foot, and between
  // them the grid of regions that stay put; each region's own tabs swap what is inside it.
  return (
    <div ref={frame} className="yh-stage" data-part="root" style={size} data-layout={layout} data-hero={heroDensity}>
      <Screen
        name="Stage"
        className="yh-stage__screen"
        header={
          <div className="yh-stage__bar" data-part="bar">
            <AppBar {...appBar} tipAction={tipAction} />
          </div>
        }
        footer={
          <>
            <Region name="Keyboard" className="yh-stage__region yh-stage__keys-region">
              <div className="yh-stage__keys" data-part="keys" ref={keysSlot}>
                <Keys {...keys} width={keysWidth} tipAction={tipAction} />
              </div>
            </Region>
            <div className="yh-stage__status" data-part="status">
              <StatusLine {...status} />
            </div>
          </>
        }
        areas={plan.areas}
        columns={plan.columns}
        rows={plan.rows}
        gridRef={grid}
      >
        <Region name="Hero" area="hero" className="yh-stage__region yh-stage__hero">
          <div className="yh-stage__display" data-part="hero">
            <Display {...display} parts={undefined} density={heroDensity} tipAction={tipAction} onTap={onTap} />
          </div>
        </Region>
        {stacked ? (
          <>
            <Region name="Transport" area="transport" className="yh-stage__region yh-stage__transport">
              <div className="yh-stage__form" data-part="transport">
                <SongForm {...songForm} part="transport" tipAction={tipAction} />
              </div>
            </Region>
            <Region name="Song form" area="form" className="yh-stage__region yh-stage__strip">
              <div className="yh-stage__fill" data-part="strip">
                <SongForm {...songForm} part="form" tipAction={tipAction} />
              </div>
            </Region>
          </>
        ) : (
          <Region name="Song form and transport" area="form" className="yh-stage__region yh-stage__form-region">
            <div className="yh-stage__form" data-part="transport">
              <SongForm {...songForm} part="both" tipAction={tipAction} />
            </div>
          </Region>
        )}
        <FaderBankRegion {...faders} area="mixer" className="yh-stage__region yh-stage__mixer" tipAction={tipAction} />
        <KnobBankRegion {...knobs} area="knobs" className="yh-stage__region yh-stage__knobs" tipAction={tipAction} />
        <PadBankRegion {...shownPads} area="pads" className="yh-stage__region yh-stage__pads" columns={8} tipAction={tipAction} />
      </Screen>
    </div>
  );
}

/**
 * Each layout's grid. Stacked: the hero with the transport beside it, the song form one strip
 * across, then the mixer beside the knobs over the pads, on one column seam (1.25 : 1); the strip
 * and the pads share what the hero and knobs leave, 72 : 380. Split: the hero, and beside it the
 * song form over the transport at its own width; the mixer, knobs and pads below on the same seam.
 * `min-content` for the hero's and the knobs' rows: `auto` lets a row shrink under a region whose
 * content then overflows onto the next one (the knobs once drew over the pads), instead of
 * overflowing the grid so the fit zooms.
 */
const GRID: Record<StageLayout, { areas: string[]; columns: string; rows: string }> = {
  stacked: {
    areas: ['hero transport', 'form form', 'mixer knobs', 'mixer pads'],
    columns: 'minmax(auto, 1.25fr) minmax(auto, 1fr)',
    rows: 'min-content minmax(auto, 72fr) min-content minmax(min-content, 380fr)',
  },
  split: {
    areas: ['hero form', 'mixer knobs', 'mixer pads'],
    columns: 'minmax(auto, 1fr) auto',
    rows: 'min-content min-content minmax(min-content, 1fr)',
  },
};

export default Stage;

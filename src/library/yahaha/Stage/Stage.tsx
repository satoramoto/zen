import { useRef, type CSSProperties } from 'react';
import type { Placed, Placement } from '../../layout/assembly/types';
import { useScopePrinciples } from '../../layout/assembly/AssembledScreen';
import { Region } from '../../layout/Region';
import { Screen } from '../../layout/Screen';
import { AppBar, type AppBarProps } from '../AppBar/AppBar';
import { Display, type DisplayProps } from '../Display/Display';
import { FaderBankRegion, type FaderBankProps } from '../FaderBank/FaderBank';
import { Keys, type KeysProps } from '../../components/music/Keys/Keys';
import { KnobBankRegion, type KnobBankProps } from '../KnobBank/KnobBank';
import { PadBankRegion, type PadBankProps } from '../PadBank/PadBank';
import { SongForm, type SongFormProps } from '../SongForm/SongForm';
import { StatusLine, type StatusLineProps } from '../StatusLine/StatusLine';
import { pressSectionPad, sectionPads, SECTIONS_BANK } from './sectionPads';
import { STAGE_SPEC, STAGE_SPLIT_SPEC } from './Stage.spec';
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
   * Its form (`full`, `compact`, `minimal`) is the screen's choice.
   */
  display: Omit<DisplayProps, 'parts' | 'tipAction' | 'density' | 'form'>;
  /**
   * The song's state and the screen's one transport cluster. The Stage draws no song form strip:
   * the transport region reads it, and the Pads region's Sections bank draws the sections from it.
   */
  songForm: Omit<SongFormProps, 'tipAction'>;
  /** The mixer. */
  faders: Omit<FaderBankProps, 'tipAction'>;
  /** The eight knobs and their pages. */
  knobs: Omit<KnobBankProps, 'tipAction'>;
  /**
   * The sixteen pads and their banks; their form (two rows of eight, or one of sixteen) is the
   * screen's. While the chosen bank is `Sections`, its pads come from `songForm` (`sectionPads`)
   * and their presses go to `songForm`'s callbacks and the hero's Tap; `pads` and `onPress` are
   * used only for the other banks.
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
   * Which spec the screen assembles (`Stage.spec.ts`). `stacked` (the default): the hero with the
   * transport beside it, then the mixer beside the knobs over the pads. `split`: the hero across
   * the top, and the transport down the right-hand side beside the knobs and pads.
   */
  layout?: StageLayout;
  /** Called with each new placement (the solver's forms, sizes and zoom), for tests and inspectors. */
  onPlacement?: (placement: Placement) => void;
}

/** The Stage's top arrangements: see `StageProps.layout`. */
export type StageLayout = 'split' | 'stacked';

/**
 * Stage: the whole app on one screen, what a player looks at while playing live.
 *
 * **Job.** Answer, mid-song and from a metre away, in this order: what is the band playing now
 * (section, chord) and how fast; what comes next and where that sits in the song; then let the
 * hands reach the controls (the mixer, knobs, pads) and see the keyboard's split and held notes.
 * Every concept of the instrument is on this one screen, each in exactly one place.
 *
 * **Assembled** (`docs/assembly.md`). The Stage is a spec, never a grid: `STAGE_SPEC` says what
 * it holds and what matters (STAGE.md › Assembly), each region's forms are its component's own
 * (Display `full → compact → minimal`, the transport, FaderBank `tall → short`, KnobBank,
 * PadBank), and `assemble()` picks every form, size and the zoom from them and the pack's
 * principles. *Now*: the Display (the hero, `now`, the last to step down) in the top-left
 * corner, and beside it the transport, so the tempo and Start / Stop share a line. *Next*: the
 * hero's next section, and the Pads region's Sections bank (its default view), which reads as
 * the song's form. *Controls*: the mixer beside the knobs over the pads, each knob over its
 * column of pads as on the Launchkey. The hero and the mixer are a pair: one column seam
 * from the bar to the keys. The app bar (the header) and the keys and status line (the footer)
 * never step down or zoom; only the body zooms, and only when no step down helps, never below
 * the pack's `minTarget`. A region's form changes only its own shape; the Stage never reaches in.
 * The screen is 16:9 (`aspect`): it is laid out in the largest 16:9 room inside the window, and
 * the rest of the window is ground bands (letterbox or pillarbox).
 *
 * Each region is a library `Region` on the theme's `plate` material, so the material decides how
 * a region looks, the room inside it (`--mat-plate-inset`) and the space between regions
 * (`--mat-plate-gap`), and the solver counts both. Tabs live in the region (`PadBankRegion`,
 * `KnobBankRegion`, `FaderBankRegion`), so a tab swaps the content inside a frame that never moves.
 *
 * *Mapping* (the Launchkey's pads play the sections): the pad tabs are Sections, Quick Racks,
 * Chord, Multi Pads, Setup, as the hardware pages them. The Sections bank's sixteen pads are drawn
 * from the song form's props by one function (`sectionPads.ts`), so they can never disagree with
 * the hero or the transport, and a pad press calls exactly what that step or key calls; Tap is
 * the hero's Tap, timed the same way (`tapTempo.ts`). The board opens on Sections; there is no
 * song form strip, since it drew the same sections twice.
 *
 * *One place per job* (`STAGE.md` 3): the transport lives only in SongForm, Tap only in the
 * Display, the global switches and Panic only in the AppBar, the part colours only on the parts.
 * The status line sits in the fixed footer under the keys, so a message never moves a region.
 *
 * **Kept.** The original's regions and every one of their callbacks, passed straight through;
 * the 1217 × 752 small screen (now a 16:9 room inside it; the board is 1920 × 1080); the keys
 * spanning the full width; the tap tempo rule (two or more taps in time, the last four count).
 */
export function Stage({ appBar, display, songForm, faders, knobs, pads, keys, status, tipAction, width, height, layout = 'stacked', onPlacement }: StageProps) {
  const taps = useRef<number[]>([]);
  const { inset } = useScopePrinciples().plate;

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
  const room = width !== undefined && height !== undefined ? { w: width, h: height } : undefined;

  return (
    <div className="yh-stage" data-part="root" style={size} data-layout={layout}>
      <Screen
        name="Stage"
        className="yh-stage__screen"
        spec={layout === 'split' ? STAGE_SPLIT_SPEC : STAGE_SPEC}
        room={room}
        onPlacement={onPlacement}
        regions={{
          bar: <AppBar {...appBar} tipAction={tipAction} />,
          hero: (
            <Region name="Hero">
              <Display {...display} parts={undefined} tipAction={tipAction} onTap={onTap} />
            </Region>
          ),
          transport: (
            <Region name="Transport">
              <SongForm {...songForm} part="transport" tipAction={tipAction} />
            </Region>
          ),
          mixer: <FaderBankRegion {...faders} tipAction={tipAction} />,
          knobs: <KnobBankRegion {...knobs} tipAction={tipAction} />,
          pads: <PadBankRegion {...shownPads} tipAction={tipAction} />,
          // The keys take the width the solver gave their region, less its plate.
          keys: (_form: string, placed: Placed) => (
            <Region name="Keyboard">
              <Keys {...keys} ruler={false} width={Math.max(0, placed.rect.w - inset.left - inset.right)} tipAction={tipAction} />
            </Region>
          ),
          status: <StatusLine {...status} />,
        }}
      />
    </div>
  );
}

export default Stage;

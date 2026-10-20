// Stage's model: its props and what it derives from them (the frame, the spec, the room, the
// Sections bank's pads, the tap, the keys' width). No framework: `Stage.tsx` (React) and
// `Stage.svelte` (Svelte) both render it; see Stage.tsx for the job.
import type { Placed, Placement, ScreenSpec } from '../../layout/assembly/types';
import type { StyleDecls } from '../../layout/style';
import type { AppBarModelProps } from '../AppBar/AppBar.model';
import type { DisplayModelProps } from '../Display/Display.model';
import type { FaderBankModelProps } from '../FaderBank/FaderBank.model';
import type { KeysModelProps } from '../../components/music/Keys/Keys.model';
import type { KnobBankProps } from '../KnobBank/KnobBank.model';
import type { PadBankProps } from '../PadBank/PadBank.model';
import type { SongFormProps } from '../SongForm/SongForm.model';
import type { StatusLineModelProps } from '../StatusLine/StatusLine.model';
import { pressSectionPad, sectionPads, SECTIONS_BANK } from './sectionPads';
import { STAGE_SCALED_SPEC, STAGE_SPEC, STAGE_SPLIT_SCALED_SPEC, STAGE_SPLIT_SPEC } from './Stage.spec';
import type { TapTempo } from './tapTempo';

/** The app's tooltip action, handed to every region. */
export type StageTipAction = (node: HTMLElement, key: string) => void | { update?: (key: string) => void; destroy?: () => void };

/** The slowest and fastest tempo a tap may set. */
export const TEMPO_MIN = 40;
export const TEMPO_MAX = 280;

/** The Stage's top arrangements: see `StageModelProps.layout`. */
export type StageLayout = 'split' | 'stacked';

/** How the Stage meets the window: see `StageModelProps.fit`. */
export type StageFit = 'contain' | 'scale';

/** The Stage's props in any framework; `L` is a label (a string, a React node, a Svelte snippet). See `Stage.tsx` for each. */
export interface StageModelProps<L = string> {
  /** The top bar: pages, the global switches (Metronome and its settings, Unison, Help, Panic), health. */
  appBar: Omit<AppBarModelProps<L>, 'width' | 'nowPlaying' | 'tipAction'>;
  /**
   * The hero: style, One Touch, section now and next, chord, tempo and the screen's one Tap, beat.
   * Its `parts` column is never shown here (the mixer names every part's sound). `onTap` is
   * called on each tap; once two or more taps are in time the Stage asks `onTempo` for their tempo.
   * Its form (`full`, `compact`, `minimal`) is the screen's choice.
   */
  display: Omit<DisplayModelProps, 'parts' | 'tipAction' | 'density' | 'form'>;
  /**
   * The song's state and the screen's one transport cluster. The Stage draws no song form strip:
   * the transport region reads it, and the Pads region's Sections bank draws the sections from it.
   */
  songForm: Omit<SongFormProps, 'tipAction'>;
  /** The mixer. */
  faders: Omit<FaderBankModelProps<L>, 'tipAction'>;
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
  keys: Omit<KeysModelProps, 'width' | 'tipAction'>;
  /** The status line: in the screen's fixed footer, under the keys, in every layout. */
  status: Omit<StatusLineModelProps, 'width'>;
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
  /**
   * How the 16:9 screen meets the window. `contain` (the default, the app): it is laid out in the
   * largest 16:9 room inside the window, stepping forms down as it shrinks. `scale` (previews and
   * stories): it is laid out once at the 1920 × 1080 board and drawn scaled to that room.
   */
  fit?: StageFit;
  /** Called with each new placement (the solver's forms, sizes and zoom), for tests and inspectors. */
  onPlacement?: (placement: Placement) => void;
}

/** The spec each layout and fit assembles (`Stage.spec.ts`). */
export const STAGE_SPECS: Record<StageLayout, Record<StageFit, ScreenSpec>> = {
  stacked: { contain: STAGE_SPEC, scale: STAGE_SCALED_SPEC },
  split: { contain: STAGE_SPLIT_SPEC, scale: STAGE_SPLIT_SCALED_SPEC },
};

/** The frame: its class and data attributes, its size, the spec it assembles and the room (both sizes set) it gives the screen. */
export function stageView({ width, height, layout = 'stacked', fit = 'contain' }: Pick<StageModelProps, 'width' | 'height' | 'layout' | 'fit'>): {
  className: string;
  attrs: Record<string, string>;
  style: StyleDecls;
  spec: ScreenSpec;
  room: { w: number; h: number } | undefined;
} {
  return {
    className: 'yh-stage',
    attrs: { 'data-part': 'root', 'data-layout': layout, 'data-fit': fit },
    style: { width: width !== undefined ? `${width}px` : undefined, height: height !== undefined ? `${height}px` : undefined },
    spec: STAGE_SPECS[layout][fit],
    room: width !== undefined && height !== undefined ? { w: width, h: height } : undefined,
  };
}

/** A tapped tempo held to `TEMPO_MIN`–`TEMPO_MAX`. */
export const clampTempo = (bpm: number) => Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, bpm));

/** The hero's Tap at `now` (ms): calls `onTap`, and `onTempo` once the taps in `tapper` give a tempo. */
export function stageTap(display: Pick<DisplayModelProps, 'onTap' | 'onTempo'>, tapper: TapTempo, now: number) {
  display.onTap?.();
  const bpm = tapper.tap(now);
  if (bpm !== undefined) display.onTempo?.(clampTempo(bpm));
}

/**
 * The pads the Pads region shows. The Sections bank mirrors the hardware: its pads are drawn from
 * the song form's props (never from `pads.pads`), and a press does what that step or key does in
 * the transport (Tap is `onTap`, the hero's). Any other bank: `pads` as given.
 */
export function stagePads(pads: StageModelProps['pads'], songForm: StageModelProps['songForm'], onTap: () => void): StageModelProps['pads'] {
  if (pads.banks?.[pads.bank ?? 0] !== SECTIONS_BANK) return pads;
  return { ...pads, pads: sectionPads(songForm), lit: songForm.lit ?? pads.lit, onPress: (i) => pressSectionPad(i, { ...songForm, onTap }) };
}

/** The keys take the width the solver gave their region, less its plate. */
export const stageKeysWidth = (placed: Placed, inset: { left: number; right: number }) => Math.max(0, placed.rect.w - inset.left - inset.right);

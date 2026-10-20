// Stage's model: its props and its view tree (the frame, the assembled screen, each region drawn by
// name), with the handlers the tree names (`stageHandlers`). No framework: `Stage.tsx` (React) and
// `Stage.svelte` (Svelte) both draw it; see Stage.tsx for the job.
import type { Placed, Placement, ScreenSpec } from '../../layout/assembly/types';
import { component, slot, styleText, type ComponentNode, type Handler, type Handlers, type Node } from '../../view/Tree.model';
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
import type { StageState, StageViewState } from './stageState';
import type { TapTempo } from './tapTempo';
import type { TipAction } from '../../view/tip';

/** The app's tooltip action, handed to every region. */
export type { TipAction as StageTipAction } from '../../view/tip';

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
  tipAction?: TipAction;
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

type Frame = Pick<StageModelProps<unknown>, 'width' | 'height' | 'layout' | 'fit'>;

/** The spec the screen assembles and the room it is given (both sizes set), else it measures its own. */
export function stageScreen({ width, height, layout = 'stacked', fit = 'contain' }: Frame): { spec: ScreenSpec; room: { w: number; h: number } | undefined } {
  return { spec: STAGE_SPECS[layout][fit], room: width !== undefined && height !== undefined ? { w: width, h: height } : undefined };
}

/** The root: its class and data attributes and its size, holding `screen`. */
function frame({ width, height, layout = 'stacked', fit = 'contain' }: Frame, screen: Node['children']): Node {
  const style = styleText({ width: width !== undefined ? `${width}px` : undefined, height: height !== undefined ? `${height}px` : undefined });
  return { tag: 'div', attrs: { class: 'yh-stage', 'data-part': 'root', 'data-layout': layout, 'data-fit': fit, style }, children: screen };
}

/**
 * The frame with a `screen` slot where the assembled screen goes: the bindings' seam until the
 * layout's `Screen` draws its regions as slots by id (then `stageView` draws it whole).
 */
export const stageFrame = (props: Frame): Node => frame(props, [slot('screen')]);

/** The regions in reading order, each with the Stage prop that holds its data. */
const REGIONS = [
  ['bar', 'appBar'],
  ['hero', 'display'],
  ['transport', 'songForm'],
  ['mixer', 'faders'],
  ['knobs', 'knobs'],
  ['pads', 'pads'],
  ['keys', 'keys'],
  ['status', 'status'],
] as const;

/** The Stage's region ids, in reading order. */
export type StageRegion = (typeof REGIONS)[number][0];

/**
 * A region's props split into data and callbacks: each callback that is set becomes a handler key
 * (`<region>.<prop>`, held by `stageHandlers`), so a child sees exactly the callbacks it was given;
 * and the tooltip action (`tip`), when the app gives one.
 */
function split(region: StageRegion, data: object, tip: boolean): { props: Record<string, unknown>; on: Record<string, string> } {
  const plain: Record<string, unknown> = {};
  const on: Record<string, string> = {};
  for (const [name, value] of Object.entries(data)) {
    if (typeof value === 'function') on[name] = `${region}.${name}`;
    else plain[name] = value;
  }
  if (tip) on.tipAction = 'tipAction';
  return { props: plain, on };
}

/** Whether the Pads region shows the Sections bank (drawn from the song form, `stagePads`). */
const showsSections = (pads: StageModelProps<unknown>['pads']) => pads.banks?.[pads.bank ?? 0] === SECTIONS_BANK;

/**
 * Each region's content, by region id: the AppBar; the Display in the Hero region (no parts
 * column, its Tap timed by the Stage); the transport in its region; the mixer, knobs and pads
 * regions (the pads on Sections drawn from the song form, a press doing what that step or key
 * does); the keys in the Keyboard region at the width the last placement gave them, less the
 * plate (`inset`; none before the first placement); the status line.
 */
export function stageRegions<L>(props: StageModelProps<L>, state: StageViewState, inset: { left: number; right: number }): Record<StageRegion, ComponentNode> {
  const region = (name: string, child: ComponentNode) => component('Region', { name }, { slots: { children: [child] } });
  const tip = props.tipAction !== undefined;
  const bar = split('bar', props.appBar, tip);
  const hero = split('hero', props.display, tip);
  const transport = split('transport', props.songForm, tip);
  const mixer = split('mixer', props.faders, tip);
  const knobs = split('knobs', props.knobs, tip);
  const sections = showsSections(props.pads);
  const pads = split('pads', stagePads(props.pads, props.songForm), tip);
  const keys = split('keys', props.keys, tip);
  // The status line takes no tooltip action.
  const status = split('status', props.status, false);
  const placed = state.placement?.regions.keys;
  return {
    bar: component('AppBar', bar.props, { on: bar.on }),
    hero: region('Hero', component('Display', { ...hero.props, parts: undefined }, { on: { ...hero.on, onTap: 'tap' } })),
    transport: region('Transport', component('SongForm', { ...transport.props, part: 'transport' }, { on: transport.on })),
    mixer: component('FaderBankRegion', mixer.props, { on: mixer.on }),
    knobs: component('KnobBankRegion', knobs.props, { on: knobs.on }),
    pads: component('PadBankRegion', pads.props, { on: sections ? { ...pads.on, onPress: 'sectionPad' } : pads.on }),
    keys: region('Keyboard', component('Keys', { ...keys.props, ruler: false, width: placed ? stageKeysWidth(placed, inset) : undefined }, { on: keys.on })),
    status: component('StatusLine', status.props, { on: status.on }),
  };
}

/**
 * The Stage: the frame holding the assembled screen (`STAGE_SPECS`, the layout's `Screen`), each
 * region a slot by its id. `state` is the Stage's own (`stageState.ts`: the last placement), and
 * `inset` the plate's, from the nearest ThemeScope's principles.
 */
export function stageView<L>(props: StageModelProps<L>, state: StageViewState, inset: { left: number; right: number }): Node {
  const { spec, room } = stageScreen(props);
  const screen = component(
    'Screen',
    { name: 'Stage', className: 'yh-stage__screen', class: 'yh-stage__screen', spec, room },
    { on: { onPlacement: 'placement' }, slots: Object.fromEntries(Object.entries(stageRegions(props, state, inset)).map(([id, node]) => [id, [node]])) },
  );
  return frame(props, [screen]);
}

/**
 * Every callback the Stage's tree names: the tooltip action, each region's own callbacks
 * (`<region>.<prop>`), the hero's Tap (`tap`, timed by the state's taps), a Sections pad's press
 * (`sectionPad`) and the screen's placement (`placement`: kept in the state when it changed, and
 * then passed to `onPlacement`).
 */
export function stageHandlers<L>(props: StageModelProps<L>, state: Pick<StageState, 'place' | 'tapper'>): Handlers {
  const handlers: Handlers = { tipAction: props.tipAction };
  for (const [id, prop] of REGIONS) {
    for (const [name, value] of Object.entries(props[prop])) if (typeof value === 'function') handlers[`${id}.${name}`] = value as Handler;
  }
  const tap = () => stageTap(props.display, state.tapper, performance.now());
  handlers.tap = tap;
  handlers.sectionPad = (index: number) => pressSectionPad(index, { ...props.songForm, onTap: tap });
  handlers.placement = (placement: Placement) => {
    if (state.place(placement)) props.onPlacement?.(placement);
  };
  return handlers;
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
 * the song form's props (never from `pads.pads`); a press there is the `sectionPad` handler
 * (`stageHandlers`), what that step or key does in the transport (Tap is the hero's). Any other
 * bank: `pads` as given.
 */
export function stagePads(pads: StageModelProps['pads'], songForm: StageModelProps['songForm']): StageModelProps['pads'] {
  if (!showsSections(pads)) return pads;
  return { ...pads, pads: sectionPads(songForm), lit: songForm.lit ?? pads.lit };
}

/** The keys take the width the solver gave their region, less its plate. */
export const stageKeysWidth = (placed: Placed, inset: { left: number; right: number }) => Math.max(0, placed.rect.w - inset.left - inset.right);

import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { useScopePrinciples } from '../../layout/assembly/AssembledScreen';
import { Screen } from '../../layout/Screen';
import { Tree } from '../../view/Tree';
import type { Node } from '../../view/Tree.model';
import type { AppBarProps } from '../AppBar/AppBar';
import { stageFrame, stageHandlers, stageRegions, stageScreen, type StageModelProps } from './Stage.model';
import { createStageState } from './stageState';
import './Stage.css';

export { TEMPO_MAX, TEMPO_MIN, type StageFit, type StageLayout, type StageModelProps, type StageTipAction } from './Stage.model';

/** The Stage's props (`StageModelProps`, labels as React nodes); the app bar may add its `end` controls. */
export interface StageProps extends Omit<StageModelProps<ReactNode>, 'appBar'> {
  /** The top bar: pages, the global switches (Metronome and its settings, Unison, Help, Panic), health. */
  appBar: Omit<AppBarProps, 'width' | 'nowPlaying' | 'tipAction'>;
}

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
 *
 * The tree and its handlers are `Stage.model.ts`'s (`Stage.svelte` draws the same); the Stage's
 * own state (the last placement, for the keys' width, and the taps) is `stageState.ts`.
 */
export function Stage(props: StageProps) {
  const [state] = useState(createStageState);
  const current = useSyncExternalStore(state.subscribe, state.get);
  const { inset } = useScopePrinciples().plate;
  const handlers = stageHandlers(props, state);
  const regions = Object.entries(stageRegions(props, current, inset)).map(([id, region]) => [id, <Tree tree={region as unknown as Node} handlers={handlers} />]);
  // The seam: the layout's `Screen` takes a `regions` record, so the screen is drawn here by hand;
  // once it draws its regions as slots by id, this is `<Tree tree={stageView(props, current, inset)} handlers={handlers} />`.
  return <Tree tree={stageFrame(props)} slots={{ screen: <Screen name="Stage" className="yh-stage__screen" {...stageScreen(props)} onPlacement={handlers.placement} regions={Object.fromEntries(regions)} /> }} />;
}

export default Stage;

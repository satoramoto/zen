import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { LOOP_GRID_FORMS } from './LoopGrid.forms';
import { loopGridHandlers, loopGridView, type LoopGridModelProps } from './LoopGrid.model';
// Cells and words are Surfaces and Texts, through their classes. Before LoopGrid.css.
import '../../../primitives/Text.css';
import '../../../primitives/Surface.css';
import './LoopGrid.css';

// The props and the tree are framework-free, in the model; `LoopGrid.svelte` draws the same tree.
export { LOOP_GRID_FORMS, type LoopGridForm } from './LoopGrid.forms';
export { cellName, type LoopGridModelProps } from './LoopGrid.model';

/** LoopGrid's props: all of them data or callbacks, so the same as the model's. */
export type LoopGridProps = LoopGridModelProps;

/**
 * **Job.** The set as a folded grid: one header row per song (folded to a summary, open to its
 * track columns), eight column-aligned track columns of loop cells, and a pinned stop row with
 * one loop-phase pie per track plus the set loop. Set's ClipGrid is the behaviour reference
 * (folded `SongHeaderRow`, `Row` cells, `TrackStatus` pies, `TrackMeter` columns kept aligned).
 *
 * **Changed.** *Hierarchy*: the song's name and its folded summary are the header's words; a
 * cell's state is its face (`data-state`) and, while live, its pie — empty cells are quiet wells.
 * *Column alignment*: every track column keeps the same width (the widest `cells.length`, never
 * fewer than eight), so the stop row's pies sit under their tracks.
 *
 * **Kept.** The grid holds no state: a cell asks for `onLaunch({ track, cell })`, a song header
 * for `onToggleSong(id)`, a track head for `onSelectTrack(id)`, the stop button for `onStop`.
 *
 * **Forms** (`LOOP_GRID_FORMS`; read with `useForm`): `full` (songs, tracks, stop) → `rows`
 * (no song headers; the open song's tracks plus the stop row).
 *
 * **Built from.** `key` Surface buttons for cells, plain buttons for headers, inline SVG wedges
 * (LoopPie's geometry, no registered component), Texts for every word.
 *
 * **Tuning knobs.**
 * - `--yh-loopgrid-gap`: between columns, cells and rows.
 * - `--yh-loopgrid-cell-h`: a cell's least height.
 * - `--yh-loopgrid-pie`: a cell pie's size.
 * - `--yh-loopgrid-ink`: a parked track's dimming.
 */
export function LoopGrid(props: LoopGridProps) {
  const form = useForm(LOOP_GRID_FORMS);
  return <Tree tree={loopGridView(props, form)} handlers={loopGridHandlers(props)} />;
}

/** The forms, for a region to add up (`docs/assembly.md`). */
LoopGrid.forms = LOOP_GRID_FORMS;

export default LoopGrid;

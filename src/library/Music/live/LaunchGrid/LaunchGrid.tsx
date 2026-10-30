import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { LAUNCH_GRID_FORMS } from './LaunchGrid.forms';
import { launchGridHandlers, launchGridView, type LaunchGridProps } from './LaunchGrid.model';
import '../../base.css';
import '../live.css';
import './LaunchGrid.css';

export {
  LAUNCH_CELL_STATES,
  LAUNCH_GRID_MIN_ROWS,
  launchRows,
  type LaunchCell,
  type LaunchCellRef,
  type LaunchCellState,
  type LaunchGridProps,
  type LaunchLoop,
  type LaunchSong,
  type LaunchTrack,
} from './LaunchGrid.model';
export { LAUNCH_GRID_FORMS, type LaunchGridForm } from './LaunchGrid.forms';

/**
 * The looper's session grid, in mix[flow]'s face (DeckStrip's launch grid): the set's songs fold
 * above it (index, name, a summary of its sections, tempo · key; a press folds or opens one), the
 * tracks are columns named in their stem label colour, each loop slot a 24px cell — a playing loop
 * filled with its track's ink and a phase bar along its foot, a queued one outlined and blinking,
 * a recording one red with its bar count, a stopped one faint ink, an empty one a well. Under it
 * the stop row (Stop, then ■ per track) and the set loop's phase. Holds no state: every press asks
 * a callback, and a part without one is drawn disabled. Forms (`LAUNCH_GRID_FORMS`): `full` songs
 * and grid, `rows` the grid alone.
 */
export function LaunchGrid(props: LaunchGridProps) {
  const form = useForm(LAUNCH_GRID_FORMS, props.form);
  return <Tree tree={launchGridView(props, form)} handlers={launchGridHandlers(props)} />;
}

LaunchGrid.forms = LAUNCH_GRID_FORMS;

export default LaunchGrid;

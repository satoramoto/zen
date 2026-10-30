import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { PUSH_TWIN_FORMS } from './PushTwin.forms';
import { pushTwinHandlers, pushTwinView, type PushTwinProps } from './PushTwin.model';
import '../../base.css';
import '../live.css';
import './PushTwin.css';

export {
  PUSH_CELL_STATES,
  PUSH_ROWS,
  levelDb,
  type PushCell,
  type PushCellState,
  type PushPadRef,
  type PushRow,
  type PushTrack,
  type PushTwinProps,
} from './PushTwin.model';
export { PUSH_TWIN_FORMS, type PushTwinForm } from './PushTwin.forms';

/**
 * The Ableton Push on screen, in mix[flow]'s face, so the screen and the hardware never disagree
 * (and the set can be played with a mouse when the Push isn't plugged in). The display is a dark
 * well of scribble strips: each column's name in its stem ink, its level as a small knob ring and
 * its dB in mono. Under it the 8×8 pads, banded down the left — five rows of clips from each
 * track's cells, a stop row, the song's sections, the transitions ("cuts") — and the scene buttons
 * down the right; bands, pads and scenes are one grid, so they share rows exactly. Pads are launch
 * cells: a playing clip solid in its column's ink, a queued one outlined and blinking, a stopped
 * one faintly inked, a recording one red, an empty slot a well; the section now solid in the
 * accent, a queued section outlined; transitions neutral, a held one amber. Controlled: a pad asks
 * `onPad({ row, column, slot })`, a scene `onScene(index)`; without them the twin is read-only.
 * Forms (`PUSH_TWIN_FORMS`): `full` display, bands, pads and scenes; `grid` the square pads alone.
 */
export function PushTwin(props: PushTwinProps) {
  const form = useForm(PUSH_TWIN_FORMS, props.form);
  return <Tree tree={pushTwinView(props, form)} handlers={pushTwinHandlers(props)} />;
}

PushTwin.forms = PUSH_TWIN_FORMS;

export default PushTwin;

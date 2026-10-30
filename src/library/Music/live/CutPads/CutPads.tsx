import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { CUT_PADS_FORMS } from './CutPads.forms';
import { cutPadsHandlers, cutPadsView, type CutPadsProps } from './CutPads.model';
import '../../base.css';
import '../live.css';
import './CutPads.css';

export { CUT_PAD_STATES, type CutPad, type CutPadState, type CutPadsProps } from './CutPads.model';
export { CUT_PADS_FORMS, type CutPadsForm } from './CutPads.forms';

/**
 * The transitions a player fires (RISER, DROP, CRASH, HOLD A, HOLD B, CUT…), in mix[flow]'s face:
 * the biggest cells on the page, each its word over a mono caption (`8 bars`). Idle is a plain
 * face; armed is outlined in the caution ink and breathes; fired is filled with the accent; held is filled
 * with caution (mix[flow]'s Hold) and ringed; the app's current pad stands on a 2px foot rule. It holds no state: a press
 * asks `onFire(id)`, and without `onFire` the pads are dashed and inert. Forms (`CUT_PADS_FORMS`):
 * `row` one line, `grid` two rows under a head.
 */
export function CutPads(props: CutPadsProps) {
  const form = useForm(CUT_PADS_FORMS, props.form);
  return <Tree tree={cutPadsView(props, form)} handlers={cutPadsHandlers(props)} />;
}

CutPads.forms = CUT_PADS_FORMS;

export default CutPads;

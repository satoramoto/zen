import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { THROW_PADS_FORMS } from './ThrowPads.forms';
import { throwPadsHandlers, throwPadsView, type ThrowPadsProps } from './ThrowPads.model';
import '../../base.css';
import '../live.css';
import './ThrowPads.css';

export { THROW_TRAIL_POINTS, throwReading, type ThrowMove, type ThrowPad, type ThrowPadsProps, type ThrowPoint } from './ThrowPads.model';
export { THROW_PADS_FORMS, type ThrowPadsForm } from './ThrowPads.forms';

/**
 * Named pairs of XY throws (a delay's time × feedback, a filter's cutoff × resonance), in mix[flow]'s
 * face: each pad its name in its stem ink over a mono reading of the point, and a field in a well
 * with the waveform lane's grid, the axes' captions on its edges, the finger's trail as fading dots
 * and a 1px crosshair at the point. A drag anywhere in the field, or the arrow keys (Shift for fine),
 * asks `onMove({ id, x, y })` (0–1, y up) through zen's `xyInput` store; it moves nothing itself.
 * Without `onMove` the pads are read-only. Forms (`THROW_PADS_FORMS`): `two-up` two pads side by
 * side, `one` the first pad alone.
 */
export function ThrowPads(props: ThrowPadsProps) {
  const form = useForm(THROW_PADS_FORMS, props.form);
  return <Tree tree={throwPadsView(props, form)} handlers={throwPadsHandlers(props)} />;
}

ThrowPads.forms = THROW_PADS_FORMS;

export default ThrowPads;

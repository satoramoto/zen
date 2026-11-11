import { Tree } from '../../../foundation/view/Tree';
import { traceView, type TraceModelProps } from './Trace.model';
import './Trace.css';

export type { TraceModelProps, TraceMarker } from './Trace.model';
export type TraceProps = TraceModelProps;

/**
 * A line through a list of points: an envelope, a filter's response, an oscillator's shape, a
 * spectrum.
 *
 * **Job.** Show the shape of something from numbers the app gives, in the room it is given. It is
 * read, not played: no state, no handlers.
 *
 * **Why it exists.** Nothing else in the library draws a small line from numbers within the
 * contract (the math plots are a plotting library). It is the one new component of the Push area.
 *
 * **Parts** (`data-part`): `root` (the SVG, stretched to its container), `region` (a lit stretch),
 * `fill` (the area under the line), `line`, `marker` (an upright mark, `data-strong` for the one
 * that matters). Colour is a slot: `hue` 1 to 5, else ink.
 */
export function Trace(props: TraceProps) {
  return <Tree tree={traceView(props)} />;
}

export default Trace;

import { Tree } from '../../../foundation/view/Tree';
import { surfaceHandlers, surfaceView, type SurfaceModelProps } from './Surface.model';
import './Surface.css';

// The props and the tree are framework-free, in the model; this file and `Surface.svelte` only
// hand its tree and handlers to their `Tree`.
export type { SurfaceModelProps } from './Surface.model';
export type SurfaceProps = SurfaceModelProps;

/**
 * The Push 3's face: every control of the unit where it sits on the unit, or one region of it.
 *
 * **Job.** Draw the device and report what a person does to it. It is given lamps, a screen and
 * the strip's lamps (what `project` returns) and reports `PushInput`s through `onInput`. It
 * changes nothing itself: a press lights nothing until the lamps it is given change.
 *
 * **Layout.** One table in millimetres (`model/layout.ts`) and one scale: the face is as wide as
 * its frame, every control and legend scaling with it, down to a smallest size under which the
 * frame scrolls. `region` draws the display block, the pad block, the left column or the right
 * column alone.
 *
 * **Parts.** Each control is a cell (`data-control`, `data-kind`, `data-cluster`, `data-lamp`)
 * holding an existing component: a `Pad` for a button or a pad, a `KnobReadout` for a rotary
 * control, a `Slider` for the touch strip, the display.
 *
 * **Input** (`surfaceInput.ts`). Pointers, Space and Enter press; a right-click or L latches a
 * control so several can be held with one mouse (Escape lets all go); arrow keys move between
 * pads and turn a rotary control; the keyboard's four rows of eight play the pads when the grid
 * has focus. Pads report velocity, pressure, slide and bend.
 *
 * **Tuning knobs.** `--push-mm-min`: one millimetre at the smallest size.
 */
export function Surface(props: SurfaceProps) {
  return <Tree tree={surfaceView(props)} handlers={surfaceHandlers(props)} />;
}

export default Surface;

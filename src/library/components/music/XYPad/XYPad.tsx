import { Tree } from '../../../view/Tree';
import { useForm } from '../../../layout/assembly/forms';
import { XY_PAD_FORMS } from './XYPad.forms';
import { xyPadHandlers, xyPadView, type XYPadModelProps } from './XYPad.model';
// The field is a Surface (material well) and the axis labels are Texts, drawn as their elements
// with the primitives' class and data (`xyPadView`); before XYPad.css, so its look wins.
import '../../../primitives/Text.css';
import '../../../primitives/Surface.css';
import './XYPad.css';

// The props and the tree they draw are framework-free, in the model; `XYPad.svelte` draws the same tree.
export type { XYPadForm } from './XYPad.forms';
export type { XYPadModelProps } from './XYPad.model';
export { XY_PAD_FORMS, XY_PAD_GAP } from './XYPad.forms';
export { XY_TRAIL_POINTS, clamp01, xyTrailPoints } from './XYPad.model';

/** XYPad's props: all of them data or callbacks, so the same as the model's. */
export type XYPadProps = XYPadModelProps;

/**
 * **Job.** One effect's two axes on a field, as a performer rides them: where the point is now
 * (x across, y up), where the finger has just been, and what each edge means. It takes a drag
 * anywhere in the field, and the arrow keys nudge the point (Shift for fine), asking through
 * `onMove`; it never moves itself.
 *
 * **Changed.** *Affordance*: the field is a real `well` Surface, not a drawing on the page, so it
 * reads as something to put a finger on; the crosshair is two hairlines and a lit dot at the
 * crossing, the thing a player aims. *Trail as state* (the original mockups' throw): the last 24
 * points are drawn behind the dot, oldest faintest, so a delay throw or a filter sweep shows its
 * path without a second widget; the trail is data (`trail`), never animation the component owns.
 * *Hierarchy*: the quarter grid is `--text-4` hairlines, quiet enough to guide the eye without
 * competing with the trail; the axis labels sit inside the field's edge at caption size, so a bank
 * of pads keeps one footprint with no caption row of its own. *Colour meaning*: the trail, the
 * crosshair and the dot share one ink, the hue slot when given (`--hue-n`; the app decides what it
 * means) and text ink otherwise; the field and the grid are neutral, so the pad never invents a
 * state colour. *States*: `disabled` dims the field and takes no asks, still readable.
 * *Shape*: `square` or `wide` from `XY_PAD_FORMS`, and its height follows its width, so a screen's
 * region changes its size without changing its shape. *Headless*: markup is named parts (`well`,
 * `field`, `dot`, `x-label`, `y-label`), the behaviour is the `xyInput.ts` store the tree binds, and
 * both renderers draw the same tree.
 *
 * **Kept.** The 0–1 fractions on both axes (y up), the 24-point trail, the crosshair, the two
 * labels, the pointer drag and the hue slot. Controlled throughout: a drag or key only calls
 * `onMove`.
 *
 * **Tuning knobs.**
 * - `--yh-xy-*`: the one ink (`-ink`), the grid, crosshair and trail stroke widths (`-grid-w`,
 *   `-cross-w`, `-trail-w`), the dot's size (`-dot`), and the 0–1 point the component sets inline
 *   (`-x`, `-y`).
 */
export function XYPad(props: XYPadProps) {
  // The form: the `form` prop wins, then the assembled screen's choice, then `square`.
  const form = useForm(XY_PAD_FORMS, props.form);
  return <Tree tree={xyPadView(props, form)} handlers={xyPadHandlers(props)} />;
}

/** The forms, for a region to add up (`XYPad.forms`). */
XYPad.forms = XY_PAD_FORMS;

export default XYPad;

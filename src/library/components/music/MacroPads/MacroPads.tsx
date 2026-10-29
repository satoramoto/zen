import { Tree } from '../../../view/Tree';
import { useForm } from '../../../layout/assembly/forms';
import { MACRO_PADS_FORMS } from './MacroPads.forms';
import { macroPadsHandlers, macroPadsView, type MacroPadsModelProps } from './MacroPads.model';
// The captions are Texts, the empty bank and each field are Surface wells, and each pad is XYPad's
// own tree, drawn inline (its model, not a component registration); before MacroPads.css.
import '../../../primitives/Text.css';
import '../../../primitives/Surface.css';
import '../XYPad/XYPad.css';
import './MacroPads.css';

// The props and the tree they draw are framework-free, in the model; `MacroPads.svelte` draws the same tree.
export type { MacroPad, MacroPadsModelProps } from './MacroPads.model';
export type { MacroPadsForm } from './MacroPads.forms';
export { MACRO_PADS_MAX } from './MacroPads.model';
export { MACRO_PADS_FORMS, MACRO_PAD_GAP, MACRO_LABEL_GAP } from './MacroPads.forms';

/** MacroPads' props: all of them data or callbacks, so the same as the model's. */
export type MacroPadsProps = MacroPadsModelProps;

/**
 * **Job.** A short bank of the two effect axes a performer rides most: two (or one) XY fields in a
 * row, each captioned above it, so a delay throw and a filter sweep sit beside each other and the
 * hand can find either without reading. A drag in a field asks for that pad's new point through
 * `onMove(id, x, y)`; the bank never moves itself.
 *
 * **Changed.** *One place per job*: the bank is the XY pads the mockups show as a pair (`FX A DELAY
 * THROW`, `FILTER / RESONANCE`), not a second kind of pad; each one is `XYPad`'s whole tree (well,
 * quarter grid, trail, crosshair, axis labels), drawn inline so the bank needs no component
 * registration and no second copy of the look. *Hierarchy*: the caption is the loudest thing in
 * the cell and sits above the field, so the labels line up across the row and the fields read as
 * peers; the fields are separate wells, not one plate with a divider, so each can carry its own
 * hue and trail. *Alignment*: the caption row is one caption line and the gap under it one step,
 * so two pads of the same form line up exactly whatever their labels say (a long caption cuts with
 * an ellipsis rather than wrapping and pushing its field down). *Rhythm*: `--space-2` between
 * pads, `--space-1` between a caption and its field.
 *
 * **Forms.** `MACRO_PADS_FORMS`: `two-up` (the pair, each pad `square`) and `one-up` (one pad,
 * `wide`). Which form: the `form` prop wins, then the assembled screen's choice, then `two-up`.
 * `one-up` gives the first pad the whole strip; pads past four are ignored.
 *
 * **Kept.** The pad's id in the callback (`onMove(id, x, y)`), one to four pads, the caption text,
 * the axis labels, the hue slot and the trail, all as plain data.
 *
 * **Tuning knobs.**
 * - `--yh-mp-*`: the bank's columns (`-cols`: two in `two-up`, one in `one-up`).
 */
export function MacroPads(props: MacroPadsProps) {
  // The form: the `form` prop wins, then the assembled screen's choice, then `two-up`.
  const form = useForm(MACRO_PADS_FORMS, props.form);
  return <Tree tree={macroPadsView(props, form)} handlers={macroPadsHandlers(props)} />;
}

/** The forms, for a region to add up (`MacroPads.forms`). */
MacroPads.forms = MACRO_PADS_FORMS;

export default MacroPads;

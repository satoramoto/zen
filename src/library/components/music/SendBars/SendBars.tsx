import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { SEND_BARS_FORMS } from './SendBars.forms';
import { sendBarsHandlers, sendBarsView, type SendBarsModelProps } from './SendBars.model';
// The labels are Text, through their class. Before SendBars.css.
import '../../../primitives/Text.css';
import './SendBars.css';

// The props and the tree are framework-free, in the model; `SendBars.svelte` draws the same tree.
export { SEND_BARS_FORMS, SEND_UNITY, type SendBarsForm } from './SendBars.forms';
export { clampSend, type SendBarsModelProps } from './SendBars.model';

/** SendBars' props: all of them data or callbacks, so the same as the model's. */
export type SendBarsProps = SendBarsModelProps;

/**
 * **Job.** Two thin horizontal send bars — A over B — each 0–1 with a unity hinge marked at
 * 0.75: at a glance how hard this track feeds each effect, set with one press. Set's mixer band
 * is the behaviour reference (horizontal sends under each track); the hinge detent is this
 * widget's own.
 *
 * **Changed.** *Hierarchy*: the fill and thumb are the reading; the hinge is a hairline, never a
 * second thumb. A press anywhere on the bar sets it, a drag carries it, the arrows nudge it —
 * the bar is set, never typed. *State changes structure, not circus*: reaching unity reads as
 * `unity` in the value text.
 *
 * **Kept.** Values are 0–1, clamped; colour arrives only as hue slots; the bars hold no state.
 *
 * **Forms** (`SEND_BARS_FORMS`; read with `useForm`): `bars`, growing across whatever width the
 * strip gives it.
 *
 * **Built from.** Two `slider` divs with Texts for labels; the track, fill, hinge and thumb are
 * the bar's own marks.
 *
 * **Tuning knobs.**
 * - `--yh-sendbars-gap`: between the two rows.
 * - `--yh-sendbars-bar-h`: a bar's thickness.
 * - `--yh-sendbars-at`: where this bar's value sits (set inline, read by the fill and thumb).
 * - `--yh-sendbars-ink`: the fill's ink (a hue slot's `--hue-N`, else `--text-2`).
 */
export function SendBars(props: SendBarsProps) {
  const form = useForm(SEND_BARS_FORMS);
  return <Tree tree={sendBarsView(props, form)} handlers={sendBarsHandlers(props)} />;
}

/** The forms, for a region to add up (`docs/assembly.md`). */
SendBars.forms = SEND_BARS_FORMS;

export default SendBars;

import { Tree } from '../../../view/Tree';
import { readoutHandlers, readoutView, type ReadoutModelProps } from './Readout.model';
import '../../../primitives/Text.css';
import './Readout.css';

// The props, the tree and the behaviour are framework-free, in the model and its `adjust.ts` store;
// this file and `Readout.svelte` only hand the model's tree to their `Tree`.
export type ReadoutProps = ReadoutModelProps;

/**
 * Readout: the Effects page's parameter control, a labelled value with a bar.
 *
 * **Job.** Show one effect parameter so a player reads its value at a glance, and let them set it
 * without a slider on screen: press anywhere and drag sideways (the bar's width stands for the whole
 * range), a wheel notch or an arrow key steps it, Page Up / Down by ten steps, Home and End to the
 * ends, a double-click back to its default. Controlled: it asks for a new value through `onChange`.
 *
 * **Changed.** *Hierarchy:* the value is now the loudest thing in the row, drawn in primary text at
 * body size in the readout face and numeral weight, the label the Stage's one caption (caption
 * size, body weight, `--text-3`, label case) beside it: the same type recipe as BarReadout, so the
 * two label-bar-value rows read as one family; the original drew the value in the accent at the
 * same size as the label. *Colour meaning:* the accent is kept for the one thing that shows amount,
 * the bar's fill, so a page of readouts reads as a column of levels rather than a column of
 * coloured numbers; the number no longer turns accent while dragged, since numbers never wear it
 * elsewhere (color.md, 60/30/10 and "Component Color Limit"). *Numerals:* tabular figures in a
 * fixed `ch` width, right-aligned, and the unit in a fixed column drawn even when empty, so "9%"
 * → "10%" never shifts the row and "38%", "1/8" and "5.0 kHz" align on their last digit, even
 * under packs whose readout face is proportional (typography.md, "Tabular Numbers"); the knob code
 * is in the readout face too, never mono. *Affordance:* the bar runs the full width under label
 * and value, so the drag span is as wide as the row, grows a little on hover and while dragging,
 * and the knob code is a small framed key cap rather than loose text. *State clarity:* disabled
 * draws the bar and key cap dashed and its text in `--text-3`, never the faint `--text-4`.
 * *Contrast:* the track is a tint of the text colour, so it shows on light and dark palettes alike;
 * focus is a `:focus-visible` ring in the accent (craft-details.md, "Focus States"). *Headless*
 * (the view tree): the drag, wheel and keys are the `readoutAdjust` store (`adjust.ts`).
 *
 * **Kept.** One compact hairline row per parameter with an empty code column when no knob moves it,
 * so rows line up; the unit split off the number and drawn smaller; every input and the slider's
 * role, name, `aria-valuetext` ("Feedback 38%") and disabled-but-focusable behaviour.
 */
export function Readout(props: ReadoutProps) {
  return <Tree tree={readoutView(props)} handlers={readoutHandlers(props)} />;
}

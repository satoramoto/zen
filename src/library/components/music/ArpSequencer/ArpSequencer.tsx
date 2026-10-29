import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { ARP_SEQUENCER_FORMS } from './ArpSequencer.forms';
import { arpSequencerHandlers, arpSequencerView, type ArpSequencerModelProps } from './ArpSequencer.model';
// The cells, the labels and the words are Surface wells and Texts; the mode and the four knobs are
// drawn by name through the view registry.
import '../../../primitives/Text.css';
import '../../../primitives/Surface.css';
import './ArpSequencer.css';

export { ARP_SEQUENCER_FORMS, type ArpSequencerForm } from './ArpSequencer.forms';
// The props and the tree they draw are framework-free, in the model; `ArpSequencer.svelte` draws the same tree.
export type { ArpSequencerModelProps } from './ArpSequencer.model';

export type ArpSequencerProps = ArpSequencerModelProps;

/**
 * **Job.** The chord-degree arpeggiator as one screen: the chord it follows and what every degree
 * sounds as, a sixteen-column × eight-degree step grid (the highest degree at the top, the root at
 * the bottom), each step's velocity read as a stalk and its tie drawn into the next column, and
 * underneath the mode and the four knobs every hardware arp has (Rate, Oct, Gate, Swing). A cell
 * press asks for that step's next value; a degree label swaps its degree with the row next to it;
 * the mode and the knobs ask with the whole next state.
 *
 * **Changed.** *Colour meaning*: the grid is playback, not identity — the wells are neutral and only
 * an on step's stalk and tie take the contract's accent, so a column with a step reads from across
 * the room (`color.md`, 60/30/10). *Hierarchy*: the degree rows are the grid's own headers, a
 * caption each; the chord it follows is the one heading in the head, with the degree readout as a
 * quiet caption legend that wraps rather than cuts. *Affordance*: every cell is a well Surface
 * button with a focus and press Ring; the cell at a step's own degree keeps a strong edge, so where
 * each of the sixteen steps sits is legible even when it is off. *Numerals*: the knobs' values are
 * the Knob's own numerals; the legend is a caption, not a second grid. *Forms*: `full → compact`
 * (`ARP_SEQUENCER_FORMS`), read with `useForm`, carried as `data-form`; compact drops the degree
 * labels and the degree readout and keeps the same 16 × 8 grid, the mode and all four knobs.
 *
 * **Kept.** Pure: it draws `state`/`chords` and asks through `onStep(index, step)` and
 * `onState(state)`; nothing is held here, so a host (or a story) owns the arp. Sixteen columns
 * whatever the state's array length; degrees are `ARP_DEGREES` and the mode is `ARP_MODES`, never a
 * local list. A disabled arp draws every concept and calls nothing.
 *
 * **Built from.** `Surface` wells for the cells, `Text` for every word and degree, `Segmented` for
 * the mode, `Knob` for the four controls, `focusRing` and `pressRing` for the rings.
 *
 * **Tuning knobs.**
 * - `--yh-arp-cell`: a grid cell's least height (three quarters of a control height, a little
 *   less in compact).
 * - `--yh-arp-gap`: the gap between cells, which a tie bar crosses.
 * - `--yh-arp-velocity`: the 0–1 stalk height, set per on cell.
 */
export function ArpSequencer(props: ArpSequencerProps) {
  const form = useForm(ARP_SEQUENCER_FORMS);
  return <Tree tree={arpSequencerView(props, form)} handlers={arpSequencerHandlers(props)} />;
}

/** The forms, for a region to add up (`docs/assembly.md`). */
ArpSequencer.forms = ARP_SEQUENCER_FORMS;

export default ArpSequencer;

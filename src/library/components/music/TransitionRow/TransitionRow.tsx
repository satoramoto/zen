import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { TRANSITION_ROW_FORMS } from './TransitionRow.forms';
import { transitionRowHandlers, transitionRowView, type TransitionRowModelProps } from './TransitionRow.model';
// The pads' words are Text and their faces Surfaces, through their class and data (one element
// can't be both). Before TransitionRow.css, so the states win over the rest faces.
import '../../../primitives/Text.css';
import '../../../primitives/Surface.css';
import './TransitionRow.css';

// The props, the states and the tree are framework-free, in the model; `TransitionRow.svelte`
// draws the same tree with the form its lean `getForm` reads.
export { TRANSITION_STATES, rowFires, type TransitionPad, type TransitionRowModelProps, type TransitionState } from './TransitionRow.model';
export { TRANSITION_LABELS, type TransitionRowForm } from './TransitionRow.forms';

/** TransitionRow's props: all of them data or callbacks, so the same as the model's. */
export type TransitionRowProps = TransitionRowModelProps;

/**
 * **Job.** Six oversized transition pads — `RISER / DROP / CRASH / HOLD A / HOLD B / CUT` — for a
 * live set: the biggest targets on the surface, each one a thing a player hits without looking,
 * saying at a glance which are waiting to fire, which have just fired, and which one the set holds
 * as current.
 *
 * **Changed.** *Hierarchy*: one word and one caption per pad at the biggest type the surface gives
 * a control, so a thumb finds `DROP` mid-bar; the pad is at least two control heights tall and a
 * target wide, far past the key height of the bank controls, because these are the moves a
 * performance is made of, not settings. *State changes structure, not circus*: `idle` is the quiet
 * key face; `armed` keeps the face and adds an inset ring in the pad's hue slot, a faint wash of it
 * and one lit lamp, so "ready" reads as an outline; `fired` fills the whole face with the hue slot
 * and inks the words `on-solid`, so a fired pad is the one solid block in the row. A pad with no
 * hue slot fills with `--role-2` when fired rather than inventing a colour. *Colour meaning*: the
 * hue is a slot (`HueSlot`), never a meaning; the app maps what RISER or CUT stand for. *Current*:
 * `selected` draws one 2 px rule across the pad's foot in its own ink and sets `aria-current`,
 * never a second colour. *Affordance*: a key face that gives on press, a dashed, muted face when
 * the row has no `onFire` (a surface that can't fire yet), so unavailable never looks pressable.
 * Focus and press are the primitives' Rings.
 *
 * **Kept.** Six pads in the mockups' order, the label as the accessible name plus its caption; the
 * row holds no state: a click, Space or Enter asks for `onFire(id)` and changes nothing itself, so
 * a player's state stays the app's.
 *
 * **Forms** (`TRANSITION_ROW_FORMS`, `TransitionRow.forms`; read with `useForm`, so an assembled
 * screen's choice wins): `row` all six pads in one line, `grid` two rows of three. Every length in
 * the forms is a step in TransitionRow.css, so the least the row says it needs is what it draws.
 *
 * **Built from.** Each pad is a `key` Surface drawn as a `<button>` (`lib-surface`, `data-material`,
 * `data-radius`), its words Texts (label, and caption for the hint), its state as `data-state`, its
 * hue slot as `data-hue`. Focus is `focusRing`, the press `pressRing`.
 *
 * **Tuning knobs.**
 * - `--yh-transition-*`: the gap between pads (`-gap`), a pad's least height and width (`-pad-h`,
 *   `-pad-min-w`), the armed ring's weight (`-ring`), the idle edge (`-edge`) and the ink a state
 *   fills with (`-ink`).
 */
export function TransitionRow(props: TransitionRowProps) {
  const form = useForm(TRANSITION_ROW_FORMS);
  return <Tree tree={transitionRowView(props, form)} handlers={transitionRowHandlers(props)} />;
}

/** The forms, for a region to add up (`docs/assembly.md`). */
TransitionRow.forms = TRANSITION_ROW_FORMS;

export default TransitionRow;

import { Tree } from '../../view/Tree';
import { oneTouchPickerHandlers, oneTouchPickerView, type OneTouchPickerProps } from './OneTouchPicker.model';
import '../../primitives/Text.css';
import './OneTouchPicker.css';

// The props, faces, names and tooltip are framework-free, in the model; this file and
// `OneTouchPicker.svelte` only draw the model's roots (one, or several in `cells`) with their `Tree`.
export {
  oneTouchPickerView,
  oneTouchPickerHandlers,
  oneTouchGroupName,
  oneTouchNumberName,
  oneTouchFace,
  type OneTouchFace,
  type OneTouchPickerProps,
  type TipAction,
} from './OneTouchPicker.model';

/**
 * **Job.** Shows which of the style's One Touch Settings is applied and applies another with one
 * press. At a glance a player needs: is one applied, which, and which numbers this style has at all.
 *
 * **Changed.** The original drew bare digits with an underline for the applied one, so the numbers
 * barely read as buttons and "applied" was a thin line (affordance, contrast). Here the numbers sit
 * in one segmented strip of equal square cells, so the set reads as one choice. *Colour meaning:*
 * a solid fill on the Stage means "sounding or running" (the playing section's block), so the
 * applied number is chosen, not filled: primary ink with a 2px rule in the style's role hue
 * (`--style`) along the cell's foot, the same ink-plus-underline mark an underlined tab uses, and the
 * hero no longer shows two solid blocks side by side (`../hues`, `color.md`: colour has one
 * meaning). The others are quiet outlined cells that lift on hover. *State clarity:* numbers past
 * the style's count keep their cell with a dashed edge and the muted ink (`--text-3`), the Stage's
 * one disabled face: absent, not "wrong" as the struck-through face read. Digits use the readout
 * face with tabular numerals so 1-4 sit on one rhythm (`typography.md`), and the label is the
 * Stage's one caption (caption size, body weight, `--text-3`, label case) above or beside the
 * strip (hierarchy: the label names, the numbers act). In cells, the `a` hue draws the outlines
 * and the mark in `--style`, so the style's One Touch numbers wear the style's colour and never
 * the `--accent` focus/highlight role. `tipAction` runs the app's tooltip
 * action, in Pad's handle shape, on each number with that number's own key, since each number is
 * its own control with its own tooltip; the label and group have none. *Materials:* named parts
 * (`data-part`: root, label, strip, number); each number is a `key` of the theme's key material,
 * the applied one pressed (`--mat-key-pressed`) under its mark, the missing ones bare slots.
 *
 * **Kept.** A press asks for that One Touch through `onApply` and changes nothing itself; each number
 * is its own button with `aria-pressed` and a spoken name naming its Launchkey pad (Shift + pad 9-12);
 * the group's default name says which is applied; `cells` still renders without a wrapper for a
 * parent grid; `data-face` and `data-tip` (`ots.<n>`) are unchanged.
 */
export function OneTouchPicker(props: OneTouchPickerProps) {
  const handlers = oneTouchPickerHandlers(props);
  return oneTouchPickerView(props).map((tree) => <Tree key={tree.key} tree={tree} handlers={handlers} />);
}

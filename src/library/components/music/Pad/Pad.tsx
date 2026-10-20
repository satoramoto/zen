import { Text } from '../../../primitives/Text';
import { padView, type PadModelProps } from './Pad.model';
import { usePad } from './usePad';
// The face is a Text (the label type) and a Surface (material key) through its class and data
// attributes, since one element can't render both. Before Pad.css, so the states win.
import '../../../primitives/Surface.css';
import './Pad.css';

// The props, tones and face are framework-free, in the model; `Pad.svelte` renders the same view.
export type { TipAction, PadFamily, PadState, PadTone, PadOnFace, PadModelProps } from './Pad.model';
export { tieLastWord, padTone } from './Pad.model';

/** Pad's props: all of them data or callbacks, so the same as the model's. */
export type PadProps = PadModelProps;

/**
 * One pad of a pad bank (the original: a Launchkey band), drawn as the key a player presses.
 *
 * **Job.** Say, at a glance across a 4 × 4 bank, which pad is sounding, which is queued or armed
 * for the next bar, which is not in this style, and what each one is called, and take a press by
 * pointer, Space or Enter.
 *
 * **Changed.** *Affordance*: an idle pad is a raised face on `--surface-2` with an edge, so it
 * reads as a key to press, not an outline drawing; it gives a little on press. *Colour meaning*
 * (color.md 3, "state changes: structure, not circus"; anti-ai-slop.md 8, token role drift): the
 * original gave each of five section families its own hue, which the contract does not have and
 * which competed with state. Sections and utilities are now neutral: identity is the label, and the
 * only fill is "sounding" in `--selected` / `--selected-text`. A categorical hue slot (`hue`, 1–5 →
 * `--hue-1` … `--hue-5`; an app maps its meaning, e.g. Yahaha's parts) stays, because there the
 * colour is the thing the pad stands for. Start / Stop running is `--success` with
 * `--success-text` ink, role or not: running is a state, not the role's identity. A `util` or
 * `start` pad with a `role` slot (e.g. Yahaha's transport keys, the original's "hue of time",
 * take role 2) wears the contract's role hue, `--role-n` / `--role-n-text`, so it no longer
 * borrows `--action`, the screen's call to action, and stays clear of the hue slots and the
 * states; and it wears it only while active: at rest its edge is the neutral `--border-strong`,
 * so Start / Stop is the one saturated key a player finds without looking. ARMED is a state that needs attention, so its
 * ring and chip are `--warning` with `--warning-text` ink whatever the pad; NEXT rings in
 * `--accent` by default, the contract's "next" role, so queued reads the same on every pad
 * (`accentNext`, now on unless set false; before, a neutral pad's NEXT rang in `--text-1`, the same
 * white as the playing fill beside it). *A solid fill means sounding or running* (the Stage rule):
 * `onFace="ring"` draws an on pad that isn't sounding (a bank's pads, Auto Fill on) as the raised
 * face with a ring in its colour and a lit dot top-left, so only the playing section and Start /
 * Stop fill. One ring weight, `--yh-wait-ring` (twice `--border-width`, border included), and one
 * 14% wash serve the waiting faces here, on Button and on LampButton. Ink on a state fill is the
 * state's own text token, not `--surface-0`, so it holds contrast on light palettes too.
 * *Hierarchy*: an absent pad is a dashed edge on no face with a muted label, so absence reads as
 * structure, not as a fainter colour. *Typography* (typography.md 8): labels use `--label-case`
 * and `--tracking` at `--size-label`, the NEXT / ARMED tag at caption size with tracking; a short
 * last word (a numeral, a letter) is tied to the word before it, so "Main B" never breaks into
 * "MAIN / B". Glow uses `--bloom`, so flat palettes stay flat. Focus is a 2px `--accent` ring
 * (craft-details.md 1). Options: `disabled` keeps the pad in the tab order but marks it
 * `aria-disabled` and ignores presses, drawn as every unavailable key is, a dashed edge and a
 * `--text-3` label with no press give (*affordance*: unavailable must not look pressable);
 * `fillCell` makes the pad fill its grid cell, so banks lay out pads without overriding the pad's
 * size variables (*alignment*). The NEXT / ARMED
 * chip never covers the label (*hierarchy*: the name outranks the state, which the ring already
 * says): at the top, the pad keeps the chip's row clear and centres the label below it; with
 * `tagCorner` the chip hangs on the top edge, mostly outside the pad, so a one-letter song-form
 * step keeps its letter centred and in line with its neighbours. *Headless*: the press and the
 * tooltip live in the `padPress.ts` store (`usePad` in React, the `padPress` action in Svelte); the markup
 * is named parts (`face`, `chip`, `label`), and the face is
 * made of the theme's `key` material at rest and `--mat-key-pressed` while sounding, on or held,
 * its lit dot `--mat-lit-glow`, so a material set restyles the pad without touching it. State
 * still wins over material: sounding keeps its solid fill, waiting its ring and wash.
 *
 * **Kept.** The label centred and wrapping only at word boundaries; no pad number on the face (it
 * goes into the accessible name); NEXT / ARMED out of the label's flow;
 * the flash driven by the parent through `lit`; rings drawn without changing the pad's size; the
 * `tagCorner` option of the golden Stage and its transport option (now `role`); the classes and
 * `data-*` hooks.
 *
 * **Built from.** The face is a `Text` in the label role with snug leading, so the label span
 * inherits its type, which banks (PadBank, SongForm) restyle on `.yh-pad`; and it is a `Surface`
 * at rest (`lib-surface`, `data-material="key"`) through its class. The NEXT / ARMED chip is its
 * own caption-size `Text` in the face's family. Focus is `focusRing`.
 *
 * **Tuning knobs.**
 * - `--yh-pad-size`: the square's side (default 2.5 control heights); `fillCell` takes the cell instead.
 * - `--yh-pad-*` tone slots (`fill`, `ink`, `ring`, `ring-ink`, `edge`): the solid fill, its ink,
 *   the wait ring and its chip ink, the idle edge; set per tone and state.
 * - `--yh-pad-tag-h`: the NEXT / ARMED chip's height, the row a top chip keeps clear.
 * - `--yh-wait-ring`: the waiting and on ring's weight, border included (shared with Button and LampButton).
 */
export function Pad(props: PadProps) {
  const { onPress, disabled = false, tip, tipAction } = props;
  const { ref } = usePad({ onPress, disabled, tip, tipAction });
  const view = padView(props);

  return (
    <Text as="button" {...view.text} ref={ref} className={view.face.className} {...view.face.attrs}>
      {view.chip && (
        <Text {...view.chip.text} className={view.chip.className} {...view.chip.attrs}>
          {view.chip.word}
        </Text>
      )}
      <span className="yh-pad__label" data-part="label">
        {view.label}
      </span>
    </Text>
  );
}

export default Pad;

import { useEffect, useRef } from 'react';
import { useLongPress } from '../Button/useLongPress';
import { lampButtonView, lampToggle, type LampButtonModelProps } from './LampButton.model';
import { Text } from '../../../primitives/Text';
import './LampButton.css';

// The props, faces and accessible name are framework-free, in the model; `LampButton.svelte` renders the same view.
export type { LampHue, LampFace, TipAction } from './LampButton.model';

export type LampButtonProps = LampButtonModelProps;

/**
 * **Job.** The on/off key the whole canvas uses (in Yahaha: Accomp, Metronome, a part's On, Sound,
 * Looper, Start / Stop). At a glance a player must see which hue or function it belongs to, whether it is
 * lit, armed or off, and that it is a key they can press (hold or right-click for its second function).
 *
 * **Changed.** *Hierarchy and affordance:* the original drew off as a full-strength coloured
 * outline and label, so every lamp in a row shouted equally and off differed from on only by fill.
 * Now off is a quiet raised key (surface fill, hairline border, secondary label) carrying a small
 * unlit LED in its hue, and on is the same key with a double-weight outline in the lamp's hue, a
 * lit LED (with `--bloom` where the palette glows) and its label in ink. *A solid fill means
 * sounding or running* (the Stage rule; color.md: restraint, colour by purpose): only Start / Stop
 * running (`ok`), playback (`lamp`) and record fill solid, so a row of lit hued and function
 * lamps no longer outshouts the one key that says the band is playing. The unlit LED
 * mixes 45% of its hue into the key on dark palettes and 65% on light ones (`--scheme-light`),
 * where a pale dot vanished. The key sinks 1px on press. *Colour meaning:* the hue slots
 * (`--hue-1..4`) only name identity; running and playback use `--success`, record uses
 * `--danger`, neutral lamps light in `--text-1`, and focus is an `--accent` ring
 * (craft-details.md: `:focus-visible`). A `role-2` lamp (in Yahaha, the metronome and Auto Fill)
 * wears the contract's second role hue, never a slot's, and only while active: off, its LED is
 * neutral like any other lamp's; on, waiting or armed, the ring and LED take `--role-2`. The
 * running and record fills take their own ink, `--success-text` and `--danger-text` (the
 * original drew every fill in `--on-hue`, which the contract only promises against the
 * categorical hues). *Waiting* (queued) is the ring over a faint 14% wash with a blinking LED,
 * the hardware convention for "at the cue", still on reduced motion as a steady LED; the ring is
 * `--yh-wait-ring`, the same weight and tint as Button's and Pad's. *Armed* (`armed` with `on`:
 * engaged, waiting for its cue) is the on face with the LED blinking: it reads as on, unlike merely
 * queued, and as pending, unlike plain on (the old version told armed from waiting only by a
 * stronger wash and a 1px sink nobody could see from a metre). *Disabled* is a dashed, unfilled
 * key with a hollow LED, a `--text-3` label and code, and a `not-allowed` cursor, so it can't be
 * mistaken for off. *Rhythm:* `width` is a minimum, not a fixed width, and `cell` grows past its
 * container rather than clip, so a key never truncates its own name (craft-details.md). *Type:*
 * labels follow `--label-case` and `--tracking` at one weight in every face, so a lit key is as
 * wide as an off one; the code is set in the readout face with tabular figures, smaller and quieter
 * (typography.md: hierarchy by size and colour; no mono on the Stage). The face is a label `Text`
 * (tight, tabular); the code a caption-sized `numeral` `Text` at the body weight, untracked. Corners follow
 * `--radius-control`, heights `--control-h`. *Headless:* named parts (`face`, `lamp`, `label`,
 * `code`); the face is made of the theme's `key` material, `--mat-key-pressed` while on, armed or
 * held, and a lit LED sets `--lit` and wears `--mat-lit-glow`, so a material set restyles the lamp
 * without touching it. Meaning still wins: the running and record fills, the rings and the wash stay.
 *
 * **Kept.** Fully controlled (the face and `aria-pressed` follow `on` alone; a press only asks for
 * `!on`), long press and right-click that never toggle, disabled that stays focusable with
 * `aria-disabled`, the accessible name override, the joined edges, the width prop, the three sizes,
 * and the `data-face` / `data-hue` / `data-contrast` hooks.
 *
 * **Tuning knobs**
 * - `--yh-wait-ring`: the on, armed and waiting ring's weight, one weight across Button, LampButton and Pad.
 */
export function LampButton(props: LampButtonProps) {
  const { tip, tipAction, onToggle, onLongPress, onLongRelease } = props;
  const view = lampButtonView(props);
  const ref = useRef<HTMLButtonElement>(null);

  useLongPress(ref, { onLongPress, onLongRelease, disabled: !view.longPress });

  useEffect(() => {
    const node = ref.current;
    if (!node || !tipAction || tip === undefined) return;
    const handle = tipAction(node, tip);
    return () => handle?.destroy?.();
  }, [tipAction, tip]);

  return (
    <Text
      as="button"
      {...view.text}
      ref={ref}
      className={view.face.className}
      style={view.minWidth === undefined ? undefined : { minWidth: view.minWidth }}
      {...view.face.attrs}
      onClick={() => {
        const next = lampToggle(props);
        if (next !== undefined) onToggle?.(next);
      }}
    >
      <span className="yh-lampbutton__led" data-part="lamp" aria-hidden="true" />
      <span className="yh-lampbutton__label" data-part="label">
        {view.label}
      </span>
      {view.code && (
        <Text {...view.code.text} className={view.code.className} {...view.code.attrs}>
          {view.code.value}
        </Text>
      )}
    </Text>
  );
}

export default LampButton;

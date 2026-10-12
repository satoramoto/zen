import { useEffect, useRef, type CSSProperties } from 'react';
import { useLongPress } from './useLongPress';
import type { HueSlot } from '../hue';
import './LampButton.css';

/** The hues a lamp can wear. `m` is the original's deprecated alias of `t` and draws exactly as it. */
export type LampHue = 't' | HueSlot | 'ok' | 'lamp' | 'role-2' | 'm';

/** The face as drawn. */
export type LampFace = 'off' | 'on' | 'record' | 'waiting' | 'armed' | 'disabled';

/** The app's tooltip hook, passed in by the wiring (the original's Svelte `tipAction`). */
export type TipAction = (
  node: HTMLElement,
  key: string,
) => void | { update?: (key: string) => void; destroy?: () => void };

export interface LampButtonProps {
  /** The word on the face. */
  label: string;
  /** Lit or off. Controlled: a press asks for `!on` through `onToggle` and changes nothing itself. */
  on?: boolean;
  /** Identity: `t` neutral (function lamps), `1`–`4` a categorical hue slot (`--hue-1..4`; an app maps its own meaning, e.g. Yahaha's parts), `ok` running, `lamp` playback (e.g. a looper looping), `role-2` the second role hue (`--role-2`; e.g. Yahaha's keys that move time), neutral while off. On is an outline and a lit LED; only `ok`, `lamp` and record fill solid. */
  hue?: LampHue;
  /** Small code after the label, e.g. `ACMP`. */
  code?: string;
  /** Shown, not pressable: no toggle and no long press. Stays focusable. */
  disabled?: boolean;
  /** Record lamp: lit and waiting draw in the danger (record) colour instead of `hue`. */
  rec?: boolean;
  /** The waiting (armed) face while not on. */
  waiting?: boolean;
  /**
   * Armed and pressed: engaged but waiting for its cue (Sync Start on, waiting for the first chord).
   * With `on`, draws the `armed` face (the on outline with its LED blinking) instead of the steady
   * lit one; `aria-pressed` stays true. Without `on` it changes nothing. Default false.
   */
  armed?: boolean;
  /** `md` a section-row key, `sm` a settings-row key, `cell` fills its container (the band's lamp row). */
  size?: 'md' | 'sm' | 'cell';
  /** The narrowest width in px, label centred (e.g. 64 for a settings row's On/Off); the key grows when its label needs more, so it never clips. Wins over the size's width. */
  width?: number;
  /** Joined to a neighbour: `start` has one on its right, `end` on its left; the shared corners go square. */
  join?: 'start' | 'end';
  /** The accessible name when the label alone isn't enough ("Channel 1 on"). Default: label and code. */
  name?: string;
  /** Tooltip key, rendered as `data-tip`. */
  tip?: string;
  /** The app's tooltip hook; applied with `tip` when both are set. */
  tipAction?: TipAction;
  /** Called with the state asked for (`!on`) after a click, Space or Enter; not after a long press. */
  onToggle?: (on: boolean) => void;
  /** Called when the key is held for the long-press time, or right-clicked. */
  onLongPress?: () => void;
  /** Called when the press that fired `onLongPress` ends. */
  onLongRelease?: () => void;
}

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
 * (typography.md: hierarchy by size and colour; no mono on the Stage). Corners follow
 * `--radius-control`, heights `--control-h`. *Headless:* named parts (`face`, `lamp`, `label`,
 * `code`); the face is made of the theme's `key` material, `--mat-key-pressed` while on, armed or
 * held, and a lit LED sets `--lit` and wears `--mat-lit-glow`, so a material set restyles the lamp
 * without touching it. Meaning still wins: the running and record fills, the rings and the wash stay.
 *
 * **Kept.** Fully controlled (the face and `aria-pressed` follow `on` alone; a press only asks for
 * `!on`), long press and right-click that never toggle, disabled that stays focusable with
 * `aria-disabled`, the accessible name override, the joined edges, the width prop, the three sizes,
 * and the `data-face` / `data-hue` / `data-contrast` hooks.
 */
export function LampButton({
  label,
  on = false,
  hue = 't',
  code,
  disabled = false,
  rec = false,
  waiting = false,
  armed = false,
  size = 'md',
  width,
  join,
  name,
  tip,
  tipAction,
  onToggle,
  onLongPress,
  onLongRelease,
}: LampButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const face: Exclude<LampFace, 'disabled'> = on ? (armed ? 'armed' : rec ? 'record' : 'on') : waiting ? 'waiting' : 'off';
  const drawn = rec && face !== 'off' ? 'rec' : hue === 'm' ? 't' : hue;

  useLongPress(ref, { onLongPress, onLongRelease, disabled: disabled || onLongPress === undefined });

  useEffect(() => {
    const node = ref.current;
    if (!node || !tipAction || tip === undefined) return;
    const handle = tipAction(node, tip);
    return () => {
      if (handle) handle.destroy?.();
    };
  }, [tipAction, tip]);

  const style: CSSProperties | undefined = width === undefined ? undefined : { minWidth: `${width}px` };
  const classes = ['yh-lampbutton', `yh-lampbutton--${size}`];
  if (width !== undefined) classes.push('yh-lampbutton--fixed');
  if (join) classes.push(`yh-lampbutton--join-${join}`);

  return (
    <button
      ref={ref}
      type="button"
      className={classes.join(' ')}
      data-part="face"
      style={style}
      data-face={disabled ? 'disabled' : face}
      data-hue={drawn}
      data-contrast={disabled ? 'dim' : undefined}
      data-tip={tip}
      aria-pressed={on}
      aria-disabled={disabled ? 'true' : undefined}
      aria-label={name ?? (code ? `${label} ${code}` : label)}
      onClick={() => {
        if (!disabled) onToggle?.(!on);
      }}
    >
      <span className="yh-lampbutton__led" data-part="lamp" aria-hidden="true" />
      <span className="yh-lampbutton__label" data-part="label">
        {label}
      </span>
      {code && (
        <span className="yh-lampbutton__code" data-part="code">
          {code}
        </span>
      )}
    </button>
  );
}

export default LampButton;

import { useEffect, useRef, type CSSProperties } from 'react';
import { useLongPress } from './useLongPress';
import './LampButton.css';

/** The hues a lamp can wear. `m` is the original's deprecated alias of `t` and draws exactly as it. */
export type LampHue = 't' | 'r1' | 'r2' | 'r3' | 'l' | 'ok' | 'lamp' | 'm';

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
  /** Identity: `t` neutral (Accomp, Metronome, function lamps), a part (`r1` `r2` `r3` `l`), `ok` running (Start / Stop), `lamp` the Looper looping. */
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
   * With `on`, draws the `armed` face (the waiting ring, sunk like a held key, LED blinking) instead
   * of the lit one; `aria-pressed` stays true. Without `on` it changes nothing. Default false.
   */
  armed?: boolean;
  /** `md` a section-row key, `sm` a settings-row key, `cell` fills its container (the band's lamp row). */
  size?: 'md' | 'sm' | 'cell';
  /** The narrowest width in px, label centred (e.g. 64 for a settings row's On/Off); the key grows when its label needs more, so it never clips. Wins over the size's width. */
  width?: number;
  /** Joined to a neighbour: `start` has one on its right, `end` on its left; the shared corners go square. */
  join?: 'start' | 'end';
  /** The accessible name when the label alone isn't enough ("Right 1 on"). Default: label and code. */
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
 * **Job.** The on/off key the whole canvas uses: Accomp, Metronome, a part's On, Sound, Looper,
 * Start / Stop. At a glance a player must see which part or function it belongs to, whether it is
 * lit, armed or off, and that it is a key they can press (hold or right-click for its second function).
 *
 * **Changed.** *Hierarchy and affordance:* the original drew off as a full-strength coloured
 * outline and label, so every lamp in a row shouted equally and off differed from on only by fill.
 * Now off is a quiet raised key (surface fill, hairline border, secondary label) carrying a small
 * unlit LED in its hue, and on is the only face with a solid fill, so lit and unlit separate by
 * value, not just hue; that reads under every palette, including light and bloom-free ones, where
 * the fill alone carries "lit" and `--bloom` only adds a glow where the palette has one
 * (color.md: restraint, colour by purpose). The key sinks 1px on press. *Colour meaning:* part
 * hues (`--hue-1..4`) only name the part; Start / Stop and the looping Looper use `--success`
 * (running), record uses `--danger`, neutral lamps light in `--text-1`, and focus is an
 * `--accent` ring (craft-details.md: `:focus-visible`). *Armed* is a 2px ring with a blinking LED,
 * the hardware convention for "waiting", still on reduced motion as a steady LED. *Disabled* is a
 * dashed, unfilled key with a hollow LED and `not-allowed` cursor, so it can't be mistaken for off.
 * *Armed and pressed* (`armed` with `on`) is the waiting ring on a key that sits sunk, as if held,
 * over a stronger wash, so "engaged, waiting for its cue" differs from both lit and merely armed
 * (affordance). *Rhythm:* `width` is now a minimum, not a fixed width, so a label at a larger
 * density, in a wider case or with more tracking grows the key instead of clipping (craft-details.md).
 * *Type:* labels follow `--label-case` and `--tracking` at one weight in every face, so a lit key
 * is as wide as an off one; the code is set in the mono face, smaller and quieter (typography.md:
 * one family, hierarchy by size and colour). Corners follow `--radius-control`, heights `--control-h`.
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
      <span className="yh-lampbutton__led" aria-hidden="true" />
      <span className="yh-lampbutton__label">{label}</span>
      {code && <span className="yh-lampbutton__code">{code}</span>}
    </button>
  );
}

export default LampButton;

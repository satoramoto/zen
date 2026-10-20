// LampButton's model: its props, the face it draws from them (classes, `data-*` and ARIA), and what
// a press asks for. No framework: `LampButton.tsx` (React) and `LampButton.svelte` (Svelte) both
// render `lampButtonView`; the long press is Button's store (`../Button/longPress.ts`).
import type { HueSlot } from '../hue';
import type { TipAction } from '../Button/Button.model';
import { focusRing } from '../../../primitives/Ring';
import type { ElementView, TextModelProps } from '../../../primitives/Text.model';

export type { TipAction } from '../Button/Button.model';

/** The hues a lamp can wear. `m` is the original's deprecated alias of `t` and draws exactly as it. */
export type LampHue = 't' | HueSlot | 'ok' | 'lamp' | 'role-2' | 'm';

/** The face as drawn. */
export type LampFace = 'off' | 'on' | 'record' | 'waiting' | 'armed' | 'disabled';

/** Every LampButton prop (it has no framework-specific children). */
export interface LampButtonModelProps {
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

/** What a renderer draws: the face (a `Text` rendered as a `<button>`), its LED, label and code. */
export interface LampButtonView {
  /** The face's Text props. */
  text: TextModelProps;
  /** The face's class (beside Text's own) and its `type`, `data-*` and ARIA attributes. */
  face: ElementView;
  /** The face's `min-width` (from `width`), or undefined for none. */
  minWidth: string | undefined;
  /** The label's text. */
  label: string;
  /** The code, drawn as a Text with these props, class and attributes; null for none. */
  code: { value: string; text: TextModelProps; className: string; attrs: Record<string, string | undefined> } | null;
  /** Whether the long press is on (a pointer hold-to-press or a right-click reach `onLongPress`). */
  longPress: boolean;
}

/** The face LampButton draws from its props. */
export function lampButtonView({
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
  onLongPress,
}: LampButtonModelProps): LampButtonView {
  const face: Exclude<LampFace, 'disabled'> = on ? (armed ? 'armed' : rec ? 'record' : 'on') : waiting ? 'waiting' : 'off';
  const drawn = rec && face !== 'off' ? 'rec' : hue === 'm' ? 't' : hue;
  const classes = ['yh-lampbutton', `yh-lampbutton--${size}`, focusRing];
  if (width !== undefined) classes.push('yh-lampbutton--fixed');
  if (join) classes.push(`yh-lampbutton--join-${join}`);
  return {
    text: { role: 'label', leading: 'tight', tabular: true },
    face: {
      className: classes.join(' '),
      attrs: {
        type: 'button',
        'data-part': 'face',
        'data-face': disabled ? 'disabled' : face,
        'data-hue': String(drawn),
        'data-contrast': disabled ? 'dim' : undefined,
        'data-tip': tip,
        'aria-pressed': String(on),
        'aria-disabled': disabled ? 'true' : undefined,
        'aria-label': name ?? (code ? `${label} ${code}` : label),
      },
    },
    minWidth: width === undefined ? undefined : `${width}px`,
    label,
    code: code
      ? {
          value: code,
          text: { role: 'numeral', size: 'caption', weight: 'body', case: 'none' },
          className: 'yh-lampbutton__code',
          attrs: { 'data-part': 'code' },
        }
      : null,
    longPress: !disabled && onLongPress !== undefined,
  };
}

/** The state a click, Space or Enter asks for (`!on`), or undefined when disabled (no toggle). */
export function lampToggle({ on = false, disabled = false }: Pick<LampButtonModelProps, 'on' | 'disabled'>): boolean | undefined {
  return disabled ? undefined : !on;
}

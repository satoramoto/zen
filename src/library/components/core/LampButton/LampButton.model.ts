// LampButton's model: its props, the tree it draws from them (classes, `data-*`, ARIA, the stores it
// binds), the handlers that tree names, and what a press asks for. No framework: `LampButton.tsx`
// (React) and `LampButton.svelte` (Svelte) both pass `lampButtonView` and `lampButtonHandlers` to
// their `Tree`; the long press is Button's store (`../Button/longPress.ts`).
import type { HueSlot } from '../hue';
import type { TipAction } from '../Button/Button.model';
import { focusRing } from '../../../primitives/Ring';
import { textView } from '../../../primitives/Text.model';
import { h, wire, type Handlers, type Node } from '../../../view/Tree.model';

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
/**
 * The tree LampButton draws from its props: the face (a `label` Text as a `<button>`), its lamp,
 * label and code. A click calls `toggle` (`lampButtonHandlers`); it binds the long press and the
 * tooltip.
 */
export function lampButtonView(props: LampButtonModelProps): Node {
  const {
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
  } = props;
  const face: Exclude<LampFace, 'disabled'> = on ? (armed ? 'armed' : rec ? 'record' : 'on') : waiting ? 'waiting' : 'off';
  const drawn = rec && face !== 'off' ? 'rec' : hue === 'm' ? 't' : hue;
  const classes = ['yh-lampbutton', `yh-lampbutton--${size}`, focusRing];
  if (width !== undefined) classes.push('yh-lampbutton--fixed');
  if (join) classes.push(`yh-lampbutton--join-${join}`);
  const text = textView({ role: 'label', leading: 'tight', tabular: true, className: classes.join(' ') });
  const codeText = textView({ role: 'numeral', size: 'caption', weight: 'body', case: 'none', className: 'yh-lampbutton__code' });
  const longPress = !disabled && onLongPress !== undefined;
  return wire(
    h(
      'button',
      {
        class: text.className,
        ...text.attrs,
        style: width === undefined ? undefined : `min-width: ${width}px`,
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
      h('span', { class: 'yh-lampbutton__led', 'data-part': 'lamp', 'aria-hidden': 'true' }),
      h('span', { class: 'yh-lampbutton__label', 'data-part': 'label' }, label),
      code ? h('span', { class: codeText.className, ...codeText.attrs, 'data-part': 'code' }, code) : null,
    ),
    {
      on: { click: 'toggle' },
      bind: [
        ['longPress', { disabled: !longPress, onLongPress: 'longPress', onLongRelease: 'longRelease' }],
        ['tip', { tip, tipAction: 'tipAction' }],
      ],
    },
  );
}

/** The callbacks `lampButtonView`'s tree names: `toggle` (asks for `lampToggle`'s state), and the
 *  long press's and the tooltip's. */
export function lampButtonHandlers(props: LampButtonModelProps): Handlers {
  return {
    toggle: () => {
      const next = lampToggle(props);
      if (next !== undefined) props.onToggle?.(next);
    },
    longPress: props.onLongPress,
    longRelease: props.onLongRelease,
    tipAction: props.tipAction,
  };
}

/** The state a click, Space or Enter asks for (`!on`), or undefined when disabled (no toggle). */
export function lampToggle({ on = false, disabled = false }: Pick<LampButtonModelProps, 'on' | 'disabled'>): boolean | undefined {
  return disabled ? undefined : !on;
}

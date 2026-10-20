// Button's model: its props, the face it draws from them (classes, `data-*` and ARIA), and which
// clicks press it. No framework: `Button.tsx` (React) and `Button.svelte` (Svelte) both render
// `buttonView`; the long press and the hold are stores beside it (`longPress.ts`, `hold.ts`).
import type { HueSlot } from '../hue';
import { focusRing } from '../../../primitives/Ring';
import type { ElementView, TextModelProps } from '../../../primitives/Text.model';

export type ButtonGlyph = 'prev' | 'next' | 'up' | 'down' | 'plus' | 'minus' | 'caret';
export type ButtonHue =
  | 't'
  | 't2'
  | 'm'
  | 'a'
  | 'lamp'
  | 'rec'
  | 'ok'
  | HueSlot
  | 'intro'
  | 'main'
  | 'ending'
  | 'role-2'
  | 'brk'
  | 'fill';
export type ButtonSize = 'icon' | 'md' | 'band' | 'pair' | 'cell' | 'caret';
export type ButtonVariant = 'primary' | 'secondary' | 'quiet';
export type ButtonFace = 'off' | 'on' | 'chosen' | 'waiting' | 'disabled';

/** The parent's tooltip action (a Svelte-style `use:tip`): called with the node and the key. */
export type TipAction = (node: HTMLElement, key: string) => { update?: (key: string) => void; destroy?: () => void } | void;

/** Every Button prop but its icon (a React node or a Svelte snippet, so each renderer adds its own). */
export interface ButtonModelProps {
  /** The word or character on the face ("Panic", "Stop", "1", "?"). May be empty when `symbol` is set. */
  label?: string;
  /** A glyph after the label, or alone: ◀ ▶ ▲ ▼ + − ▾. Hidden from assistive tech. */
  symbol?: ButtonGlyph;
  /** The native hover hint (`title`), e.g. "Hide the inspector (⌘I)". */
  title?: string;
  /** `icon` square; `md` width from the label; `band` a wide, left-aligned transport key; `pair` one of two; `cell` fills its container; `caret` the narrow ▾. All heights are `--control-h`. */
  size?: ButtonSize;
  /** Rank at rest. `primary`: the one filled call to action on the screen (`--action`). `secondary` (default): an outlined key. `quiet`: no outline, for low-stakes steps. The on, chosen, waiting and disabled faces override it. */
  variant?: ButtonVariant;
  /** Kept for compatibility; changes nothing. */
  compact?: boolean;
  /** Kept for compatibility; changes nothing. */
  strong?: boolean;
  /** Start / Stop running, `band` only. `true`: the on face in `--success`, solid, marked `data-bar`. */
  bar?: boolean;
  /** The on face: switched on (help mode's ?, Fade while fading). A ring and a lit dot; solid only in `ok` (running) and `rec` (recording). */
  on?: boolean;
  /** The chosen face: the one picked from a set (the applied One Touch). Ink and a rule along the bottom; a `quiet` key (a toggle such as a panel's JSON switch) takes the pack's chosen-tab face instead. */
  chosen?: boolean;
  /** The waiting face: queued or armed, a double-weight ring over a faint tint. */
  waiting?: boolean;
  /** The flash phase of the waiting face, driven by the parent (as on the Pad): `false` drops the tint and thins the ring to the rest outline in the tone; the label stays. Default `true`, the steady waiting face. Ignored by every other face. */
  lit?: boolean;
  /** A tall key, two control rows and the gap between them, its label at heading size: the primary key of a transport (Start / Stop). Default `false`. Works with any `size`. */
  tall?: boolean;
  /** What the button belongs to. `t` (and deprecated `t2`, `m`, `lamp`) neutral; `1`–`4` a categorical hue slot (`--hue-1..4`; an app maps its own meaning, e.g. Yahaha's parts); `intro` `main` `fill` `brk` `ending` sections (neutral: the label names the section); `rec` danger; `ok` success; `a` the accent; `role-2` the second role hue (`--role-2`; e.g. Yahaha's keys that move time), neutral at rest and in the hue only while waiting, on, or as the primary fill. */
  hue?: ButtonHue;
  /** Sets `aria-pressed` for a switch or a choice. Undefined: no `aria-pressed`. Never changes the look. */
  pressed?: boolean;
  /** Sets `aria-haspopup` (the caret opens a dialog). */
  popup?: 'dialog' | 'menu';
  /** With `popup`: `aria-expanded`, and the on face while open. */
  expanded?: boolean;
  /** Sets `aria-controls`: the id of the popover this button opens. */
  controls?: string;
  /** Joined to a neighbour: `start` on its right, `end` on its left (the shared corners go square). */
  join?: 'start' | 'end';
  /** Shown, not pressable: no press, hold or long press. Stays focusable (`aria-disabled`). */
  disabled?: boolean;
  /** Repeat-while-held (Tempo ±): pointer down and up call `onHold`; a pointer click doesn't press; no long press. */
  hold?: boolean;
  /** The accessible name. Default: the label, then the symbol's word ("Fill up"). */
  name?: string;
  /** The tooltip key (e.g. `transport.panic`), rendered as `data-tip`. */
  tip?: string;
  /** The app's tooltip action, passed in by the wiring; applied with `tip` when both are set. */
  tipAction?: TipAction;
  /** Called on a click, Space or Enter; not for the click that ends a long press; with `hold`, only from the keyboard. */
  onPress?: () => void;
  /** With `hold`: `true` when a primary pointer goes down, `false` once when that hold ends. */
  onHold?: (down: boolean) => void;
  /** Called when the button is held for the long-press time, or right-clicked. */
  onLongPress?: () => void;
  /** Called when the press that fired `onLongPress` ends. */
  onLongRelease?: () => void;
}

export const GLYPHS: Record<ButtonGlyph, string> = { prev: '◀', next: '▶', up: '▲', down: '▼', plus: '+', minus: '−', caret: '▾' };
const WORDS: Record<ButtonGlyph, string> = {
  prev: 'previous',
  next: 'next',
  up: 'up',
  down: 'down',
  plus: 'plus',
  minus: 'minus',
  caret: 'options',
};
/** Deprecated greys and the lamp line all draw as the neutral `t`. */
const NEUTRAL = new Set<ButtonHue>(['t', 't2', 'm', 'lamp']);
/** The tones whose on face is solid: running (Start / Stop) and recording. A solid fill means sounding or running. */
const SOLID = new Set<ButtonHue>(['ok', 'rec']);

/** What a renderer draws: the face (a `Text` rendered as a `<button>`), the label and the glyph. */
export interface ButtonView {
  /** The face's Text props. */
  text: TextModelProps;
  /** The face's class (beside Text's own) and its `type`, `data-*`, `title` and ARIA attributes. */
  face: ElementView;
  /** The label's text, or null for none. */
  label: string | null;
  /** The glyph's character and its attributes, drawn as a `label` Text with `leading="tight"`; null for none. */
  glyph: { char: string; className: string; attrs: Record<string, string | undefined> } | null;
  /** Whether the long press is on (a pointer hold-to-press or a right-click reach `onLongPress`). */
  longPress: boolean;
}

/** The face Button draws from its props: the same precedence as ever (disabled, chosen, on, waiting, off). */
export function buttonView({
  label = '',
  symbol,
  title,
  size = 'md',
  variant = 'secondary',
  bar,
  on = false,
  chosen = false,
  waiting = false,
  lit = true,
  tall = false,
  hue = 't',
  pressed,
  popup,
  expanded = false,
  controls,
  join,
  disabled = false,
  hold = false,
  name,
  tip,
  onLongPress,
}: ButtonModelProps): ButtonView {
  const running = size === 'band' && bar === true;
  const open = popup !== undefined && expanded;
  const face: Exclude<ButtonFace, 'disabled'> = chosen ? 'chosen' : on || running || open ? 'on' : waiting ? 'waiting' : 'off';
  const drawn: ButtonHue = running && !chosen ? 'ok' : NEUTRAL.has(hue) ? 't' : hue;
  return {
    text: { role: 'label', leading: 'tight', tabular: true },
    face: {
      className: `yh-button ${focusRing}`,
      attrs: {
        type: 'button',
        'data-part': 'face',
        'data-size': size,
        'data-variant': variant,
        'data-face': disabled ? 'disabled' : face,
        'data-hue': String(drawn),
        'data-join': join,
        'data-tall': tall ? '' : undefined,
        'data-lit': !disabled && face === 'waiting' && !lit ? 'false' : undefined,
        'data-alone': label === '' ? '' : undefined,
        'data-bar': running ? '' : undefined,
        'data-solid': !disabled && face === 'on' && SOLID.has(drawn) ? '' : undefined,
        'data-contrast': disabled ? 'dim' : undefined,
        'data-tip': tip,
        title,
        'aria-label': name ?? [label, symbol ? WORDS[symbol] : ''].filter(Boolean).join(' '),
        'aria-pressed': pressed === undefined ? undefined : String(pressed),
        'aria-haspopup': popup,
        'aria-expanded': popup !== undefined ? String(expanded) : undefined,
        'aria-controls': controls,
        'aria-disabled': disabled ? 'true' : undefined,
      },
    },
    label: label !== '' ? label : null,
    glyph: symbol
      ? { char: GLYPHS[symbol], className: 'yh-button__glyph', attrs: { 'data-part': 'glyph', 'data-glyph': symbol, 'aria-hidden': 'true' } }
      : null,
    longPress: !disabled && !hold && onLongPress !== undefined,
  };
}

/** Whether a click presses: never while disabled, and with `hold` only a keyboard click (`detail` 0). */
export function clickPresses({ disabled = false, hold = false }: Pick<ButtonModelProps, 'disabled' | 'hold'>, detail: number): boolean {
  if (disabled) return false;
  return !(hold && detail !== 0);
}

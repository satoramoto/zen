import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';
import { useLongPress } from './useLongPress';
import type { HueSlot } from '../hue';
import { focusRing } from '../../../primitives/Ring';
import { Text } from '../../../primitives/Text';
import './Button.css';

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

export interface ButtonProps {
  /** The word or character on the face ("Panic", "Stop", "1", "?"). May be empty when `symbol` is set. */
  label?: string;
  /** A glyph after the label, or alone: ◀ ▶ ▲ ▼ + − ▾. Hidden from assistive tech. */
  symbol?: ButtonGlyph;
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
  /** The chosen face: the one picked from a set (the applied One Touch). Ink and a rule along the bottom. */
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

const GLYPHS: Record<ButtonGlyph, string> = { prev: '◀', next: '▶', up: '▲', down: '▼', plus: '+', minus: '−', caret: '▾' };
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

/**
 * **Job.** Does one thing when pressed (Panic, Stop, a page step, a One Touch) and shows, at a
 * glance, whether that thing is switched on, chosen, armed or unavailable. A player reading a
 * crowded transport needs the label first, then the state, then (for hued buttons) whose it is.
 *
 * **Changed.** *Hierarchy:* the original had one rank, so Panic, a page step and Start / Stop all
 * looked alike; a `variant` now ranks them — `primary` is the single `--action` fill, `secondary` a
 * hairline key, `quiet` no outline (color.md, "Component color limit"; anti-ai-slop.md on restraint).
 * *Contrast:* the original drew the rest label in the hue itself, which fails on light palettes
 * (a pink on white); the label is now always `--text-1` and the hue moves to the outline, the fill
 * and the waiting ring (color.md §4, 4.5:1 for text). *Colour meaning:* hue only marks identity
 * (slots `1`–`4` → `--hue-1..4`; sections stay neutral, their label names them, so no section passes
 * for a hued key), Start / Stop running is `--success` and record
 * `--danger` (state), focus is `--accent`; a neutral switch that is on uses `--selected`. *A solid
 * fill means sounding or running* (the Stage rule): only Start / Stop running (`ok`), record
 * (`rec`) and the `primary` call to action fill. Every other key that is *on* draws a
 * double-weight ring and a lit dot in its colour, and a *chosen* key keeps its rest outline and
 * gains `--text-1` ink and a rule along the bottom, the same mark as an underlined tab; so
 * on, chosen and waiting are three different shapes, not one fill for eleven things (colour
 * meaning; color.md, "state changes: structure, not circus"). A `role-2` key (in Yahaha, the keys
 * that move time) takes the contract's `--role-2` role hue, but only while active: at rest it is
 * neutral (a `--border-strong` outline, a neutral hover), its hue appears on the waiting ring, the
 * on ring and the `primary` fill (Start), so Start is the one saturated key a player finds without
 * looking. Each solid face takes its own ink: `--on-hue` on a hue slot or the accent,
 * `--success-text`, `--danger-text` and `--role-2-text` on the rest (the original used `--on-hue`
 * everywhere, which the contract only promises against the categorical hues). Lit hued marks
 * bloom by `--bloom`, so they glow on Push and stay flat on paper palettes. *Affordance:* a
 * disabled button reads as unavailable by structure: a dashed edge and a `--text-3` label (still
 * readable, never `--text-4`), and a not-allowed cursor; hover and press tint the face by its own
 * tone; a visible `:focus-visible` ring sits outside the face (craft-details.md §1). One ring
 * weight, `--yh-wait-ring` (twice `--border-width`), and one 14% tint serve the waiting face here,
 * on LampButton and on Pad. *Rhythm:* sizes derive from `--control-h` and `--space-*`, so density
 * packs scale every key together; labels follow `--label-case` and `--tracking` and use tabular
 * numerals (typography.md). Every width is a floor: a key never truncates its own name, it grows
 * to hold it (`pair` is now 1.6 control heights, enough for four capitals and a glyph). A `tall`
 * key spans two control rows with a heading-size label, so the transport's primary key (Start /
 * Stop) leads by size as well as fill (hierarchy), and grows rather than reading "ST…". The waiting
 * face can flash: the parent drives `lit`, as on the Pad, and its off phase keeps the label and a
 * hairline ring in the tone, so a queued key blinks without the row jumping (affordance;
 * craft-details.md). *Headless:* named parts (`face`, `label`, `glyph`); the face is made of the
 * theme's `key` material, `--mat-key-pressed` while held, on or chosen, and the on dot is lit with
 * `--mat-lit-glow`, so a material set restyles every key without touching it. Meaning still wins:
 * the primary, running and recording fills, the rings, the underline and the dashed edge stay; a
 * `quiet` key has no key material at all.
 *
 * **Kept.** Every face comes from props, in the same precedence (disabled, chosen, on, waiting,
 * off); the outline is an inset shadow so faces never change size; the same glyphs, accessible
 * names, `aria-pressed`/`aria-haspopup`/`aria-expanded`/`aria-disabled`; disabled stays focusable;
 * long press (held or right-click) swallows its click; `hold` follows one pointer and ends on
 * release, cancel, lost capture, disable or unmount.
 *
 * **Tuning knobs**
 * - `--yh-button-*`: the face's colour roles, set per tone and variant in Button.css: `tone`
 *   (whose key it is), `fill` and `ink` (the on ring, dot, underline and solid face, and the label
 *   on it), `line` (rest outline), `rest` (rest hover tint), `glow` (lit bloom), `cta` and
 *   `cta-ink` (the primary fill and its label), `tint` (the hover, press and waiting wash).
 * - `--yh-wait-ring`: the waiting and on ring's weight, one weight across Button, LampButton and Pad.
 */
export function Button({
  label = '',
  symbol,
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
  tipAction,
  onPress,
  onHold,
  onLongPress,
  onLongRelease,
}: ButtonProps) {
  const running = size === 'band' && bar === true;
  const open = popup !== undefined && expanded;
  const face: Exclude<ButtonFace, 'disabled'> = chosen ? 'chosen' : on || running || open ? 'on' : waiting ? 'waiting' : 'off';
  const drawn: ButtonHue = running && !chosen ? 'ok' : NEUTRAL.has(hue) ? 't' : hue;
  const accessibleName = name ?? [label, symbol ? WORDS[symbol] : ''].filter(Boolean).join(' ');

  const node = useRef<HTMLButtonElement>(null);
  const onHoldRef = useRef(onHold);
  onHoldRef.current = onHold;
  /** The pointer of the hold in progress. */
  const holdId = useRef<number | null>(null);

  const endHold = useCallback((release: boolean) => {
    const id = holdId.current;
    if (id === null) return;
    holdId.current = null;
    if (release) {
      try {
        node.current?.releasePointerCapture?.(id);
      } catch {
        // No capture to release (jsdom, a pointer already gone).
      }
    }
    onHoldRef.current?.(false);
  }, []);

  // A hold ends at once when it can't continue: disabled, or no longer a hold button...
  useEffect(() => {
    if (disabled || !hold) endHold(true);
  }, [disabled, hold, endHold]);
  // ...or when the button goes away while held.
  useEffect(() => () => endHold(false), [endHold]);

  useLongPress(node, { onLongPress, onLongRelease, disabled: disabled || hold || onLongPress === undefined });

  useEffect(() => {
    const target = node.current;
    if (!tipAction || tip === undefined || !target) return;
    const handle = tipAction(target, tip);
    return () => handle?.destroy?.();
  }, [tip, tipAction]);

  function pointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!hold || disabled || event.button !== 0 || holdId.current !== null) return;
    holdId.current = event.pointerId;
    try {
      node.current?.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
    onHoldRef.current?.(true);
  }

  function pointerEnd(event: PointerEvent<HTMLButtonElement>) {
    if (holdId.current !== null && event.pointerId === holdId.current) endHold(false);
  }

  function click(event: MouseEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (hold && event.detail !== 0) return;
    onPress?.();
  }

  return (
    <Text
      as="button"
      role="label"
      leading="tight"
      tabular
      ref={node}
      type="button"
      className={`yh-button ${focusRing}`}
      data-part="face"
      data-size={size}
      data-variant={variant}
      data-face={disabled ? 'disabled' : face}
      data-hue={drawn}
      data-join={join}
      data-tall={tall ? '' : undefined}
      data-lit={!disabled && face === 'waiting' && !lit ? 'false' : undefined}
      data-alone={label === '' ? '' : undefined}
      data-bar={running ? '' : undefined}
      data-solid={!disabled && face === 'on' && SOLID.has(drawn) ? '' : undefined}
      data-contrast={disabled ? 'dim' : undefined}
      data-tip={tip}
      aria-label={accessibleName}
      aria-pressed={pressed}
      aria-haspopup={popup}
      aria-expanded={popup !== undefined ? expanded : undefined}
      aria-controls={controls}
      aria-disabled={disabled ? 'true' : undefined}
      onClick={click}
      onPointerDown={pointerDown}
      onPointerUp={pointerEnd}
      onPointerCancel={pointerEnd}
      onLostPointerCapture={pointerEnd}
    >
      {label !== '' && (
        <span className="yh-button__label" data-part="label">
          {label}
        </span>
      )}
      {symbol && (
        <Text role="label" leading="tight" className="yh-button__glyph" data-part="glyph" data-glyph={symbol} aria-hidden="true">
          {GLYPHS[symbol]}
        </Text>
      )}
    </Text>
  );
}

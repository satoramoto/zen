import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';
import { useLongPress } from './useLongPress';
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
  | 'r1'
  | 'r2'
  | 'r3'
  | 'l'
  | 'intro'
  | 'main'
  | 'ending'
  | 'brk'
  | 'fill';
export type ButtonSize = 'icon' | 'md' | 'band' | 'pair' | 'cell' | 'caret';
export type ButtonVariant = 'primary' | 'secondary' | 'quiet';
export type ButtonFace = 'off' | 'on' | 'chosen' | 'waiting' | 'disabled';

/** The parent's tooltip action (yahaha's `use:tip`): called with the node and the key. */
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
  /** Start / Stop running, `band` only. `true`: the on face in `--success`, marked `data-bar`. */
  bar?: boolean;
  /** The on face: switched on (help mode's ?, Fade while fading). */
  on?: boolean;
  /** The chosen face: the one picked from a set (the applied One Touch). */
  chosen?: boolean;
  /** The waiting face: queued or armed, a double-weight ring over a faint tint. */
  waiting?: boolean;
  /** What the button belongs to. `t` (and deprecated `t2`, `m`, `lamp`) neutral; `r1` `r2` `r3` `l` the four part hues; `intro` `main` `fill` `brk` `ending` sections (neutral: the label names the section); `rec` danger; `ok` success; `a` the accent. */
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

/**
 * **Job.** Does one thing when pressed (Panic, Stop, a page step, a One Touch) and shows, at a
 * glance, whether that thing is switched on, chosen, armed or unavailable. A player reading a
 * crowded transport needs the label first, then the state, then (for part buttons) whose it is.
 *
 * **Changed.** *Hierarchy:* the original had one rank, so Panic, a page step and Start / Stop all
 * looked alike; a `variant` now ranks them — `primary` is the single `--action` fill, `secondary` a
 * hairline key, `quiet` no outline (color.md, "Component color limit"; anti-ai-slop.md on restraint).
 * *Contrast:* the original drew the rest label in the hue itself, which fails on light palettes
 * (a pink on white); the label is now always `--text-1` and the hue moves to the outline, the fill
 * and the waiting ring (color.md §4, 4.5:1 for text). *Colour meaning:* hue only marks identity
 * (`r1`–`l` → `--hue-1..4`; sections stay neutral, their label names them, so no section passes
 * for a part), Start / Stop running is `--success` and record
 * `--danger` (state), focus is `--accent`; a neutral switch that is on uses `--selected`. Lit
 * hued faces bloom by `--bloom`, so they glow on Push and stay flat on paper palettes. *Affordance:*
 * a disabled button now reads as unavailable (faded outline, faded label, not-allowed cursor)
 * instead of merely "a dimmer hue"; hover and press tint the face by its own tone; a visible
 * `:focus-visible` ring sits outside the face (craft-details.md §1). *Rhythm:* sizes derive from
 * `--control-h` and `--space-*`, so density packs scale every key together; labels follow
 * `--label-case` and `--tracking` and use tabular numerals (typography.md).
 *
 * **Kept.** Every face comes from props, in the same precedence (disabled, chosen, on, waiting,
 * off); the outline is an inset shadow so faces never change size; the same glyphs, accessible
 * names, `aria-pressed`/`aria-haspopup`/`aria-expanded`/`aria-disabled`; disabled stays focusable;
 * long press (held or right-click) swallows its click; `hold` follows one pointer and ends on
 * release, cancel, lost capture, disable or unmount.
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
    <button
      ref={node}
      type="button"
      className="yh-button"
      data-size={size}
      data-variant={variant}
      data-face={disabled ? 'disabled' : face}
      data-hue={drawn}
      data-join={join}
      data-alone={label === '' ? '' : undefined}
      data-bar={running ? '' : undefined}
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
      {label !== '' && <span className="yh-button__label">{label}</span>}
      {symbol && (
        <span className="yh-button__glyph" data-glyph={symbol} aria-hidden="true">
          {GLYPHS[symbol]}
        </span>
      )}
    </button>
  );
}

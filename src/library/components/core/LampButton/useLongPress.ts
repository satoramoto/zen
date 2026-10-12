// Long press for LampButton, ported from yahaha/src/ui/actions/longpress (same rules, as a React
// hook). A primary press held for `--long-press` (350 ms fallback) without moving more than 4px
// calls onLongPress while still held; its release calls onLongRelease and the click that follows is
// swallowed. A right-click (or the Menu key / Shift+F10) calls onLongPress, then onLongRelease when
// the right button comes up (at once if it is already up); the browser's menu never opens.
import { useEffect, useRef, type RefObject } from 'react';

export interface LongPressParams {
  /** Called once when a press has been held for the long-press time, or on a right-click. Undefined: off. */
  onLongPress?: () => void;
  /** Called once when a press that fired onLongPress ends (released, cancelled, or unmounted). */
  onLongRelease?: () => void;
  /** No long press: a press starts nothing and a right-click calls nothing (its menu is still prevented). */
  disabled?: boolean;
}

/** The hold time used when the `--long-press` variable can't be read (jsdom, not declared). */
export const LONG_PRESS_FALLBACK_MS = 350;

/** A press that moves further than this from where it went down is not a long press. */
export const MOVE_TOLERANCE_PX = 4;

/** Parses a CSS time (`350ms`, `0.5s`) into milliseconds; anything else is `null`. */
export function parseDuration(value: string): number | null {
  const match = /^(\d+(?:\.\d+)?|\.\d+)(ms|s)$/.exec(value.trim());
  if (!match) return null;
  const n = Number(match[1]);
  return match[2] === 's' ? n * 1000 : n;
}

type Press =
  | { kind: 'primary'; pointerId: number; x: number; y: number; fired: boolean; timer?: ReturnType<typeof setTimeout> }
  | { kind: 'right' };

export function useLongPress<T extends HTMLElement>(ref: RefObject<T | null>, params: LongPressParams): void {
  const current = useRef(params);
  current.current = params;
  // Lets the effect below cancel an unfired press when the hook is turned off mid-press.
  const cancelUnfired = useRef<() => void>(() => {});

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let press: Press | null = null;
    let swallow = false;

    const off = () => current.current.disabled === true || current.current.onLongPress === undefined;

    const holdTime = () =>
      parseDuration(window.getComputedStyle(node).getPropertyValue('--long-press') ?? '') ?? LONG_PRESS_FALLBACK_MS;

    function listen() {
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
    }
    function unlisten() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    }

    /** Ends the press in progress; calls onLongRelease when it had fired. */
    function end() {
      const fired = press !== null && (press.kind === 'right' || press.fired);
      if (press?.kind === 'primary') clearTimeout(press.timer);
      press = null;
      unlisten();
      if (fired) current.current.onLongRelease?.();
    }

    function onPointerDown(event: PointerEvent) {
      if (press) return;
      swallow = false;
      if (off() || event.button !== 0) return;
      const started: Press = { kind: 'primary', pointerId: event.pointerId, x: event.clientX, y: event.clientY, fired: false };
      started.timer = setTimeout(() => {
        started.fired = true;
        started.timer = undefined;
        swallow = true;
        current.current.onLongPress?.();
      }, holdTime());
      press = started;
      listen();
    }

    function onMove(event: PointerEvent) {
      if (press?.kind !== 'primary' || press.fired || event.pointerId !== press.pointerId) return;
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > MOVE_TOLERANCE_PX) end();
    }

    function onUp(event: PointerEvent) {
      if (press?.kind === 'primary' ? event.pointerId === press.pointerId : event.button === 2) end();
    }

    function onCancel(event: PointerEvent) {
      if (press?.kind === 'primary' ? event.pointerId === press.pointerId : press !== null) end();
    }

    function onContextMenu(event: MouseEvent) {
      event.preventDefault();
      if (press || off()) return;
      current.current.onLongPress?.();
      if (event.buttons & 2) {
        press = { kind: 'right' };
        listen();
      } else {
        current.current.onLongRelease?.();
      }
    }

    // Capture on the node runs before React's root listener sees the click bubble, so stopping it
    // here keeps the component's onClick from toggling after a long press.
    function onClick(event: MouseEvent) {
      if (!swallow) return;
      swallow = false;
      event.stopImmediatePropagation();
      event.preventDefault();
    }

    function onKeyDown() {
      swallow = false;
    }

    cancelUnfired.current = () => {
      if (off() && press?.kind === 'primary' && !press.fired) end();
    };

    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('contextmenu', onContextMenu);
    node.addEventListener('click', onClick, { capture: true });
    node.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      end();
      cancelUnfired.current = () => {};
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('contextmenu', onContextMenu);
      node.removeEventListener('click', onClick, { capture: true });
      node.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, [ref]);

  // Turned off mid-press: a primary press that hasn't fired is cancelled; a fired one, or a held
  // right-click, still gets its release.
  const isOff = params.disabled === true || params.onLongPress === undefined;
  useEffect(() => {
    if (isOff) cancelUnfired.current();
  }, [isOff]);
}

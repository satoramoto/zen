import { useEffect, useRef, type RefObject } from 'react';

/**
 * useLongPress: hold a button for a moment (or right-click it) to reach its second function.
 * A port of yahaha's `longpress` action (yahaha/src/ui/actions/longpress), kept local to Button.
 *
 * - A primary-button press held for LONG_PRESS_MS without moving more than MOVE_TOLERANCE_PX calls
 *   `onLongPress` while still held; its release calls `onLongRelease`, and the click that follows
 *   is swallowed, so the button's own click handler never sees it.
 * - A right-click (or the Menu key / Shift+F10) calls `onLongPress`, then `onLongRelease` when the
 *   right button comes up (at once if it is already up). The browser's menu never opens.
 * - It follows the press with `window` listeners, never pointer capture.
 */
export interface LongPressParams {
  /** Called once when a press has been held for the long-press time, or on a right-click. Undefined: off. */
  onLongPress?: () => void;
  /** Called once when a press that fired `onLongPress` ends (released, cancelled, or unmounted). */
  onLongRelease?: () => void;
  /** No long press: a press starts nothing and a right-click calls nothing (its menu is still prevented). */
  disabled?: boolean;
}

/** The hold time, as yahaha's `--long-press` token. */
export const LONG_PRESS_MS = 350;
/** A press that moves further than this from where it went down is not a long press. */
export const MOVE_TOLERANCE_PX = 4;

type Press =
  | { kind: 'primary'; pointerId: number; x: number; y: number; fired: boolean; timer?: ReturnType<typeof setTimeout> }
  | { kind: 'right' };

export function useLongPress(ref: RefObject<HTMLElement | null>, params: LongPressParams): void {
  const current = useRef(params);
  current.current = params;
  /** Cancels a primary press that hasn't fired yet; set by the listener effect. */
  const cancelUnfired = useRef<() => void>(() => {});

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let press: Press | null = null;
    let swallow = false;
    const off = () => current.current.disabled === true || current.current.onLongPress === undefined;

    const listen = () => {
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
    };
    const unlisten = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
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
      }, LONG_PRESS_MS);
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
      if (press?.kind === 'primary' && !press.fired) end();
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

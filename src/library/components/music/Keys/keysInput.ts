/**
 * Keys' input, framework-free: dragging and clicking the split handle, stepping it from the
 * keyboard, the pick (while armed, the key pressed becomes the split), and the Esc that disarms
 * before the app hears it. `Keys.tsx` (through `useKeysInput`) and `Keys.svelte` both feed it
 * their events; neither holds any of this logic.
 *
 * - The handle: a primary pointer going down starts a press; once it has moved `DRAG_SLOP` px it
 *   drags (the key under it, black keys by x alone, is asked for); lifted without a drag it is a
 *   click and arms or disarms the pick. Locked, nothing starts.
 * - The handle's keys: Enter or Space arms or disarms (not while locked), Esc disarms while armed,
 *   the arrows, PageUp/PageDown, Home/End step the split (`steppedSplit`).
 * - The pick surface: a primary pointer going down asks for the key under it, sliding keeps
 *   asking, lifting disarms.
 * - Every ask is clamped to the limits and dropped when locked or already there (`askedSplit`).
 */
import { askedSplit, DRAG_SLOP, noteUnder, steppedSplit, type KeysSettings } from './Keys.model';

/** What the input reads, fresh on every event: the view's settings and the callbacks. */
export interface KeysInputParams {
  settings: KeysSettings;
  onSplit?: (note: number) => void;
  onPick?: (armed: boolean) => void;
}

/** The pointer event fields read (a DOM or a React event). */
export interface KeysPointer {
  button: number;
  pointerId: number;
  clientX: number;
  clientY: number;
  currentTarget: EventTarget | null;
}

/** The key event fields read (a DOM or a React event). */
export interface KeysKey {
  key: string;
  preventDefault(): void;
}

export interface KeysInput {
  handleDown(event: KeysPointer): void;
  handleMove(event: KeysPointer): void;
  handleUp(event: KeysPointer): void;
  handleCancel(event: KeysPointer): void;
  handleKey(event: KeysKey): void;
  pickDown(event: KeysPointer): void;
  pickMove(event: KeysPointer): void;
  pickUp(event: KeysPointer): void;
  pickCancel(event: KeysPointer): void;
}

function capture(event: KeysPointer) {
  try {
    (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
  } catch {
    // jsdom and synthetic events have no pointer capture.
  }
}

/** One per Keys: `params` is read on every event, `strip` is the keys' element (the pointer maps through its box). */
export function createKeysInput(params: () => KeysInputParams, strip: () => HTMLElement | null | undefined): KeysInput {
  let drag: { pointer: number; startX: number; dragged: boolean } | null = null;
  let pickPointer: number | null = null;

  function ask(note: number | null) {
    const p = params();
    const next = askedSplit(note, p.settings);
    if (next !== null) p.onSplit?.(next);
  }
  function keyUnder(event: KeysPointer, top: boolean): number | null {
    const box = strip()?.getBoundingClientRect();
    if (!box) return null;
    return noteUnder(params().settings, box, event.clientX, event.clientY, top);
  }

  return {
    handleDown(event) {
      if (event.button !== 0 || params().settings.splitLocked) return;
      drag = { pointer: event.pointerId, startX: event.clientX, dragged: false };
      capture(event);
    },
    handleMove(event) {
      const d = drag;
      if (!d || d.pointer !== event.pointerId) return;
      if (!d.dragged && Math.abs(event.clientX - d.startX) < DRAG_SLOP) return;
      d.dragged = true;
      ask(keyUnder(event, true));
    },
    handleUp(event) {
      const d = drag;
      if (!d || d.pointer !== event.pointerId) return;
      drag = null;
      if (!d.dragged) {
        const p = params();
        p.onPick?.(!p.settings.picking);
      }
    },
    handleCancel(event) {
      if (drag?.pointer === event.pointerId) drag = null;
    },
    handleKey(event) {
      const p = params();
      const { split, picking, splitLocked } = p.settings;
      if (split === null) return;
      if (event.key === 'Escape') {
        if (picking) {
          event.preventDefault();
          p.onPick?.(false);
        }
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!splitLocked) p.onPick?.(!picking);
        return;
      }
      const to = steppedSplit(event.key, p.settings);
      if (to === null) return;
      event.preventDefault();
      ask(to);
    },
    pickDown(event) {
      if (event.button !== 0) return;
      pickPointer = event.pointerId;
      capture(event);
      ask(keyUnder(event, false));
    },
    pickMove(event) {
      if (pickPointer === event.pointerId) ask(keyUnder(event, false));
    },
    pickUp(event) {
      if (pickPointer !== event.pointerId) return;
      pickPointer = null;
      params().onPick?.(false);
    },
    pickCancel(event) {
      if (pickPointer === event.pointerId) pickPointer = null;
    },
  };
}

/** The Esc that disarms: while `armed`, caught on `target` (the window) before the app's own Esc. */
export interface PickEscapeParams {
  armed: boolean;
  onPick?: (armed: boolean) => void;
}

/** Listens on `target` (capturing) for Esc while armed; `update` follows `armed`, `destroy` stops. */
export function bindPickEscape(target: EventTarget, initial: PickEscapeParams): { update(params: PickEscapeParams): void; destroy(): void } {
  let params = initial;
  let listening = false;
  const onKey = (event: Event) => {
    if ((event as KeyboardEvent).key !== 'Escape') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    params.onPick?.(false);
  };
  const sync = () => {
    if (params.armed && !listening) target.addEventListener('keydown', onKey, true);
    if (!params.armed && listening) target.removeEventListener('keydown', onKey, true);
    listening = params.armed;
  };
  sync();
  return {
    update(next) {
      params = next;
      sync();
    },
    destroy() {
      params = { ...params, armed: false };
      sync();
    },
  };
}

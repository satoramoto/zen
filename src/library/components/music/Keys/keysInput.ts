/**
 * Keys' input, framework-free: dragging and clicking the split handle, stepping it from the
 * keyboard, the pick (while armed, the key pressed becomes the split), and the Esc that disarms
 * before the app hears it. `bindKeysInput` binds it all on the Keys root as one store (`keysInput`
 * in `src/library/view/stores.ts`): the handle and the pick surface are found by `data-part` under
 * it, so both renderers' `Tree` apply it and neither holds any of this logic.
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
import { askedSplit, DRAG_SLOP, keysSettings, noteUnder, steppedSplit, type KeysInputData, type KeysSettings } from './Keys.model';

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

/** What `bindKeysInput` is bound with: the view's plain data (`keysView` fills it) and the two asks. */
export interface KeysBindParams extends KeysInputData {
  onSplit?: (note: number) => void;
  onPick?: (armed: boolean) => void;
}

/** The handle or the pick surface an event came from, under `root`; null for anything else. */
function partOf(root: HTMLElement, event: Event): { part: 'handle' | 'pick'; element: HTMLElement } | null {
  const target = event.target as Element | null;
  const element = target?.closest?.('[data-part="handle"], [data-part="pick"]') as HTMLElement | null | undefined;
  if (!element || !root.contains(element)) return null;
  return { part: element.getAttribute('data-part') as 'handle' | 'pick', element };
}

/**
 * Keys' input on its root: the handle's pointer and keys and the pick surface's pointer (each found
 * by `data-part` under `node`, so either may come and go), and the Esc that disarms, on the window
 * while `armed`. The keys are laid out again from `params` (`keysSettings`) for the pointer to map
 * through the strip (`data-part="strip"`).
 */
export function bindKeysInput(node: HTMLElement, initial: KeysBindParams): { update(params: KeysBindParams): void; destroy(): void } {
  let params = initial;
  let settings = keysSettings(params);
  const input = createKeysInput(
    () => ({ settings, onSplit: params.onSplit, onPick: params.onPick }),
    () => node.querySelector<HTMLElement>('[data-part="strip"]'),
  );
  const escape = bindPickEscape(window, { armed: params.armed, onPick: (next) => params.onPick?.(next) });

  const pointer = (handle: keyof KeysInput & `handle${string}`, pick: keyof KeysInput & `pick${string}`) => (event: Event) => {
    const from = partOf(node, event);
    if (!from) return;
    const e = event as PointerEvent;
    const fields: KeysPointer = { button: e.button, pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY, currentTarget: from.element };
    (input[from.part === 'handle' ? handle : pick] as (event: KeysPointer) => void)(fields);
  };
  const listeners: [string, (event: Event) => void][] = [
    ['pointerdown', pointer('handleDown', 'pickDown')],
    ['pointermove', pointer('handleMove', 'pickMove')],
    ['pointerup', pointer('handleUp', 'pickUp')],
    ['pointercancel', pointer('handleCancel', 'pickCancel')],
    [
      'keydown',
      (event) => {
        if (partOf(node, event)?.part === 'handle') input.handleKey(event as KeyboardEvent);
      },
    ],
  ];
  for (const [type, listener] of listeners) node.addEventListener(type, listener);

  return {
    update(next) {
      params = next;
      settings = keysSettings(params);
      escape.update({ armed: params.armed, onPick: (armed) => params.onPick?.(armed) });
    },
    destroy() {
      for (const [type, listener] of listeners) node.removeEventListener(type, listener);
      escape.destroy();
    },
  };
}

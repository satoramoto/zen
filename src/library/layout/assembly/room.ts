// The room an assembled screen measures, framework-free: its own box's px, kept current by a
// ResizeObserver. The assembled screen binds it as the `room` store (`bindRoom`, view/stores.ts),
// which reports each size through its `onRoom` handler into the screen's room state; Svelte's
// public `measureRoom` (room.svelte.ts) wraps `observeRoom` too.

export interface RoomSize {
  w: number;
  h: number;
}

/** The board's size, where nothing can measure the room (jsdom). */
export const FALLBACK_ROOM: RoomSize = { w: 1440, h: 900 };

/**
 * Reads `node`'s client box now and on every resize, calling `onSize` when it is non-empty and
 * changed. Returns the disconnect. Without ResizeObserver it does nothing (the caller keeps
 * `FALLBACK_ROOM`).
 */
export function observeRoom(node: HTMLElement, onSize: (room: RoomSize) => void): () => void {
  if (typeof ResizeObserver === 'undefined') return () => {};
  let last: RoomSize | null = null;
  const read = () => {
    const w = node.clientWidth;
    const h = node.clientHeight;
    if (w > 0 && h > 0 && !(last && last.w === w && last.h === h)) {
      last = { w, h };
      onSize(last);
    }
  };
  read();
  const observer = new ResizeObserver(read);
  observer.observe(node);
  return () => observer.disconnect();
}

export interface RoomParams {
  /** Called with the box's px now and on every change (`observeRoom`). */
  onRoom?: (room: RoomSize) => void;
}

/** The measured room as a store (registered as `room`): reports `node`'s size through `onRoom`, read
 *  at the moment it reports (so the latest handler), until the element goes. */
export function bindRoom(node: HTMLElement, params: RoomParams): { destroy(): void } {
  return { destroy: observeRoom(node, (room) => params.onRoom?.(room)) };
}

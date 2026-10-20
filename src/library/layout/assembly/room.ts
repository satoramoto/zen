// The room an assembled screen measures, framework-free: its own box's px, kept current by a
// ResizeObserver. React's `useRoom` (AssembledScreen.tsx) and Svelte's `measureRoom`
// (room.svelte.ts) both wrap `observeRoom`.

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

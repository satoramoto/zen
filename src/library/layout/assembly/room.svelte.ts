// The measured room in Svelte: React's `useRoom` over the same `observeRoom` (room.ts).
import { FALLBACK_ROOM, observeRoom, type RoomSize } from './room';

/**
 * The room an element measures: attach `attach` to it (`{@attach room.attach}`); `current` is
 * `given()` when set, else the element's last non-empty size, else 1440 × 900 (where nothing
 * measures, as in jsdom). Reactive; call it while a component initialises.
 */
export function measureRoom(given?: () => RoomSize | undefined): { readonly current: RoomSize; attach: (node: HTMLElement) => (() => void) | undefined } {
  let measured = $state<RoomSize | null>(null);
  return {
    get current() {
      return given?.() ?? measured ?? FALLBACK_ROOM;
    },
    attach(node) {
      if (given?.()) return;
      return observeRoom(node, (size) => (measured = size));
    },
  };
}

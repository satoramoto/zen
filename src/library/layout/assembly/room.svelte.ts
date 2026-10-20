// The measured room in Svelte, for a screen of an app's own: the assembled screen's `room` store
// (`bindRoom`, room.ts) writing a local room state (`localState`), read with `fromStore`.
import { fromStore } from 'svelte/store';
import { localState } from '../local';
import { FALLBACK_ROOM, bindRoom, type RoomSize } from './room';

/**
 * The room an element measures: attach `attach` to it (`{@attach room.attach}`); `current` is
 * `given()` when set, else the element's last non-empty size, else 1440 × 900 (where nothing
 * measures, as in jsdom). Reactive; call it while a component initialises.
 */
export function measureRoom(given?: () => RoomSize | undefined): { readonly current: RoomSize; attach: (node: HTMLElement) => (() => void) | undefined } {
  const room = localState<RoomSize | null>(null);
  const measured = fromStore(room);
  return {
    get current() {
      return given?.() ?? measured.current ?? FALLBACK_ROOM;
    },
    attach(node) {
      if (given?.()) return;
      return bindRoom(node, { onRoom: room.set }).destroy;
    },
  };
}

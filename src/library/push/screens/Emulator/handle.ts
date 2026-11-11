/**
 * Puts the emulator's own controls on its root element as `pushEmulator`, so a script on the page
 * (a story's play, a developer's console) can act as the app: read the Set, give a new one, read
 * what was asked. Registered as the `pushEmulatorHandle` store.
 */
import type { PushIntent, PushSet } from '../../model/types';

export interface EmulatorHandle {
  /** The Set the device is shown. */
  getSet(): PushSet;
  /** Give the device a new Set: the one returned by `change`, which is handed a copy to alter. */
  change(change: (set: PushSet) => void): void;
  /** Every intent asked since the emulator was drawn, oldest first. */
  intents(): PushIntent[];
  /** Take the device off the page, as an app closing its window would. */
  remove(): void;
}

export interface HandleParams {
  getSet?: () => PushSet;
  change?: (change: (set: PushSet) => void) => void;
  intents?: () => PushIntent[];
  remove?: () => void;
}

export function bindHandle(node: HTMLElement, initial: HandleParams): { update(params: HandleParams): void; destroy(): void } {
  let params = initial;
  const handle: EmulatorHandle = {
    getSet: () => params.getSet!(),
    change: (change) => params.change?.(change),
    intents: () => params.intents?.() ?? [],
    remove: () => params.remove?.(),
  };
  (node as HTMLElement & { pushEmulator?: EmulatorHandle }).pushEmulator = handle;
  return {
    update(next) {
      params = next;
    },
    destroy() {
      delete (node as HTMLElement & { pushEmulator?: EmulatorHandle }).pushEmulator;
    },
  };
}

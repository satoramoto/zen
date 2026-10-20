// Display's one piece of local view state: whether the hero is wide enough for `full` under
// `density="auto"`. A small readable (`subscribe`/`get`; `subscribe` calls the listener at once),
// so React reads it with `useSyncExternalStore(wide.subscribe, wide.get)` and Svelte with
// `fromStore(wide).current`. Each binding creates one per instance; only the `onWide` handler
// (`displayHandlers`), which the `displayWide` store calls, writes it.

export interface WideState {
  /** Calls `listener` now and on every change; returns the unsubscribe. */
  subscribe(listener: (wide: boolean) => void): () => void;
  /** The current value. */
  get(): boolean;
  /** Sets it; listeners hear only a change. */
  set(wide: boolean): void;
}

/** A new wide state, narrow until measured. */
export function wideState(): WideState {
  let wide = false;
  const listeners = new Set<(wide: boolean) => void>();
  return {
    subscribe(listener) {
      listeners.add(listener);
      listener(wide);
      return () => listeners.delete(listener);
    },
    get: () => wide,
    set(next) {
      if (next === wide) return;
      wide = next;
      for (const listener of [...listeners]) listener(wide);
    },
  };
}

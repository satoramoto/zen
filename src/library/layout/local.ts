// Local view state as a store (docs/svelte-bindings.md, "State back to the model"): a value a
// component keeps for itself (a region's own view choice, a measured room), held outside either
// framework. A binding reads it (`useSyncExternalStore(s.subscribe, s.get)` in React,
// `fromStore(s).current` in Svelte) and hands it to the model, `xView(props, state)`; the model's
// handlers write it back with `set`.

/** A readable and writable value: `subscribe` for the bindings, `get` for the current value, `set` to change it. */
export interface LocalState<T> {
  /** Calls `listener` on every change (and, Svelte's store contract, once now); returns the unsubscribe. */
  subscribe(listener: (value: T) => void): () => void;
  get(): T;
  set(value: T): void;
}

/** A store holding `initial`, for one component instance. */
export function localState<T>(initial: T): LocalState<T> {
  let value = initial;
  const listeners = new Set<(value: T) => void>();
  return {
    subscribe(listener) {
      listeners.add(listener);
      listener(value);
      return () => listeners.delete(listener);
    },
    get: () => value,
    set(next) {
      if (Object.is(next, value)) return;
      value = next;
      for (const listener of [...listeners]) listener(value);
    },
  };
}

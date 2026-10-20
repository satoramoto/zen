// A component's local view state (a measured width, a fit step, a drag's local value) as a tiny
// readable, framework-free. A store reports it through a handler (`set`); the binding reads it
// (`useSyncExternalStore(state.subscribe, state.get)` in React, `fromStore(state).current` in
// Svelte) and passes it to the model: `xView(props, state)`. One per mounted component.

/** A readable the binding subscribes to and a handler writes. */
export interface ViewState<T> {
  /** The current value. */
  get(): T;
  /** Replaces the value; subscribers hear it only when it changed (`Object.is`). */
  set(value: T): void;
  /** Calls `run` now and on every change (Svelte's store contract; React's ignores the argument). */
  subscribe(run: (value: T) => void): () => void;
}

/** A new view state holding `initial`. */
export function viewState<T>(initial: T): ViewState<T> {
  let value = initial;
  const runs = new Set<(value: T) => void>();
  return {
    get: () => value,
    set(next) {
      if (Object.is(next, value)) return;
      value = next;
      for (const run of [...runs]) run(value);
    },
    subscribe(run) {
      runs.add(run);
      run(value);
      return () => {
        runs.delete(run);
      };
    },
  };
}

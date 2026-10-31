// Story helper (not shipped): props a mounted Svelte story reads through, so new args reach the
// same instance instead of remounting it (a remount would drop a drag in progress and the focus).
// The keys are fixed at mount; `set` replaces their values.

export interface LiveProps<T extends Record<string, unknown>> {
  /** Pass to `mount`: each key a getter over the latest values. */
  readonly props: T;
  set(next: T): void;
}

export function liveProps<T extends Record<string, unknown>>(initial: T): LiveProps<T> {
  let current = $state.raw(initial);
  const props = {} as T;
  for (const key of Object.keys(initial)) Object.defineProperty(props, key, { enumerable: true, get: () => current[key] });
  return {
    props,
    set(next) {
      current = next;
    },
  };
}

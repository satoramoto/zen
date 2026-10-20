// A store that reports a change: calls `onReport` when it binds and whenever `key` changes (not when
// only the handlers do). Registered as `report` (view/stores.ts); the assembled screen binds it on
// its root with the placement's signature (`placementKey`), so `onPlacement` hears each new
// placement once, in both renderers, with no effect in either binding.

export interface ReportParams {
  /** What is reported, as a signature: a new value calls `onReport`. */
  key: string;
  onReport?: () => void;
}

export function bindReport(_node: HTMLElement, params: ReportParams): { update(params: ReportParams): void } {
  let last = params.key;
  params.onReport?.();
  return {
    update(next) {
      if (next.key === last) return;
      last = next.key;
      next.onReport?.();
    },
  };
}

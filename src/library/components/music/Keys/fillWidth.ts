/**
 * An element's own width, framework-free: while `on`, reads `node.clientWidth` (layout px,
 * unscaled, so a frame drawn scaled still lays out at design px) at once and on every resize (a
 * `ResizeObserver`), and hands it to `onWidth`. `useFillWidth` (React) and the `fillWidth` action
 * (`fillWidth.svelte.ts`) both wrap it.
 */
export interface FillWidthParams {
  /** Measure; off, nothing is read (the last width stays with the caller). */
  on: boolean;
  /** Called with the width, px (0 or more), when first read and on every resize. */
  onWidth: (width: number) => void;
}

export function bindFillWidth(node: HTMLElement, initial: FillWidthParams): { update(params: FillWidthParams): void; destroy(): void } {
  let params = initial;
  let observer: ResizeObserver | null = null;
  let watching = false;
  const read = () => params.onWidth(Math.max(0, node.clientWidth));
  const start = () => {
    watching = true;
    read();
    if (typeof ResizeObserver === 'undefined') return;
    observer = new ResizeObserver(read);
    observer.observe(node);
  };
  const stop = () => {
    watching = false;
    observer?.disconnect();
    observer = null;
  };
  if (params.on) start();
  return {
    update(next) {
      params = next;
      if (next.on && !watching) start();
      else if (!next.on && watching) stop();
    },
    destroy: stop,
  };
}

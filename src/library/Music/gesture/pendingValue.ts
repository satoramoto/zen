/** Framework-free authority/readback hold, with the source's tolerance and deadline. */
import { viewState } from '../../view/viewState';
export function readbackTolerance(min: number, max: number): number {
  return Math.max(0.0001, Math.abs(max - min) / 2000);
}
export function pendingValue(reported: number | null, options: { tolerance?: number; timeout?: number } = {}) {
  const { tolerance = 0.0001, timeout = 750 } = options;
  const shown = viewState(reported);
  let pending: number | null = null;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  function release() {
    clearTimeout(deadline); deadline = undefined; pending = null; shown.set(reported);
  }
  return {
    ...shown,
    get value() { return shown.get(); },
    push(next: number) {
      clearTimeout(deadline); pending = next; shown.set(next);
      deadline = setTimeout(release, timeout);
    },
    update(next: number | null) {
      reported = next;
      if (pending !== null && next !== null && Math.abs(next - pending) <= tolerance) release();
      else if (pending === null) shown.set(next);
    },
    release,
    destroy() { clearTimeout(deadline); },
  };
}

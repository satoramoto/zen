/**
 * A level meter that moves at its own rate (openspec: push-mix-view, "Meters move at their own
 * rate"): once a frame it asks for its track's level, left and right, and writes them to the two
 * meters inside its element, with a peak mark that holds for a moment. Nothing is redrawn.
 * Registered as the `pushFrameMeter` store, bound to a display cell that holds two `Music.Meter`s.
 *
 * A track the frame does not name is not measured: the cell is marked `data-unmeasured` and its
 * meters stay empty, rather than showing a number that was never read.
 */
import type { PushFrame } from '../../model/types';

export interface FrameMeterParams {
  /** Whose levels to read from the frame. */
  track: string;
  /** The app's fast values, read each frame. */
  frame?: () => PushFrame | undefined;
}

/** How long a peak mark stays before it falls. */
export const PEAK_HOLD_MS = 900; // added

/** A level eased toward a target: fast up, slower down, as a meter's needle is. */
export function ease(level: number, target: number, dt: number): number {
  const next = level + (target - level) * (1 - Math.exp(-dt / (target > level ? 35 : 140)));
  return target === 0 && next < 0.0001 ? 0 : next;
}

/** A peak that holds: the highest level seen, kept for the hold time, then following the level down. */
export function holdPeak(peak: { value: number; at: number }, level: number, now: number): { value: number; at: number } {
  if (level >= peak.value) return { value: level, at: now };
  return now - peak.at > PEAK_HOLD_MS ? { value: level, at: now } : peak;
}

export function bindFrameMeter(node: HTMLElement, initial: FrameMeterParams): { update(params: FrameMeterParams): void; destroy(): void } {
  let params = initial;
  const view = node.ownerDocument.defaultView!;
  const levels = [0, 0];
  const peaks = [{ value: 0, at: 0 }, { value: 0, at: 0 }];
  let previous = view.performance.now();
  let frame = 0;
  let alive = true;

  function tick(now: number) {
    if (!alive) return;
    const dt = Math.max(0, Math.min(100, now - previous));
    previous = now;
    const read = params.frame?.()?.levels?.[params.track];
    if (read) delete node.dataset.unmeasured;
    else node.dataset.unmeasured = '';
    const meters = node.querySelectorAll<HTMLElement>('.wdg-meter');
    for (let side = 0; side < 2; side++) {
      const target = Math.min(1, Math.max(0, read?.[side] ?? 0));
      levels[side] = ease(levels[side], target, dt);
      peaks[side] = holdPeak(peaks[side], levels[side], now);
      const meter = meters[side];
      if (!meter) continue;
      meter.style.setProperty('--wdg-meter-fill', String(levels[side]));
      meter.style.setProperty('--wdg-meter-peak', String(peaks[side].value));
      meter.querySelector('[role="meter"]')?.setAttribute('aria-valuenow', String(Math.round(levels[side] * 100)));
    }
    frame = view.requestAnimationFrame(tick);
  }
  frame = view.requestAnimationFrame(tick);

  return {
    update(next) {
      params = next;
    },
    destroy() {
      alive = false;
      view.cancelAnimationFrame(frame);
    },
  };
}

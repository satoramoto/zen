import { useCallback, useEffect, useRef, useState } from 'react';

export interface Clock {
  /** Where in the cycle, 0 to 1. */
  t: number;
  playing: boolean;
  play(): void;
  pause(): void;
  toggle(): void;
  /** Set the time by hand; pauses. */
  scrub(t: number): void;
}

/**
 * A looping clock over one cycle, 0 to 1, advanced by animation frames at `period` seconds per
 * cycle. It starts paused unless asked, pauses when the tab hides, respects reduced motion
 * (never auto-plays), and stops on unmount.
 */
export function useClock(period = 8, autoplay = false): Clock {
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(autoplay && !reduced);
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    let frame = 0;
    const tick = (now: number) => {
      if (last.current !== null) setT((v) => (v + (now - last.current!) / 1000 / period) % 1);
      last.current = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const hide = () => document.hidden && setPlaying(false);
    document.addEventListener('visibilitychange', hide);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', hide);
    };
  }, [playing, period]);
  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const scrub = useCallback((v: number) => {
    setPlaying(false);
    setT(Math.min(1, Math.max(0, v)));
  }, []);
  return { t, playing, play, pause, toggle, scrub };
}

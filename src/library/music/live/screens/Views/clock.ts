// A stand-in set clock for the stories: the beat as a float, advanced by animation frames at the
// tempo given. The panes never run a clock; they take `beat` as a prop, as they would from the
// engine. Under reduced motion (or `running: false`) it holds still at `start`.
import { useEffect, useState } from 'react';

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useBeat(tempo: number, running = true, start = 0): number {
  const [beat, setBeat] = useState(start);
  useEffect(() => {
    if (!running || reducedMotion()) {
      setBeat(start);
      return;
    }
    let frame = 0;
    let origin: number | null = null;
    const tick = (now: number) => {
      origin ??= now;
      setBeat(start + ((now - origin) / 60000) * tempo);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [tempo, running, start]);
  return beat;
}

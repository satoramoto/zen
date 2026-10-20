import { useEffect, useRef, useState, type RefObject } from 'react';
import { bindLineSlider, type LineSliderBinding, type LineSliderParams } from './slide';

// The behaviour itself is framework-free (`slide.ts`); this hook binds it to a React ref.
export { snap, type TipAction } from './LineSlider.model';
export type { LineSliderParams } from './slide';

/**
 * Binds the line slider's keys and drag (`slide.ts`) to `ref`'s element, with the latest
 * params on every render. Returns `held`: a pointer is dragging the thumb.
 */
export function useLineSlider(ref: RefObject<HTMLElement | null>, params: Omit<LineSliderParams, 'onheld'>): boolean {
  const [held, setHeld] = useState(false);
  const binding = useRef<LineSliderBinding | null>(null);
  const latest = { ...params, onheld: setHeld };

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    binding.current = bindLineSlider(node, latest);
    return () => {
      binding.current?.destroy();
      binding.current = null;
    };
    // Bound once per node; every render's params reach it through `update` below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  useEffect(() => {
    binding.current?.update(latest);
  });

  return held;
}

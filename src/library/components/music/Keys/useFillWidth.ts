import { useLayoutEffect, useRef, useState } from 'react';
import { bindFillWidth } from './fillWidth';

// The measuring itself is framework-free (`fillWidth.ts`); this hook binds it to a React ref.

/** The ref'd element's own width in layout px while `on`; 0 until measured. Read before paint, then on every resize. */
export function useFillWidth<T extends HTMLElement>(on: boolean) {
  const ref = useRef<T>(null);
  const [measured, setMeasured] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!on || !el) return;
    const binding = bindFillWidth(el, { on, onWidth: setMeasured });
    return () => binding.destroy();
  }, [on]);
  return [ref, measured] as const;
}

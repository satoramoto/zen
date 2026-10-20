import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { bindFit, type Fit, type FitBinding } from './fit';

/** Binds the hero's fit (`fit.ts`) to `ref`'s element and measures again whenever `key` changes. */
export function useFit(ref: RefObject<HTMLElement | null>, key: readonly unknown[]): Fit {
  const [fit, setFit] = useState<Fit>('full');
  const binding = useRef<FitBinding | null>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    binding.current = bindFit(node, { onFit: setFit });
    return () => {
      binding.current?.destroy();
      binding.current = null;
    };
  }, [ref]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => binding.current?.update(), key);

  return fit;
}

import { useEffect, useRef, type RefObject } from 'react';
import { bindPad, type PadBinding, type PadParams } from './padPress';

// The press and the tooltip are framework-free (`padPress.ts`); this hook binds them to a React ref.
export type { TipAction } from './padPress';

export type UsePadOptions = PadParams;

export interface UsePad {
  /** The face's ref: the node the press and the tooltip action are bound to. */
  ref: RefObject<HTMLButtonElement | null>;
}

/** Binds the pad (`padPress.ts`) to the face, with the latest options on every render. */
export function usePad(options: UsePadOptions): UsePad {
  const ref = useRef<HTMLButtonElement>(null);
  const binding = useRef<PadBinding | null>(null);
  const latest = useRef(options);
  latest.current = options;

  // Bound once per node; every render's options reach it through `update` below.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    binding.current = bindPad(node, latest.current);
    return () => {
      binding.current?.destroy();
      binding.current = null;
    };
  }, [ref]);

  useEffect(() => {
    binding.current?.update(options);
  });

  return { ref };
}

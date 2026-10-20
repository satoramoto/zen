import { useEffect, useRef, useState, type RefObject } from 'react';
import { bindBarInput, type BarBinding, type BarParams, type BarState } from './barInput';

/** Binds the row's input (`barInput.ts`) to `ref`'s slider, with the latest params on every render; returns its state. */
export function useBarInput(ref: RefObject<HTMLElement | null>, params: BarParams): BarState {
  const [state, setState] = useState<BarState>({ local: null, dragging: false });
  const binding = useRef<BarBinding | null>(null);
  const latest = useRef(params);
  latest.current = params;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    binding.current = bindBarInput(node, { ...latest.current, onState: setState });
    return () => {
      binding.current?.destroy();
      binding.current = null;
    };
  }, [ref]);

  // Every render's props (the state may have caught up with the edit, and the callback may be new).
  useEffect(() => {
    binding.current?.update({ ...params, onState: setState });
  });

  return state;
}

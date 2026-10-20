import { useEffect, useRef, type RefObject } from 'react';
import { bindPickEscape, createKeysInput, type KeysInput, type KeysInputParams } from './keysInput';

// Keys' input is framework-free (`keysInput.ts`); this hook keeps one store per Keys reading the
// latest render's params, and binds the Esc that disarms while `armed`.

export function useKeysInput(params: KeysInputParams, armed: boolean, strip: RefObject<HTMLElement | null>): KeysInput {
  const latest = useRef(params);
  latest.current = params;
  const input = useRef<KeysInput | null>(null);
  if (input.current === null) input.current = createKeysInput(() => latest.current, () => strip.current);

  useEffect(() => {
    if (!armed) return;
    const binding = bindPickEscape(window, { armed, onPick: (next) => latest.current.onPick?.(next) });
    return () => binding.destroy();
  }, [armed]);

  return input.current;
}

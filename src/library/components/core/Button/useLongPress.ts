import { useEffect, useRef, type RefObject } from 'react';
import { bindLongPress, type LongPressBinding, type LongPressParams } from './longPress';

// The long press itself is framework-free (`longPress.ts`); this hook binds it to a React ref.
export { LONG_PRESS_MS, MOVE_TOLERANCE_PX, type LongPressParams } from './longPress';

/** Binds the long press (`longPress.ts`) to `ref`'s element, with the latest params on every render. */
export function useLongPress(ref: RefObject<HTMLElement | null>, params: LongPressParams): void {
  const binding = useRef<LongPressBinding | null>(null);
  const latest = useRef(params);
  latest.current = params;
  // The binding reads params through this object, so every render's callbacks are the ones called.
  const live = useRef<LongPressParams>({
    get onLongPress() {
      return latest.current.onLongPress;
    },
    get onLongRelease() {
      return latest.current.onLongRelease;
    },
    get disabled() {
      return latest.current.disabled;
    },
  }).current;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    binding.current = bindLongPress(node, live);
    return () => {
      binding.current?.destroy();
      binding.current = null;
    };
  }, [ref, live]);

  // Turned off mid-press: the binding cancels a press that hasn't fired.
  const off = params.disabled === true || params.onLongPress === undefined;
  useEffect(() => {
    if (off) binding.current?.update(live);
  }, [off, live]);
}

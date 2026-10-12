import { useEffect, useRef, type RefObject } from 'react';

/** A tooltip action in the shape of the app's `use:tip`: called with the node and the key. */
export type TipAction = (
  node: HTMLElement,
  key: string,
) => { update?: (key: string) => void; destroy?: () => void } | void;

export interface UsePadOptions {
  /** Called on a click, Space or Enter, unless `disabled`. */
  onPress?: () => void;
  /** Unavailable: the press does nothing (the pad stays focusable). */
  disabled?: boolean;
  /** The tooltip key. */
  tip?: string;
  /** The app's tooltip action, applied with `tip` when both are set. */
  tipAction?: TipAction;
}

export interface UsePad {
  /** The face's ref: the node the tooltip action runs on. */
  ref: RefObject<HTMLButtonElement | null>;
  /** The face's click handler: a press, unless disabled. */
  onClick: () => void;
}

/**
 * The Pad's behaviour, headless: the press (a click, Space or Enter, which a `<button>` turns into a
 * click) that a disabled pad ignores, and the tooltip action's lifetime on the face. The markup and
 * its look stay in `Pad.tsx` and `Pad.css`, so a theme can restyle the pad without touching this.
 */
export function usePad({ onPress, disabled = false, tip, tipAction }: UsePadOptions): UsePad {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ref.current || !tipAction || tip === undefined) return;
    const handle = tipAction(ref.current, tip);
    return () => handle?.destroy?.();
  }, [tip, tipAction]);

  return {
    ref,
    onClick: () => {
      if (!disabled) onPress?.();
    },
  };
}

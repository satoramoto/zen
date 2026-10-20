import { useEffect, useRef, type ButtonHTMLAttributes, type RefObject } from 'react';
import { bindKnob, knobRootAttrs, type KnobBinding, type KnobParams, type TipAction } from './knobInput';

// The knob's input is framework-free (`knobInput.ts`); this hook binds it to a React ref.
export type { TipAction };

export interface UseKnobOptions {
  /** Nothing is mapped: no turning (a press still fires, as the original's). */
  unused?: boolean;
  /** The accessible name. */
  name: string;
  tip?: string;
  tipAction?: TipAction;
  /** A click that didn't turn the knob, Space or Enter. */
  onpress?: () => void;
  /** Steps turned (positive: clockwise). */
  onstep?: (delta: number) => void;
}

export interface UseKnob {
  /** Spread on the button that is the knob: its ref and aria. */
  rootProps: ButtonHTMLAttributes<HTMLButtonElement> & { ref: RefObject<HTMLButtonElement | null> };
}

/**
 * The knob's behaviour, without its look (`bindKnob`, knobInput.ts): a drag turns it relative to where
 * it is, ↑ → / ↓ ← and the wheel step it, and a click that didn't turn it is a press, as are Space
 * and Enter.
 */
export function useKnob({ unused = false, name, tip, tipAction, onpress, onstep }: UseKnobOptions): UseKnob {
  const ref = useRef<HTMLButtonElement>(null);
  const latest = useRef<KnobParams>({ unused, tip, tipAction, onpress, onstep });
  latest.current = { unused, tip, tipAction, onpress, onstep };
  // The binding reads params through this object, so every render's values are the ones used.
  const live = useRef<KnobParams>({
    get unused() {
      return latest.current.unused;
    },
    get tip() {
      return latest.current.tip;
    },
    get tipAction() {
      return latest.current.tipAction;
    },
    get onpress() {
      return latest.current.onpress;
    },
    get onstep() {
      return latest.current.onstep;
    },
  }).current;
  const binding = useRef<KnobBinding | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    binding.current = bindKnob(node, live);
    return () => {
      binding.current?.destroy();
      binding.current = null;
    };
  }, [live]);

  // A new tip key or action: the binding reapplies the tooltip.
  useEffect(() => {
    binding.current?.update(live);
  }, [tip, tipAction, live]);

  return { rootProps: { ref, ...knobRootAttrs(name) } };
}

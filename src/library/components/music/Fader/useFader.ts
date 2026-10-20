import { useEffect, useRef, type RefObject } from 'react';
import { bindFader, type FaderBinding, type FaderParams } from './faderInput';
import type { FaderTipAction } from './Fader.model';

// The drag, keys and wheel are framework-free (`faderInput.ts`); this hook binds them to a React ref.
export { FADER_MAX } from './faderInput';

export interface UseFaderOptions {
  /** The set level, 0–127. */
  level: number;
  /** A parked fader is shown but not usable: no asks. */
  parked?: boolean;
  /** The tooltip key; with `tipAction`, applied to the root. */
  tip?: string;
  tipAction?: FaderTipAction;
  /** Called with the level asked for (0–127, whole). */
  onlevel?: (level: number) => void;
}

export interface UseFader {
  /** The root (the slider) the behaviour listens on. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** The rail a drag measures: the pointer maps onto its height. */
  railRef: RefObject<HTMLSpanElement | null>;
}

/** Binds the Fader's behaviour (`faderInput.ts`) to the returned refs, with the latest props on every render. */
export function useFader({ level, parked = false, tip, tipAction, onlevel }: UseFaderOptions): UseFader {
  const root = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLSpanElement>(null);
  const binding = useRef<FaderBinding | null>(null);
  const latest = useRef({ level, parked, onlevel });
  latest.current = { level, parked, onlevel };
  // The binding reads params through this object, so every render's props are the ones used.
  const live = useRef<FaderParams>({
    get level() {
      return latest.current.level;
    },
    get parked() {
      return latest.current.parked;
    },
    get onlevel() {
      return latest.current.onlevel;
    },
    rail: () => rail.current,
  }).current;

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    binding.current = bindFader(node, live);
    return () => {
      binding.current?.destroy();
      binding.current = null;
    };
  }, [live]);

  // The state answered: a level matching the last ask confirms it.
  useEffect(() => {
    binding.current?.update(live);
  }, [level, live]);

  useEffect(() => {
    const node = root.current;
    if (!node || !tipAction || tip === undefined) return;
    const handle = tipAction(node, tip);
    return () => handle?.destroy?.();
  }, [tip, tipAction]);

  return { rootRef: root, railRef: rail };
}

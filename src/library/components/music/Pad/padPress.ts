/**
 * The Pad's behaviour, framework-free: the press (a click, Space or Enter, which a `<button>` turns
 * into a click) that a disabled pad ignores, and the tooltip action's lifetime on the face.
 * Registered as `padPress` in `src/library/view/stores.ts`; Pad's tree binds it, and
 * `src/library/svelte.ts` exports it as an action (`actionOf(bindPad)`). The markup is `padView`
 * (Pad.model.ts), its look `Pad.css`.
 */
import type { TipAction } from '../../core/Button/Button.model';

/** A tooltip action in the shape of the app's `use:tip`: called with the node and the key. */
export type { TipAction };

export interface PadParams {
  /** Called on a click, Space or Enter, unless `disabled`. */
  onPress?: () => void;
  /** Unavailable: the press does nothing (the pad stays focusable). */
  disabled?: boolean;
  /** The tooltip key. */
  tip?: string;
  /** The app's tooltip action, applied with `tip` when both are set. */
  tipAction?: TipAction;
}

/** A bound pad: `params` changed (re-applies the tooltip action if its key or action changed), or unbound. */
export interface PadBinding {
  update(params: PadParams): void;
  destroy(): void;
}

/** Whether a click presses: never while disabled. */
export const padPresses = (params: Pick<PadParams, 'disabled'>) => params.disabled !== true;

/** Listens on `node` for presses and applies the tooltip action while `tip` and `tipAction` are set. */
export function bindPad(node: HTMLElement, initial: PadParams): PadBinding {
  let params = initial;
  let applied: { tip?: string; tipAction?: TipAction; handle: ReturnType<TipAction> } | null = null;

  const unapply = () => {
    applied?.handle?.destroy?.();
    applied = null;
  };
  const apply = () => {
    const { tip, tipAction } = params;
    if (applied && applied.tip === tip && applied.tipAction === tipAction) return;
    unapply();
    if (!tipAction || tip === undefined) return;
    applied = { tip, tipAction, handle: tipAction(node, tip) };
  };
  function onClick() {
    if (padPresses(params)) params.onPress?.();
  }

  node.addEventListener('click', onClick);
  apply();
  return {
    update(next) {
      params = next;
      apply();
    },
    destroy() {
      unapply();
      node.removeEventListener('click', onClick);
    },
  };
}

// The tooltip binding, framework-free: applies the app's tooltip hook to a node while a key is set,
// re-applies it (destroying the old handle first) when the key or the hook changes, and destroys
// the handle on `destroy`. `useTip.ts` binds it in React, `tip.svelte.ts` in Svelte.

/** The app's tooltip hook (the original's Svelte `use:tip`): called with the node and the key. */
export type TipAction = (
  node: HTMLElement,
  key: string,
) => void | { update?: (key: string) => void; destroy?: () => void };

export interface TipParams {
  /** The tooltip key. Undefined: no tooltip. */
  tip?: string;
  /** The app's tooltip hook. */
  tipAction?: TipAction;
}

export interface TipBinding {
  update(params: TipParams): void;
  destroy(): void;
}

const apply = (node: HTMLElement, { tip, tipAction }: TipParams) => (tipAction && tip !== undefined ? tipAction(node, tip) : undefined);

/** Binds the tooltip hook to `node` with `params`. */
export function bindTip(node: HTMLElement, params: TipParams): TipBinding {
  let current = params;
  let handle = apply(node, current);
  return {
    update(next) {
      if (next.tip === current.tip && next.tipAction === current.tipAction) return;
      handle?.destroy?.();
      current = next;
      handle = apply(node, current);
    },
    destroy() {
      handle?.destroy?.();
      handle = undefined;
    },
  };
}

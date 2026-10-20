// The tooltip binding, framework-free: applies the app's tooltip hook to a node while it is on,
// re-applies it (destroying the old handle first) when the key, the hook or `enabled` changes, and
// destroys the handle on `destroy`. `useTip.ts` binds it in React, `tip.svelte.ts` in Svelte.

/** The app's tooltip hook (a Svelte action): given the element and a tooltip key; may return a handle. */
export type TipAction = (
  node: HTMLElement,
  key: string,
) => { update?: (key: string) => void; destroy?: () => void } | void;

export interface TipParams {
  /** The tooltip key. Empty or undefined: no tooltip. */
  tip?: string;
  /** The app's tooltip hook. */
  tipAction?: TipAction;
  /** Whether the tooltip applies at all (AccentBlock: only as a button). Default `true`. */
  enabled?: boolean;
}

export interface TipBinding {
  update(params: TipParams): void;
  destroy(): void;
}

const apply = (node: HTMLElement, { tip, tipAction, enabled = true }: TipParams) =>
  enabled && tip && tipAction ? tipAction(node, tip) : undefined;

/** Binds the tooltip hook to `node` with `params`. */
export function bindTip(node: HTMLElement, params: TipParams): TipBinding {
  let current = params;
  let handle = apply(node, current);
  return {
    update(next) {
      if (next.tip === current.tip && next.tipAction === current.tipAction && (next.enabled ?? true) === (current.enabled ?? true)) return;
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

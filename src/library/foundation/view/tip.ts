// The app's tooltip action as a store: applied with the tip key while both are set, reapplied when
// the key or the action changes, torn down on unmount. Registered as `tip` (`stores.ts`).

/** The app's tooltip action (a Svelte-style `use:tip`): called with the node and the key. */
export type TipAction = (node: HTMLElement, key: string) => { update?: (key: string) => void; destroy?: () => void } | void;

export interface TipParams {
  /** The tooltip key (`transport.panic`). */
  tip?: string;
  tipAction?: TipAction;
}

export function bindTip(node: HTMLElement, initial: TipParams): { update(params: TipParams): void; destroy(): void } {
  let applied: { key: string; action: TipAction; handle: ReturnType<TipAction> } | null = null;
  const apply = ({ tip, tipAction }: TipParams) => {
    if (applied && applied.key === tip && applied.action === tipAction) return;
    applied?.handle?.destroy?.();
    applied = null;
    if (!tipAction || tip === undefined) return;
    applied = { key: tip, action: tipAction, handle: tipAction(node, tip) };
  };
  apply(initial);
  return {
    update: apply,
    destroy() {
      applied?.handle?.destroy?.();
      applied = null;
    },
  };
}

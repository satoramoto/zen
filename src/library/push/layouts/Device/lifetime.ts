/**
 * Tells its owner when the element goes: a store with nothing to listen for. The Device binds it
 * so the model's timer stops when the device is taken off the page. Registered as `pushLifetime`.
 */
export interface LifetimeParams {
  onGone?: () => void;
}

export function bindLifetime(_node: HTMLElement, initial: LifetimeParams): { update(params: LifetimeParams): void; destroy(): void } {
  let params = initial;
  return {
    update(next) {
      params = next;
    },
    destroy() {
      params.onGone?.();
    },
  };
}

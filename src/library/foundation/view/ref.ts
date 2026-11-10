// An element ref as a store: hands the element to `onRef` on mount and null on unmount. Registered
// as `ref` (`stores.ts`); Screen's grid binds it for its `gridRef`.

export interface RefParams {
  /** Called with the element when it mounts, and with null when it goes. */
  onRef?: (element: HTMLElement | null) => void;
}

export function bindRef(node: HTMLElement, params: RefParams): { destroy(): void } {
  params.onRef?.(node);
  return { destroy: () => params.onRef?.(null) };
}

// Rendering an element somewhere else in the document, framework-free. `src/library/view/stores.ts`
// registers `bindPortal` as `portal` (Popover's tree binds it on its box when `portal` is set).

export interface PortalParams {
  /** Where the element goes; `document.body` when unset or empty. Read once, when it binds. */
  into?: () => Element | null | undefined;
}

/**
 * Moves `node` to the end of `into()` (else `document.body`) while bound, and puts it back where it
 * was on destroy (or removes it, if it had no parent). The renderer still owns the element: it keeps
 * updating its attributes and children wherever it is. Bind it on an element that is the only child
 * of an element of its own (Popover's `data-part="portal"` span), so neither renderer looks for it
 * among its old siblings while it is away.
 */
export function bindPortal(node: Element, initial: PortalParams): { update(params: PortalParams): void; destroy(): void } {
  const home = node.parentNode;
  const before = node.nextSibling;
  (initial.into?.() ?? document.body).appendChild(node);
  return {
    update: () => {},
    destroy: () => {
      if (home) home.insertBefore(node, before && before.parentNode === home ? before : null);
      else node.remove();
    },
  };
}

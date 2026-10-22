/**
 * Gate's field focus, framework-free: the field takes focus when it mounts, and again when a
 * submit ends (`busy` goes back to false), since the field was disabled while it ran and lost
 * focus. Registered as the `gateFocus` store (`src/library/view/stores.ts`); Gate's tree binds it
 * on its `<input>` by name and both renderers apply it.
 */

export interface GateFocusParams {
  /** True while a submit runs (the field is disabled then). */
  busy?: boolean;
}

/** Focuses `node` (the field) now, and whenever `busy` turns false. */
export function bindGateFocus(node: HTMLElement, initial: GateFocusParams): { update(params: GateFocusParams): void } {
  let busy = initial.busy ?? false;
  // The renderer may bind before the element is in the document; try again once it is.
  const focus = () => {
    node.focus();
    return node.ownerDocument.activeElement === node;
  };
  if (!focus()) queueMicrotask(focus);
  return {
    update(params) {
      const next = params.busy ?? false;
      if (busy && !next) queueMicrotask(focus);
      busy = next;
    },
  };
}

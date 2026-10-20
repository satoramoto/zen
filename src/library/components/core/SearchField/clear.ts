/**
 * SearchField's clear button, framework-free: a press never takes focus from the field (the
 * mousedown is cancelled), a click calls `onClear` and puts focus back in the field's `<input>`.
 * Registered as the `searchClear` store (`src/library/view/stores.ts`); SearchField's tree binds it
 * on the clear button by name and both renderers apply it.
 */

export interface SearchClearParams {
  /** Called when the button is clicked (SearchField asks for '' through `onInput`). */
  onClear?: () => void;
}

/** Listens on `node` (the clear button) for presses. */
export function bindSearchClear(node: HTMLElement, initial: SearchClearParams): { update(params: SearchClearParams): void; destroy(): void } {
  let params = initial;
  const hold = (event: MouseEvent) => event.preventDefault();
  const click = () => {
    // Found before `onClear`, since clearing takes the button (and its place in the field) away.
    const input = node.closest('.yh-search-field')?.querySelector('input');
    params.onClear?.();
    input?.focus();
  };
  node.addEventListener('mousedown', hold);
  node.addEventListener('click', click);
  return {
    update(next) {
      params = next;
    },
    destroy() {
      node.removeEventListener('mousedown', hold);
      node.removeEventListener('click', click);
    },
  };
}

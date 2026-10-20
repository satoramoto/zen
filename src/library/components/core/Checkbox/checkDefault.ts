/**
 * An uncontrolled checkbox's or radio's starting state, framework-free: on mount it sets the
 * input's `defaultChecked` and `checked` (and `indeterminate` for mixed), once, as React's
 * `defaultChecked` does; later params are ignored, so the user's clicks stand. A controlled input
 * carries `checked` / `indeterminate` in the tree's attrs instead. Registered as the `checkDefault`
 * store (`src/library/view/stores.ts`); Checkbox's and Radio's trees bind it on the input.
 */
export interface CheckDefaultParams {
  /** Starts checked. */
  checked: boolean;
  /** Starts mixed (`indeterminate`). */
  mixed: boolean;
}

/** A controlled checkbox's or radio's state, as the tree says it is. */
export interface CheckControlledParams {
  checked: boolean;
  /** Mixed (`indeterminate`); left alone when undefined (a radio). */
  indeterminate?: boolean;
}

/**
 * A controlled input stays what the tree says, as React's controlled inputs do: after any change
 * to it (or, for a radio, to another radio of its group, which unchecks it natively), once the
 * handlers and the re-render have run, `checked` and `indeterminate` go back to the latest params.
 * A parent that accepts the change has already sent the new params, so nothing moves; one that
 * rejects it gets its old state back, so a rejected radio never looks selected. Registered as the
 * `checkControlled` store; Checkbox's and Radio's trees bind it on a controlled input.
 */
export function bindCheckControlled(node: HTMLElement, initial: CheckControlledParams): { update(next: CheckControlledParams): void; destroy(): void } {
  const input = node as HTMLInputElement;
  let params = initial;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const restore = () => {
    timer = undefined;
    input.checked = params.checked;
    if (params.indeterminate !== undefined) input.indeterminate = params.indeterminate;
  };
  const onChange = (event: Event) => {
    const target = event.target;
    const ours = target === input || (input.type === 'radio' && target instanceof HTMLInputElement && target.type === 'radio' && input.name !== '' && target.name === input.name);
    if (!ours) return;
    clearTimeout(timer);
    timer = setTimeout(restore, 0);
  };
  const doc = input.ownerDocument;
  doc.addEventListener('change', onChange, true);
  return {
    update(next) {
      params = next;
    },
    destroy() {
      clearTimeout(timer);
      doc.removeEventListener('change', onChange, true);
    },
  };
}

/** Sets `node`'s (an `<input>`'s) starting state; only the first params count. */
export function bindCheckDefault(node: HTMLElement, params: CheckDefaultParams): { update(): void; destroy(): void } {
  const input = node as HTMLInputElement;
  input.defaultChecked = params.checked;
  input.checked = params.checked;
  if (params.mixed) input.indeterminate = true;
  return { update() {}, destroy() {} };
}

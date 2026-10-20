/**
 * The behaviour of a segmented radiogroup, framework-free: arrows move the choice by one (clamped,
 * never wrapping), handled keys are stopped so a surface underneath doesn't act on them, a click on
 * a member picks it, and focus follows the choice when it moves from inside the group. `node` is
 * the radiogroup; its members are the `[role="radio"]` inside it, in order. Registered as the
 * `segmented` store (`src/library/view/stores.ts`); `svelte.ts` exports it as the `segmented`
 * action (`actionOf`). Controlled: it asks through `onChange` and the choice moves when `index` does.
 */
export interface SegmentedParams {
  items: readonly string[];
  index: number;
  disabled?: boolean;
  onChange?: (next: number) => void;
}

export function bindSegmented(node: HTMLElement, initial: SegmentedParams) {
  let params = initial;
  let shown = initial.index;
  let moved = false;

  const move = (e: KeyboardEvent, by: number) => {
    e.preventDefault();
    e.stopPropagation();
    moved = true;
    params.onChange?.(Math.max(0, Math.min(params.items.length - 1, params.index + by)));
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (params.disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') move(e, 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') move(e, -1);
  };
  const onClick = (e: MouseEvent) => {
    if (params.disabled) return;
    const radio = e.target instanceof Element ? e.target.closest('[role="radio"]') : null;
    const at = radio ? [...node.querySelectorAll('[role="radio"]')].indexOf(radio) : -1;
    if (at >= 0) params.onChange?.(at);
  };

  node.addEventListener('keydown', onKeyDown);
  node.addEventListener('click', onClick);
  return {
    update(next: SegmentedParams) {
      params = next;
      if (params.index === shown) return;
      shown = params.index;
      if (!moved) return;
      moved = false;
      node.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    },
    destroy() {
      node.removeEventListener('keydown', onKeyDown);
      node.removeEventListener('click', onClick);
    },
  };
}

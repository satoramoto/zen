import type { SelectMenuParams } from '../../components/core/Select/selectInput';
import { bindPopup } from './Popup.input';

// The original select-only keyboard contract: clamped movement and repeated-letter typeahead.
export { bindSelect, type SelectParams, type SelectMenuParams } from '../../components/core/Select/selectInput';

export function bindSelectMenu(node: HTMLElement, initial: SelectMenuParams) {
  let params = initial;
  let alive = true;
  let shownActive = initial.active;
  const trigger = () => node.previousElementSibling as HTMLElement | null;
  const rows = () => [...node.querySelectorAll<HTMLElement>('[role="option"]')];
  const rowOf = (target: EventTarget | null) => {
    const row = target instanceof Element ? target.closest<HTMLElement>('[role="option"]') : null;
    return row && node.contains(row) ? rows().indexOf(row) : -1;
  };
  const close = (restore: boolean) => {
    params.onState?.({ open: false, active: params.active });
    if (restore) trigger()?.focus();
  };
  const reveal = () => { if (alive) node.querySelector<HTMLElement>('[data-active]')?.scrollIntoView?.({ block: 'nearest' }); };
  const popup = bindPopup(node, { onDismiss: how => close(how === 'escape') });
  const rowDown = (e: PointerEvent) => {
    if (rowOf(e.target) < 0) return;
    e.preventDefault();
    e.stopPropagation();
  };
  const rowOver = (e: PointerEvent) => {
    const which = rowOf(e.target);
    if (which >= 0 && which !== params.active) params.onState?.({ open: true, active: which });
  };
  const rowClick = (e: MouseEvent) => {
    const which = rowOf(e.target);
    if (which < 0) return;
    close(true);
    if (which !== params.index && which < params.items.length) params.onChange?.(which);
  };
  node.addEventListener('pointerdown', rowDown);
  node.addEventListener('pointerover', rowOver);
  node.addEventListener('click', rowClick);
  reveal();
  queueMicrotask(reveal);
  return {
    update(next: SelectMenuParams) {
      params = next;
      if (params.active !== shownActive) { shownActive = params.active; queueMicrotask(reveal); }
    },
    destroy() {
      alive = false;
      popup.destroy();
      node.removeEventListener('pointerdown', rowDown);
      node.removeEventListener('pointerover', rowOver);
      node.removeEventListener('click', rowClick);
    },
  };
}

import type { TransportUnit } from './Transport.model';

export interface TransportPositionParams {
  remember?: string;
  onUnit?(unit: TransportUnit): void;
}

/** Position's mount-local preference. Rendering stays in the shared model, including its labels.
 * The root outlives the optional beat button, so removing/readding `bar` keeps the chosen unit. */
export function bindTransportPosition(node: HTMLElement, initial: TransportPositionParams) {
  let params = initial;
  let unit: TransportUnit = 'beats';
  if (params.remember) {
    try { unit = localStorage.getItem(params.remember) === 'seconds' ? 'seconds' : 'beats'; } catch { /* Preferences may be unavailable. */ }
  }
  params.onUnit?.(unit);
  function click(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest('button.wdg-transport-position');
    if (!button || button.parentElement !== node) return;
    unit = unit === 'beats' ? 'seconds' : 'beats';
    params.onUnit?.(unit);
    if (params.remember) {
      try { localStorage.setItem(params.remember, unit); } catch { /* Still usable without saving. */ }
    }
  }
  node.addEventListener('click', click);
  return {
    // Match the source useState: a changed key affects later writes, not the held choice.
    update(next: TransportPositionParams) { params = next; },
    destroy() { node.removeEventListener('click', click); },
  };
}

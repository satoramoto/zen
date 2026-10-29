/** One held input, cancelled exactly once on capture/focus loss, disable or unmount. */
export interface MomentaryParams {
  disabled?: boolean;
  onHold?(held: boolean): void;
  onTakeover?(): void;
}

export function bindMomentary(node: HTMLElement, initial: MomentaryParams) {
  let params = initial;
  let input: string | null = null;
  let pointer: number | null = null;
  let down = false;
  const release = () => {
    if (!down) return;
    down = false;
    input = null;
    const captured = pointer;
    pointer = null;
    params.onHold?.(false);
    if (captured !== null && node.hasPointerCapture?.(captured)) node.releasePointerCapture?.(captured);
  };
  const pointerDown = (e: PointerEvent) => {
    if (params.disabled || e.button !== 0 || down) return;
    e.preventDefault();
    node.focus();
    input = 'pointer';
    pointer = e.pointerId;
    down = true;
    try { node.setPointerCapture?.(e.pointerId); } catch { /* A synthetic pointer has no capture. */ }
    params.onHold?.(true);
  };
  const pointerEnd = (e: PointerEvent) => { if (input === 'pointer' && (e.pointerId === undefined || pointer === e.pointerId)) release(); };
  const blur = () => { if (input !== 'pointer') release(); };
  const keyDown = (e: KeyboardEvent) => {
    if (params.disabled) return;
    if (e.key === 'Enter' && down) {
      e.preventDefault();
      if (!e.repeat) params.onTakeover?.();
    } else if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && !down) {
      e.preventDefault();
      input = e.key;
      down = true;
      params.onHold?.(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      release();
    } else if ((e.key === ' ' || e.key === 'Enter') && e.repeat) e.preventDefault();
  };
  const keyUp = (e: KeyboardEvent) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (e.key === input) release();
  };
  const click = (e: MouseEvent) => {
    if (!params.disabled && e.detail === 0 && !down) { params.onHold?.(true); params.onHold?.(false); }
  };
  node.addEventListener('pointerdown', pointerDown);
  node.addEventListener('pointerup', pointerEnd);
  node.addEventListener('pointercancel', pointerEnd);
  node.addEventListener('lostpointercapture', pointerEnd);
  node.addEventListener('blur', blur);
  node.addEventListener('keydown', keyDown);
  node.addEventListener('keyup', keyUp);
  node.addEventListener('click', click);
  window.addEventListener('blur', release);
  return {
    update(next: MomentaryParams) { params = next; if (params.disabled) release(); },
    destroy() {
      node.removeEventListener('pointerdown', pointerDown);
      node.removeEventListener('pointerup', pointerEnd);
      node.removeEventListener('pointercancel', pointerEnd);
      node.removeEventListener('lostpointercapture', pointerEnd);
      node.removeEventListener('blur', blur);
      node.removeEventListener('keydown', keyDown);
      node.removeEventListener('keyup', keyUp);
      node.removeEventListener('click', click);
      window.removeEventListener('blur', release);
      release();
    },
  };
}

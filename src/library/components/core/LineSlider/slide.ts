/**
 * The line slider's behaviour, framework-free: controlled (asks through `onchange`), clamped and
 * snapped to the step; arrows one step, Page Up / Page Down ten, Home and End; a primary-button
 * drag with pointer capture maps the pointer onto the track (the `[data-part="track"]` inside the
 * node); disabled stays focusable and asks nothing. `useLineSlider` (React) and the `lineSlider`
 * action (`slide.svelte.ts`) both wrap `bindLineSlider`; neither holds any of this logic.
 */
import { LINE_SLIDER_DEFAULTS, snap } from './LineSlider.model';

export interface LineSliderParams {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** Called with the value asked for, only when it differs from `value`. */
  onchange?: (value: number) => void;
  /** Called with `true` when a drag starts and `false` when it ends: the `held` the view draws. */
  onheld?: (held: boolean) => void;
}

/** A bound slider: `params` changed, or unbound. */
export interface LineSliderBinding {
  update(params: LineSliderParams): void;
  destroy(): void;
}

/** Listens on `node` (the slider element) for keys and drags. */
export function bindLineSlider(node: HTMLElement, initial: LineSliderParams): LineSliderBinding {
  let params = initial;
  let dragging: number | null = null;
  const range = () => ({
    min: params.min ?? LINE_SLIDER_DEFAULTS.min,
    max: params.max ?? LINE_SLIDER_DEFAULTS.max,
    step: params.step ?? LINE_SLIDER_DEFAULTS.step,
  });

  function ask(v: number) {
    if (params.disabled) return;
    const { min, max, step } = range();
    const next = snap(v, min, max, step);
    if (next !== params.value) params.onchange?.(next);
  }

  function fromPointer(clientX: number) {
    const box = (node.querySelector('[data-part="track"]') ?? node).getBoundingClientRect();
    if (!box || box.width <= 0) return;
    const { min, max } = range();
    ask(min + ((clientX - box.left) / box.width) * (max - min));
  }

  function release() {
    if (dragging === null) return;
    dragging = null;
    params.onheld?.(false);
  }

  function onPointerDown(event: PointerEvent) {
    if (params.disabled || event.button !== 0) return;
    dragging = event.pointerId;
    params.onheld?.(true);
    try {
      node.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
    fromPointer(event.clientX);
  }

  function onPointerMove(event: PointerEvent) {
    if (dragging !== null && dragging === event.pointerId) fromPointer(event.clientX);
  }

  function onPointerEnd(event: PointerEvent) {
    if (dragging === event.pointerId) release();
  }

  function onKeyDown(event: KeyboardEvent) {
    const { value } = params;
    const { min, max, step } = range();
    const moves: Record<string, number> = {
      ArrowRight: value + step,
      ArrowUp: value + step,
      ArrowLeft: value - step,
      ArrowDown: value - step,
      PageUp: value + step * 10,
      PageDown: value - step * 10,
      Home: min,
      End: max,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    ask(moves[event.key]);
  }

  node.addEventListener('pointerdown', onPointerDown);
  node.addEventListener('pointermove', onPointerMove);
  node.addEventListener('pointerup', onPointerEnd);
  node.addEventListener('pointercancel', onPointerEnd);
  node.addEventListener('keydown', onKeyDown);
  return {
    update(next) {
      params = next;
    },
    destroy() {
      dragging = null;
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerEnd);
      node.removeEventListener('pointercancel', onPointerEnd);
      node.removeEventListener('keydown', onKeyDown);
    },
  };
}

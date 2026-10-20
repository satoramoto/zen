/**
 * The knob's input, framework-free: a drag turns it relative to where it is (a step every 4px up or
 * right, 16px with Shift), ↑ → / ↓ ← and the wheel step it (a trackpad's small deltas adding up to
 * one notch), and a click that didn't turn it is a press, as are Space and Enter. It also applies
 * the app's tooltip action. Registered as the `knob` store (`src/library/view/stores.ts`): Knob's
 * tree binds it by name and both renderers apply it; neither holds any of this logic.
 */
import { DRAG_PX, FINE_PX, WHEEL_PX, wheelPx } from './geometry';

/** The app's tooltip hook: given the node and its tip key, it may return an updater and a teardown. */
export type TipAction = (
  node: HTMLElement,
  key: string,
) => { update?: (key: string) => void; destroy?: () => void } | void;

export interface KnobParams {
  /** Nothing is mapped: no turning (a press still fires, as the original's). */
  unused?: boolean;
  /** The tooltip key, applied with `tipAction` when both are set. */
  tip?: string;
  tipAction?: TipAction;
  /** A click that didn't turn the knob, Space or Enter. */
  onpress?: () => void;
  /** Steps turned (positive: clockwise). */
  onstep?: (delta: number) => void;
}

/** A bound knob: `params` changed (the tooltip is reapplied if its key or action did), or unbound. */
export interface KnobBinding {
  update(params: KnobParams): void;
  destroy(): void;
}

/** The knob's own attributes on its button: a button, its spoken name, and "knob". */
export function knobRootAttrs(name: string): { type: 'button'; 'aria-label': string; 'aria-roledescription': string } {
  return { type: 'button', 'aria-label': name, 'aria-roledescription': 'knob' };
}

const KEY_STEP: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 };

/** Listens on `node` (the knob's button) for drags, keys, the wheel and clicks. Params are read at
 *  each event, so the latest callbacks are the ones called. */
export function bindKnob(node: HTMLElement, initial: KnobParams): KnobBinding {
  let params = initial;
  let drag: { id: number; x: number; y: number; acc: number } | null = null;
  /** This press turned the knob: its click isn't also a press. */
  let turned = false;
  let wheelAcc = 0;

  let tipApplied: { key: string; action: TipAction; handle: ReturnType<TipAction> } | null = null;
  function applyTip() {
    const { tip, tipAction } = params;
    if (tipApplied && tipApplied.key === tip && tipApplied.action === tipAction) return;
    tipApplied?.handle?.destroy?.();
    tipApplied = null;
    if (!tipAction || tip === undefined) return;
    tipApplied = { key: tip, action: tipAction, handle: tipAction(node, tip) };
  }

  // Non-passive, to keep the page from scrolling under the knob.
  function onWheel(event: WheelEvent) {
    if (params.unused || event.deltaY === 0) return;
    event.preventDefault();
    const px = wheelPx(event.deltaY, event.deltaMode);
    if (Math.sign(px) !== Math.sign(wheelAcc)) wheelAcc = 0;
    wheelAcc += px;
    if (Math.abs(wheelAcc) < WHEEL_PX) return;
    wheelAcc = 0;
    params.onstep?.(px < 0 ? 1 : -1);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (params.unused) return;
    const step = KEY_STEP[event.key] ?? 0;
    if (step === 0) return;
    event.preventDefault();
    params.onstep?.(step);
  }

  function onPointerDown(event: PointerEvent) {
    turned = false;
    if (params.unused || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, acc: 0 };
    try {
      node.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
  }

  function onPointerMove(event: PointerEvent) {
    const d = drag;
    if (!d || d.id !== event.pointerId) return;
    // Up or right is clockwise.
    d.acc += (d.y - event.clientY + (event.clientX - d.x)) / (event.shiftKey ? FINE_PX : DRAG_PX);
    d.x = event.clientX;
    d.y = event.clientY;
    const steps = Math.trunc(d.acc);
    if (steps === 0) return;
    d.acc -= steps;
    turned = true;
    params.onstep?.(steps);
  }

  function onPointerEnd(event: PointerEvent) {
    if (drag?.id === event.pointerId) drag = null;
  }

  function onClick(event: MouseEvent) {
    // A drag isn't a press; Enter / Space (detail 0) always are.
    if (turned && event.detail > 0) {
      turned = false;
      return;
    }
    params.onpress?.();
  }

  node.addEventListener('wheel', onWheel, { passive: false });
  node.addEventListener('keydown', onKeyDown);
  node.addEventListener('pointerdown', onPointerDown);
  node.addEventListener('pointermove', onPointerMove);
  node.addEventListener('pointerup', onPointerEnd);
  node.addEventListener('pointercancel', onPointerEnd);
  node.addEventListener('click', onClick);
  applyTip();

  return {
    update(next) {
      params = next;
      applyTip();
    },
    destroy() {
      tipApplied?.handle?.destroy?.();
      tipApplied = null;
      node.removeEventListener('wheel', onWheel);
      node.removeEventListener('keydown', onKeyDown);
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerEnd);
      node.removeEventListener('pointercancel', onPointerEnd);
      node.removeEventListener('click', onClick);
    },
  };
}

/** The source parameter gesture, shared by every continuous Music control and both renderers. */
import { clamp, fractionOf, quantize, stepSize, valueAt, type Param } from '../param/param';
import { format } from '../param/format';
import { isFine } from './platform';

export type ParamAxis = 'vertical' | 'horizontal';
export type ParamAnchor = 'value' | 'pointer';
export interface ParamGestureOptions {
  param: Param;
  value: number;
  depth?: number;
  onDepth?(next: number): void;
  onChange(next: number): void;
  onRelease?(): void;
  disabled?: boolean;
  axis?: ParamAxis;
  anchor?: ParamAnchor;
  travel?: number | 'element';
  label?: string;
  display?: string;
}
export interface ParamGestureParams extends ParamGestureOptions {
  /** NumberField alone opens the editor; otherwise keys belong to the gesture. */
  typeable?: boolean;
  onEdit?(text: string): void;
  /** Knob suppresses a pointer-induced focus ring, never a keyboard one. */
  pointerFocus?: boolean;
}

/** Static accessibility is model data; only drag/focus state is written by the store. */
export function paramSurface(options: ParamGestureOptions): Record<string, string | undefined> {
  const { param, value, label, display, axis = 'vertical', disabled = false } = options;
  return {
    role: 'slider', tabindex: disabled ? '-1' : '0', 'aria-label': label,
    'aria-valuemin': String(param.min), 'aria-valuemax': String(param.max),
    'aria-valuenow': String(value), 'aria-valuetext': display ?? format(param, value),
    'aria-orientation': axis, 'aria-disabled': disabled ? 'true' : undefined,
  };
}

interface Drag {
  id: number;
  x: number;
  y: number;
  ox: number;
  oy: number;
  fraction: number;
  depth: number;
  scale: number;
  extent: number;
  from: number;
  fromDepth: number;
}

export function bindParamGesture(node: HTMLElement, initial: ParamGestureParams) {
  let params = initial;
  let drag: Drag | null = null;
  let wandered = false;
  let pending: number | null = null;
  let frame: number | null = null;
  let sent = Number.NaN;
  // Bridge rapid keys before a controlled host's next render, without masking host updates.
  let keyed: { given: number; sent: number } | null = null;
  const clock = node.ownerDocument.defaultView!;

  function flush() {
    frame = null;
    const next = pending;
    pending = null;
    if (next !== null) params.onChange(next);
  }
  function emit(next: number) {
    if (next === sent) return;
    sent = next;
    pending = next;
    if (frame === null) frame = clock.requestAnimationFrame(flush);
  }
  function settle() {
    if (frame !== null) { clock.cancelAnimationFrame(frame); flush(); }
    params.onRelease?.();
  }
  function release(id: number) {
    try { if (node.hasPointerCapture(id)) node.releasePointerCapture(id); } catch { /* Synthetic pointer. */ }
  }
  function finish() {
    if (drag === null) return;
    const id = drag.id;
    drag = null;
    node.removeAttribute('data-dragging');
    release(id);
    settle();
  }
  function onPointerDown(e: PointerEvent) {
    if (params.disabled || e.button !== 0 || drag !== null) return;
    e.preventDefault();
    if (params.pointerFocus) node.setAttribute('data-pointer-focus', '');
    node.focus();
    try { node.setPointerCapture(e.pointerId); } catch { /* Synthetic pointer. */ }
    sent = params.value;
    keyed = null;
    const box = node.getBoundingClientRect();
    const scale = node.offsetWidth > 0 ? box.width / node.offsetWidth : 1;
    const axis = params.axis ?? 'vertical';
    let fraction = fractionOf(params.param, params.value);
    if (params.anchor === 'pointer') {
      fraction = Math.max(0, Math.min(1, axis === 'vertical' ? (box.bottom - e.clientY) / (box.height || 1) : (e.clientX - box.left) / (box.width || 1)));
      emit(valueAt(params.param, fraction));
    }
    wandered = false;
    drag = {
      id: e.pointerId, x: e.clientX, y: e.clientY, ox: e.clientX, oy: e.clientY,
      fraction, depth: params.depth ?? 1, scale: scale > 0 ? scale : 1,
      extent: Math.max(1, axis === 'vertical' ? node.offsetHeight : node.offsetWidth),
      from: params.value, fromDepth: params.depth ?? 1,
    };
    node.setAttribute('data-dragging', '');
  }
  function onPointerMove(e: PointerEvent) {
    const held = drag;
    if (held === null || held.id !== e.pointerId) return;
    const shift = (params.axis ?? 'vertical') === 'vertical' ? held.y - e.clientY : e.clientX - held.x;
    if (Math.abs(e.clientX - held.ox) > 3 || Math.abs(e.clientY - held.oy) > 3) wandered = true;
    const moved = shift / held.scale;
    held.x = e.clientX;
    held.y = e.clientY;
    const travel = params.travel ?? 200;
    const reach = (travel === 'element' ? held.extent : travel) * (isFine(e) ? 10 : 1);
    if (e.shiftKey && params.onDepth) {
      held.depth = Math.max(-1, Math.min(1, held.depth + moved / (reach * 1.5)));
      params.onDepth(held.depth);
      return;
    }
    held.fraction = Math.max(0, Math.min(1, held.fraction + moved / reach));
    emit(valueAt(params.param, held.fraction));
  }
  function onPointerEnd(e: PointerEvent) { if (drag?.id === e.pointerId) finish(); }
  function abandon() {
    const held = drag;
    if (held === null) return;
    if (params.onDepth && held.fromDepth !== held.depth) params.onDepth(held.fromDepth);
    sent = Number.NaN;
    emit(quantize(params.param, held.from));
    finish();
  }
  function onDoubleClick(e: MouseEvent) {
    if (params.disabled || wandered) return;
    keyed = null;
    if (e.shiftKey && params.onDepth) params.onDepth(0);
    else emit(quantize(params.param, params.param.defaultValue));
    if (drag !== null) finish(); else settle();
  }
  function onKeyDown(e: KeyboardEvent) {
    node.removeAttribute('data-pointer-focus');
    if (params.disabled) return;
    if (params.typeable && (e.key === 'Enter' || /^[-+.0-9]$/.test(e.key))) {
      e.preventDefault(); e.stopPropagation();
      if (drag !== null) finish();
      params.onEdit?.(e.key === 'Enter' ? '' : e.key);
      return;
    }
    if (e.key === 'Escape') {
      if (drag === null) return;
      e.preventDefault(); e.stopPropagation(); abandon(); return;
    }
    const step = stepSize(params.param, isFine(e));
    const from = keyed !== null && keyed.given === params.value ? keyed.sent : params.value;
    let next: number;
    switch (e.key) {
      case 'ArrowUp': case 'ArrowRight': next = from + step; break;
      case 'ArrowDown': case 'ArrowLeft': next = from - step; break;
      case 'PageUp': next = from + step * 10; break;
      case 'PageDown': next = from - step * 10; break;
      case 'Home': next = params.param.min; break;
      case 'End': next = params.param.max; break;
      default: return;
    }
    e.preventDefault(); e.stopPropagation();
    if (frame !== null) clock.cancelAnimationFrame(frame);
    frame = null; pending = null;
    if (drag !== null) {
      const id = drag.id; drag = null; node.removeAttribute('data-dragging'); release(id);
    }
    sent = quantize(params.param, clamp(params.param, next));
    keyed = { given: params.value, sent };
    // Commit before release, so controlled hosts never release ahead of a queued key write.
    params.onChange(sent);
    params.onRelease?.();
  }
  const onBlur = () => node.removeAttribute('data-pointer-focus');
  const listeners = { pointerdown: onPointerDown, pointermove: onPointerMove, pointerup: onPointerEnd, pointercancel: onPointerEnd, lostpointercapture: onPointerEnd, dblclick: onDoubleClick, keydown: onKeyDown, blur: onBlur };
  for (const [name, handler] of Object.entries(listeners)) node.addEventListener(name, handler as EventListener);
  return {
    update(next: ParamGestureParams) {
      params = next;
      if (keyed !== null && keyed.given !== params.value) keyed = null;
      if (params.disabled && drag !== null) finish();
    },
    destroy() {
      if (frame !== null) clock.cancelAnimationFrame(frame);
      frame = null; pending = null;
      const id = drag?.id;
      drag = null;
      if (id !== undefined) release(id);
      node.removeAttribute('data-dragging'); node.removeAttribute('data-pointer-focus');
      for (const [name, handler] of Object.entries(listeners)) node.removeEventListener(name, handler as EventListener);
    },
  };
}

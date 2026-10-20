import { useEffect, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { fractionOf } from './param';
import { gestureText, paramGesture, type ParamAxis, type ParamGestureParams } from './paramGesture';

// The gesture itself is framework-free (`paramGesture.ts`, the `paramGesture` store); this is its
// React wrapper for a control that still spreads props rather than drawing a view tree (NumberField).
export {
  isFine,
  FINE_KEY,
  stepDetent,
  snapToDetent,
  type ParamAxis,
  type ParamAnchor,
  type ParamKey,
  type ParamKeyStep,
} from './paramGesture';

export interface ParamGestureOptions extends ParamGestureParams {
  label?: string;
  /** Authoritative text, when something else is spelling the value. */
  display?: string;
}

export interface ParamSurfaceProps {
  role: 'slider';
  tabIndex: number;
  'aria-label': string | undefined;
  'aria-valuemin': number;
  'aria-valuemax': number;
  /** Left out while `mixed`. */
  'aria-valuenow': number | undefined;
  'aria-valuetext': string;
  'aria-orientation': ParamAxis;
  'aria-disabled': true | undefined;
  'data-dragging': '' | undefined;
  onPointerDown(e: PointerEvent<HTMLElement>): void;
  onPointerMove(e: PointerEvent<HTMLElement>): void;
  onPointerUp(e: PointerEvent<HTMLElement>): void;
  onPointerCancel(e: PointerEvent<HTMLElement>): void;
  onLostPointerCapture(e: PointerEvent<HTMLElement>): void;
  onDoubleClick(e: MouseEvent<HTMLElement>): void;
  onKeyDown(e: KeyboardEvent<HTMLElement>): void;
}

export interface ParamGesture {
  dragging: boolean;
  /** Where the value sits on the control, 0 to 1, tapered. */
  fraction: number;
  /** What to print: the authoritative text if there is one, else our own. */
  text: string;
  props: ParamSurfaceProps;
}

/**
 * The Param gesture (`paramGesture.ts`) as React props for the control's surface. A thin wrapper:
 * one gesture per mounted control, given each render's options; the drag's `dragging` comes back as
 * state. Follow-up: drop it once NumberField draws a view tree and binds the `paramGesture` store.
 */
export function useParamGesture(options: ParamGestureOptions): ParamGesture {
  const { param, value, disabled = false, axis = 'vertical', label, display, mixed = false } = options;
  const [dragging, setDragging] = useState(false);
  const [gesture] = useState(() => paramGesture(options, setDragging));
  // Every render's options, read when the gesture next acts (and a key's record goes stale here).
  gesture.update(options);
  useEffect(() => () => gesture.cancel(), [gesture]);

  const text = gestureText(param, value, display, mixed);
  return {
    dragging,
    fraction: fractionOf(param, value),
    text,
    props: {
      role: 'slider',
      tabIndex: disabled ? -1 : 0,
      'aria-label': label,
      'aria-valuemin': param.min,
      'aria-valuemax': param.max,
      'aria-valuenow': mixed ? undefined : value,
      'aria-valuetext': text,
      'aria-orientation': axis,
      'aria-disabled': disabled || undefined,
      'data-dragging': dragging ? '' : undefined,
      onPointerDown: (e) => gesture.pointerDown(e, e.currentTarget),
      onPointerMove: (e) => gesture.pointerMove(e),
      onPointerUp: (e) => gesture.pointerUp(e),
      onPointerCancel: (e) => gesture.pointerUp(e),
      onLostPointerCapture: (e) => gesture.pointerUp(e),
      onDoubleClick: (e) => gesture.doubleClick(e),
      onKeyDown: (e) => gesture.keyDown(e, e.currentTarget),
    },
  };
}

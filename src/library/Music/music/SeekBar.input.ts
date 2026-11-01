import { bindParamGesture, type ParamGestureParams } from '../gesture/paramGesture';

export interface SeekParams {
  duration: number;
  position: number;
  disabled: boolean;
  onSeek(seconds: number): void;
}
/** Owns only a transient drag preview, never a playback clock or pending engine state. */
export function bindSeekBar(node: HTMLElement, initial: SeekParams) {
  let params = initial;
  let target: number | null = null;
  let duration = params.duration;
  function paint(value: number) {
    const safe = Math.max(0, Math.min(params.duration, value));
    node.style.setProperty('--wdg-seek-position', String(params.duration > 0 ? safe / params.duration : 0));
    node.setAttribute('aria-valuenow', String(safe));
    node.setAttribute('aria-valuetext', `${safe.toFixed(1)} of ${params.duration.toFixed(1)} seconds`);
  }
  function options(): ParamGestureParams {
    return {
      param: { kind: 'float', min: 0, max: params.duration, defaultValue: 0 },
      value: params.position, disabled: params.disabled, axis: 'horizontal', anchor: 'pointer',
      travel: 'element', keyStep: 1, cancelBehavior: 'discard', resetOnDoubleClick: false,
      onChange(value) {
        if (params.disabled) return;
        const safe = Math.max(0, Math.min(params.duration, value));
        if (node.hasAttribute('data-dragging')) { target = safe; paint(safe); }
        params.onSeek(safe);
      },
      onRelease() { target = null; paint(params.position); },
    };
  }
  const gesture = bindParamGesture(node, options());
  paint(params.position);
  return {
    update(next: SeekParams) {
      params = next;
      // A changed time domain cancels rather than reinterpreting an active drag.
      if (duration !== params.duration) {
        gesture.update({ ...options(), disabled: true });
        duration = params.duration;
        target = null;
      }
      gesture.update(options());
      paint(target ?? params.position);
    },
    destroy() { gesture.destroy(); },
  };
}

import { h, wire, type Handlers } from '../../../foundation/view/Tree.model';

export interface SeekBarProps {
  /** Seconds. Invalid or nonpositive durations disable seeking. */
  duration: number;
  /** Host readback in seconds, not the last requested position. */
  position: number;
  label: string;
  disabled?: boolean;
  onSeek(seconds: number): void;
}
export function seekRange(props: SeekBarProps) {
  const duration = Number.isFinite(props.duration) && props.duration > 0 ? props.duration : 0;
  const position = Number.isFinite(props.position) ? Math.max(0, Math.min(duration, props.position)) : 0;
  return { duration, position, disabled: Boolean(props.disabled) || duration === 0 };
}
export function seekBarView(props: SeekBarProps) {
  const { disabled, duration } = seekRange(props);
  return wire(h('div', {
    class: 'wdg wdg-seek', role: 'slider', tabindex: disabled ? '-1' : '0',
    'aria-label': props.label, 'aria-orientation': 'horizontal',
    'aria-valuemin': '0', 'aria-valuemax': String(duration), 'aria-disabled': String(disabled),
  }, h('span', { class: 'wdg-seek-fill', 'aria-hidden': 'true' }),
  h('span', { class: 'wdg-seek-thumb', 'aria-hidden': 'true' })), {
    bind: [['musicSeekBar', { ...seekRange(props), label: props.label, onSeek: 'seek' }]],
  });
}
export function seekBarHandlers(props: SeekBarProps): Handlers { return { seek: props.onSeek }; }

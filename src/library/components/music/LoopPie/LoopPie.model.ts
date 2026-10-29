// LoopPie's model: a loop's phase as a wedge, and the tree both renderers draw. No framework:
// `LoopPie.tsx` (React) and `LoopPie.svelte` (Svelte) both pass `loopPieView` to their `Tree`.
// The pie holds no state and names no handlers: it is read, not played. Set's TrackStatus is the
// behaviour reference (the wedge swept clockwise from twelve o'clock); the bar count while
// recording is this widget's own middle reading.
import type { HueSlot } from '../../core/hue';
import { textView } from '../../../primitives/Text.model';
import { h, type Handlers, type Node } from '../../../view/Tree.model';
import type { LoopPieForm } from './LoopPie.forms';

const PIE = 10;
const R = PIE / 2;

/** The wedge for one loop phase, swept clockwise from twelve o'clock (set's TrackStatus). */
export function loopWedge(phase: number): string {
  const clamped = Math.max(0, Math.min(1, phase));
  const angle = clamped * 2 * Math.PI;
  const x = R + R * Math.sin(angle);
  const y = R - R * Math.cos(angle);
  const largeArc = clamped > 0.5 ? 1 : 0;
  return `M ${R} ${R} L ${R} 0 A ${R} ${R} 0 ${largeArc} 1 ${x} ${y} Z`;
}

/** Every LoopPie prop (the pie has no framework children). */
export interface LoopPieModelProps {
  /** 0–1 through the loop: the wedge. */
  phase: number;
  /** Bars captured so far: shown in the middle while `recording`. */
  bars?: number;
  /** Recording: the middle reads the bar count instead of the label. */
  recording?: boolean;
  /** The loop's categorical hue slot. What it means is the app's. */
  hue?: HueSlot;
  /** A middle reading when not recording (`'4'`, the loop's bars). */
  label?: string;
  /** Shown, dimmed, deaf: the empty/recording pipeline draws it but it means nothing yet. */
  disabled?: boolean;
  /** Classes added to the root, after the pie's own. */
  className?: string;
}

/** Clamp a phase to the 0–1 the wedge draws. */
export const clampPhase = (phase: number): number => Math.max(0, Math.min(1, phase));

/**
 * The tree LoopPie draws: the root (its form as `data-form`, its hue as `data-hue`) holding an
 * SVG ring and wedge plus the middle reading. A full turn draws as a disc, since a closed arc is
 * the same shape as a standstill. The accessible name is the phase as a percentage, or the
 * recording length while recording.
 */
export function loopPieView({ phase, bars, recording, hue, label, disabled, className }: LoopPieModelProps, form: LoopPieForm): Node {
  const at = clampPhase(phase);
  const full = at >= 1;
  const middle = textView({ role: 'numeral', tabular: true, tone: disabled ? 'muted' : undefined, className: 'yh-looppie__middle' });
  const name = recording && bars !== undefined ? `recording, bar ${bars}` : `${Math.round(at * 100)} percent through the loop`;
  const reading = recording && bars !== undefined ? String(bars) : !recording && label !== undefined ? label : null;
  return h(
    'div',
    {
      class: `yh-looppie${className ? ` ${className}` : ''}`,
      'data-part': 'root',
      'data-form': form,
      'data-hue': hue === undefined ? undefined : String(hue),
      'data-recording': recording ? 'true' : undefined,
      'data-disabled': disabled ? 'true' : undefined,
      role: 'img',
      'aria-label': name,
    },
    h(
      'svg',
      { class: 'yh-looppie__svg', viewBox: `0 0 ${PIE} ${PIE}`, 'aria-hidden': 'true' },
      h('circle', { class: 'yh-looppie__track', cx: String(R), cy: String(R), r: String(R - 0.5) }),
      full
        ? h('circle', { class: 'yh-looppie__wedge', cx: String(R), cy: String(R), r: String(R) })
        : at <= 0
          ? null
          : h('path', { class: 'yh-looppie__wedge', d: loopWedge(at) }),
    ),
    reading === null ? null : h('span', { class: middle.className, ...middle.attrs, 'data-part': 'middle' }, reading),
  );
}

/** LoopPie names no handlers: there is nothing to press. */
export function loopPieHandlers(): Handlers {
  return {};
}

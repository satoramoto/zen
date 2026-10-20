// Meter's model: its props and the tree both renderers draw from them (classes, `data-*`, ARIA, the
// inline custom properties and the reading). No framework: `Meter.tsx` (React) and `Meter.svelte`
// (Svelte) both pass `meterView` to their `Tree`. Read-only: it binds no store and names no handler.
import { textView } from '../../../primitives/Text.model';
import { h, styleText, type Node } from '../../../view/Tree.model';

/** Caption above the meter, beside it, or laid over a horizontal bar. */
export type MeterLayout = 'stacked' | 'inline' | 'inside';
/** Which side of the meter the caption and reading sit on, laid inline. */
export type MeterSide = 'left' | 'right';

/** `live.meter~`: a level, read-only. Mirrors `@openflow/widgets` Meter. */
export interface MeterModelProps {
  /** 0–1. Clamped, because a meter that overshoots its own box is a bug you see. */
  value: number;
  /** 0–1. A hold, drawn as a line across the fill. */
  peak?: number;
  orientation?: 'horizontal' | 'vertical';
  /** Authoritative text to show when `showValue` is on. Default: the level as 0–100. */
  display?: string;
  /** Show the reading. Default off. */
  showValue?: boolean;
  /** In px, across the bar. */
  width?: number;
  /** In px, along it. */
  length?: number;
  /** The printed caption. */
  name?: string;
  /** For assistive technology. Defaults to the caption. */
  label?: string;
  layout?: MeterLayout;
  side?: MeterSide;
  className?: string;
  title?: string;
  /** A sentence for the window's hint strip, on the root as `data-hint`. Falls back to `title`. */
  hint?: string;
  /** The colour the level is lit in (any CSS colour, usually a `var()`). Default `--accent`. */
  ink?: string;
}

/** Clamped to 0–1; a non-finite value reads 0. */
export const unit = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

/**
 * The tree Meter draws: the root (its `--lib-meter-*` custom properties inline), the caption Text,
 * the frame around the channel (a `well` Surface's class and data, `role="meter"`) with the lit
 * level and the peak line, and the reading Text.
 */
export function meterView({
  value,
  peak,
  orientation = 'horizontal',
  name,
  label,
  layout = 'stacked',
  side = 'left',
  display,
  showValue = false,
  width,
  length,
  className,
  title,
  hint,
  ink,
}: MeterModelProps): Node {
  const level = unit(value);
  const held = peak === undefined ? undefined : unit(peak);
  const caption = textView({ role: 'body', size: 'caption', case: 'label', className: 'lib-meter__caption' });
  const readout = textView({ role: 'numeral', size: 'label', className: 'lib-meter__readout' });
  return h(
    'div',
    {
      class: `lib-meter${className ? ` ${className}` : ''}`,
      'data-orientation': orientation,
      'data-layout': layout,
      'data-side': layout === 'inline' ? side : undefined,
      'data-hint': hint,
      style: styleText({
        '--lib-meter-fill': String(level),
        '--lib-meter-peak': held === undefined ? undefined : String(held),
        '--lib-meter-thickness': width === undefined ? undefined : `${width}px`,
        '--lib-meter-length': length === undefined ? undefined : `${length}px`,
        '--lib-meter-ink': ink,
      }),
    },
    name ? h('span', { class: caption.className, ...caption.attrs, 'data-part': 'caption' }, name) : null,
    h(
      'div',
      { class: 'lib-meter__frame', title },
      h(
        'div',
        {
          class: 'lib-surface lib-meter__channel',
          'data-material': 'well',
          'data-radius': 'pill',
          'data-part': 'channel',
          role: 'meter',
          'aria-valuenow': String(Math.round(level * 100)),
          'aria-valuemin': '0',
          'aria-valuemax': '100',
          'aria-label': label ?? name,
        },
        h('i', { class: 'lib-meter__level', 'data-part': 'level' }),
        held !== undefined ? h('i', { class: 'lib-meter__hold', 'data-part': 'hold' }) : null,
      ),
    ),
    showValue
      ? h('span', { class: readout.className, ...readout.attrs, 'data-part': 'readout' }, display ?? String(Math.round(level * 100)))
      : null,
  );
}

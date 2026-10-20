// Meter's model: its props and the view it draws from them (classes, `data-*`, ARIA, the inline
// custom properties and the reading). No framework: `Meter.tsx` (React) and `Meter.svelte`
// (Svelte) both render `meterView`.
import type { ElementView, TextModelProps } from '../../../primitives/Text.model';

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

/** A Text part: its Text props (no class), its class and its attributes. */
export interface MeterTextPart extends ElementView {
  text: TextModelProps;
}

/** What a renderer draws. */
export interface MeterView {
  /** The root `div`. */
  root: ElementView;
  /** The root's inline custom properties (`--lib-meter-*`), each value a string. */
  style: Record<string, string>;
  /** The caption Text and its words, or null for none. */
  caption: (MeterTextPart & { content: string }) | null;
  /** The frame `div` around the channel. */
  frame: ElementView;
  /** The channel: a `well` surface (Surface's attributes included), `role="meter"`. */
  channel: ElementView;
  /** The lit fill `<i>`. */
  level: ElementView;
  /** The peak line `<i>`, or null for none. */
  hold: ElementView | null;
  /** The reading Text and its words, or null for none. */
  readout: (MeterTextPart & { content: string }) | null;
}

/** Clamped to 0–1; a non-finite value reads 0. */
export const unit = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

/** CSS text for an inline style record (`--a: 1; --b: 2`). */
export const styleText = (style: Record<string, string>) =>
  Object.entries(style)
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');

/** The meter Meter draws from its props. */
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
}: MeterModelProps): MeterView {
  const level = unit(value);
  const held = peak === undefined ? undefined : unit(peak);
  const style: Record<string, string> = { '--lib-meter-fill': String(level) };
  if (held !== undefined) style['--lib-meter-peak'] = String(held);
  if (width !== undefined) style['--lib-meter-thickness'] = `${width}px`;
  if (length !== undefined) style['--lib-meter-length'] = `${length}px`;
  if (ink !== undefined) style['--lib-meter-ink'] = ink;
  return {
    root: {
      className: `lib-meter${className ? ` ${className}` : ''}`,
      attrs: {
        'data-orientation': orientation,
        'data-layout': layout,
        'data-side': layout === 'inline' ? side : undefined,
        'data-hint': hint,
      },
    },
    style,
    caption: name
      ? { text: { role: 'body', size: 'caption', case: 'label' }, className: 'lib-meter__caption', attrs: { 'data-part': 'caption' }, content: name }
      : null,
    frame: { className: 'lib-meter__frame', attrs: { title } },
    channel: {
      className: 'lib-surface lib-meter__channel',
      attrs: {
        'data-material': 'well',
        'data-radius': 'pill',
        'data-part': 'channel',
        role: 'meter',
        'aria-valuenow': String(Math.round(level * 100)),
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-label': label ?? name,
      },
    },
    level: { className: 'lib-meter__level', attrs: { 'data-part': 'level' } },
    hold: held !== undefined ? { className: 'lib-meter__hold', attrs: { 'data-part': 'hold' } } : null,
    readout: showValue
      ? {
          text: { role: 'numeral', size: 'label' },
          className: 'lib-meter__readout',
          attrs: { 'data-part': 'readout' },
          content: display ?? String(Math.round(level * 100)),
        }
      : null,
  };
}

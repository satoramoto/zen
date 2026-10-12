import type { CSSProperties } from 'react';
import { defaultOrigin, fillFrom, hintAttribute, useReserved, type FillOrigin } from '../Param/fill';
import type { Param } from '../Param/param';
import { useParamGesture } from '../Param/useParamGesture';
import { focusRing } from '../../../primitives/Ring';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import './Slider.css';

/** Caption above the control, beside it, or laid over a horizontal track. */
export type SliderLayout = 'stacked' | 'inline' | 'inside';
/** Which side of the control the caption and reading sit on, laid inline. */
export type SliderSide = 'left' | 'right';

/** `live.slider`: the knob's gesture, laid out straight. Mirrors `@openflow/widgets` Slider. */
export interface SliderProps {
  param: Param;
  value: number;
  onChange(next: number): void;
  onRelease?(): void;
  /** How far something else may carry this control, signed, drawn as a span; shift drags it with `onDepth`. */
  depth?: number;
  onDepth?(next: number): void;
  /** Where the thing driving this control has it now, 0–1, drawn as a mark inside the span. */
  live?: number;
  /** Authoritative text; wins over the parameter's own formatting. */
  display?: string;
  /** Which way the track runs, and so which way the drag goes. */
  orientation?: 'vertical' | 'horizontal';
  /** Whether the value is drawn as a filled length as well as a mark. Default: yes, except `inside`. */
  fill?: boolean;
  /** Where the fill grows from. Defaults to the middle when zero is the middle. */
  origin?: FillOrigin;
  showValue?: boolean;
  /** Length along the axis in px, or `auto` to fill the available space. */
  length?: number | 'auto';
  /** Pixels of drag for the full range. Defaults to the drawn length. */
  travel?: number;
  /** The printed caption. Defaults to the parameter's short name, then its name. */
  name?: string;
  /** For assistive technology. Defaults to the caption. */
  label?: string;
  layout?: SliderLayout;
  side?: SliderSide;
  disabled?: boolean;
  className?: string;
  title?: string;
  /** A sentence for the window's hint strip, on the root as `data-hint`. Falls back to `title`. */
  hint?: string;
  /** The colour the fill and thumb mark are lit in (any CSS colour, usually a `var()`). Default `--accent`. */
  ink?: string;
  /** Across the track in px. Default: the material's track thickness. */
  width?: number;
}

/**
 * **Job.** Set a parameter by its position on a straight track: a fader whose length is what it is
 * saying, or a row whose reading sits inside it.
 *
 * **Behaviour.** Controlled through `onChange` (and `onRelease` when a gesture ends). A drag along
 * the track grabs the value where it is, geared to the drawn length (⌘/Ctrl held for fine); ← → ↑ ↓
 * step, Page Up / Down ten steps, Home / End the ends; double-click (not after a drag) resets to the
 * default; Escape abandons a drag. With `onDepth`, shift-drag sets `depth` and shift-double-click
 * clears it. `role="slider"` with the orientation, named by `label`, else the caption.
 *
 * **Parts** (`data-part`). `caption`; `track` the channel, a `well`, carrying the gesture; `fill` the
 * value from `origin`, lit (`--lit`, `--mat-lit-glow`); `span` and `reach` the depth range and its
 * far end; `live` where a driver has it; `thumb` the cap, a `handle` (a thin lit mark when `inside`);
 * `readout` the reading, in the readout face with tabular figures.
 */
export function Slider({
  param,
  value,
  onChange,
  onRelease,
  depth,
  onDepth,
  live,
  disabled = false,
  display,
  label,
  name = param.shortName ?? param.name,
  orientation = 'vertical',
  fill,
  origin = defaultOrigin(param),
  showValue = true,
  length = 27,
  travel,
  layout = 'stacked',
  side = 'left',
  className,
  title,
  hint,
  ink,
  width,
}: SliderProps) {
  const reserved = useReserved(param);
  const gesture = useParamGesture({
    param,
    value,
    onChange,
    onRelease,
    depth,
    onDepth,
    disabled,
    axis: orientation,
    // An `inside` row is stretched to its line, so `length` describes nothing: use the hook's own
    // travel there, and the element's measured extent for an `auto` one.
    travel: travel ?? (length === 'auto' ? 'element' : layout === 'inside' ? undefined : length),
    label: label ?? name,
    display,
  });

  const reach = depth ?? 0;
  const far = Math.max(0, Math.min(1, gesture.fraction + reach));
  const span =
    onDepth === undefined || reach === 0
      ? null
      : { at: Math.min(gesture.fraction, far), size: Math.abs(far - gesture.fraction) };

  const filled = fill ?? layout !== 'inside';
  const style = {
    ...reserved,
    ...fillFrom(param, origin, gesture.fraction),
    '--lib-slider-length': length === 'auto' ? 'auto' : `${length}px`,
    ...(width === undefined ? {} : { '--lib-slider-thickness': `${width}px` }),
    ...(ink === undefined ? {} : { '--lib-slider-ink': ink }),
    ...(span === null ? {} : { '--lib-slider-span-at': span.at, '--lib-slider-span-size': span.size, '--lib-slider-span-reach': far }),
    ...(live === undefined ? {} : { '--lib-slider-live': Math.max(0, Math.min(1, live)) }),
  } as CSSProperties;

  return (
    <div
      className={`lib-slider${className ? ` ${className}` : ''}`}
      data-orientation={orientation}
      data-layout={layout}
      data-side={layout === 'inline' ? side : undefined}
      data-length={length === 'auto' ? 'auto' : undefined}
      data-disabled={disabled || undefined}
      {...hintAttribute(hint)}
      style={style}
    >
      {name && (
        <Text role="body" size="caption" case="label" className="lib-slider__caption" data-part="caption">
          {name}
        </Text>
      )}
      <div className="lib-slider__frame" title={title}>
        <Surface material="well" radius="pill" className={`lib-slider__track ${focusRing}`} data-part="track" {...gesture.props}>
          {filled && <span className="lib-slider__fill" data-part="fill" aria-hidden="true" />}
          {span !== null && <span className="lib-slider__span" data-part="span" aria-hidden="true" />}
          {span !== null && <span className="lib-slider__reach" data-part="reach" aria-hidden="true" />}
          {span !== null && live !== undefined && <span className="lib-slider__live" data-part="live" aria-hidden="true" />}
          <Surface as="span" material="handle" radius="pill" className="lib-slider__thumb" data-part="thumb" aria-hidden="true" />
        </Surface>
      </div>
      {showValue && (
        <Text role="numeral" size="label" className="lib-slider__readout" data-part="readout">
          {gesture.text}
        </Text>
      )}
    </div>
  );
}

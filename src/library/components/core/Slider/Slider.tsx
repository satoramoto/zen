import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type KeyboardEvent } from 'react';
import { defaultOrigin, fillFrom, hintAttribute, useReserved, type FillOrigin } from '../Param/fill';
import { clamp, fractionOf, type Param } from '../Param/param';
import { useParamGesture, type ParamKeyStep } from '../Param/useParamGesture';
import { focusRing } from '../../../primitives/Ring';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import './Slider.css';

/**
 * Caption above the control, beside it, or laid over a horizontal track; or `row`, Apple's slider
 * (HIG Sliders): the caption at the leading edge and the reading at the trailing edge on one line,
 * over a thin groove the full width with a knob that stands proud of it. `row` is horizontal only.
 */
export type SliderLayout = 'stacked' | 'inline' | 'inside' | 'row';
/** Which side of the control the caption and reading sit on, laid inline. */
export type SliderSide = 'left' | 'right';

/** How a typed readout reads and writes text, both in the parameter's units. */
export interface SliderTyping {
  /** The typed text as a value, or `null` to ignore it (nothing is set). Default: a plain number. */
  parse?(text: string): number | null;
  /** The text the field opens with. Default: the value as a plain number. */
  format?(value: number): string;
}

/** The default typing: a plain number in, the value's plain number out. */
const plainNumber = (text: string): number | null => {
  const n = Number.parseFloat(text.replace('−', '-'));
  return Number.isFinite(n) ? n : null;
};
const plainText = (value: number) => String(Number(value.toPrecision(6)));

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
  /** What is moving this control (an LFO, a cord's source), printed after the caption as
   *  `← {driver}` in the fill ink, so the row says who carries it without the cord being traced. */
  driver?: string;
  /**
   * No single value (several things that differ): no thumb or fill, `data-mixed` on the root, ARIA
   * without `aria-valuenow` and reading `display` (else "Mixed"). `value` is where a drag starts;
   * the first drag, key or double-click calls `onChange`, even onto `value`. A press and release
   * without moving leaves it mixed, and Escape mid-drag writes nothing back.
   */
  mixed?: boolean;
  /** Values marked on the track with a tick; the one at the default is drawn taller and brighter. */
  detents?: readonly number[];
  /** How near a detent (in the parameter's units) a drag must come to land on it. Default 0: no catch. */
  snap?: number;
  /** The keys' own next values, asked before the default steps (`stepDetent` steps through detents). */
  keyStep?: ParamKeyStep;
  /** A word under each of `detents` (`½×`, `1×`, `2×`), in line with its tick; the default's in full
   *  ink. Horizontal (`stacked` or `row`) only. */
  detentLabel?(value: number): string;
  /** The readout takes a typed value: click it (or Enter / Space on it) to type, Enter sets it,
   *  Escape leaves it as it was, leaving the field sets it. `true` reads a plain number; pass
   *  `parse` / `format` for other text (in the parameter's units). The value is clamped to the
   *  range, set through `onChange` then `onRelease`. Needs `showValue`. */
  typed?: boolean | SliderTyping;
}

/**
 * **Job.** Set a parameter by its position on a straight track: a fader whose length is what it is
 * saying, or a row whose reading sits inside it.
 *
 * **Behaviour.** Controlled through `onChange` (and `onRelease` when a gesture ends). A drag along
 * the track grabs the value where it is, geared to the drawn length (⌘/Ctrl held for fine); ← → ↑ ↓
 * step, Page Up / Down ten steps, Home / End the ends; double-click (not after a drag) resets to the
 * default; Escape abandons a drag. `keyStep` supplies the keys' own next values first; a drag
 * within `snap` of one of `detents` lands on it. With `onDepth`, shift-drag sets `depth` and shift-double-click
 * clears it. `role="slider"` with the orientation, named by `label`, else the caption. With
 * `typed`, the readout is a button ("{label} {reading}, type a value") that opens a field in its
 * place: Enter sets the parsed value, Escape cancels (and goes no further, so a sheet around it
 * stays open), leaving the field sets it; focus returns to the readout.
 *

 * **Parts** (`data-part`). `caption`; `track` the channel, a `well`, carrying the gesture; `fill` the
 * value from `origin`, lit (`--lit`, `--mat-lit-glow`); `span` and `reach` the depth range and its
 * far end; `live` where a driver has it; `detent` a tick at each of `detents` (`data-default` on the
 * one at the default), in line with the thumb's centre; `thumb` (absent while `mixed`) the cap, a `handle` (a thin lit mark when `inside`, a round-ended knob
 * standing proud of a thin groove in a `row`, where the track is the knob's height and the groove
 * is drawn inside it);
 * `readout` the reading, in the readout face with tabular figures (a button with `typed`); `entry`
 * the field that replaces it while typing; `labels` the row of `detent-label`s under the track
 * (`data-default` on the default's); `driver` (inside `caption`, with
 * `driver` set) who is moving it, `← {driver}` in the fill ink (`--lib-slider-ink`).
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
  driver,
  mixed = false,
  detents,
  snap,
  keyStep,
  detentLabel,
  typed,
}: SliderProps) {
  const reserved = useReserved(param);
  const axis = layout === 'row' ? 'horizontal' : orientation;
  const gesture = useParamGesture({
    param,
    value,
    onChange,
    onRelease,
    depth,
    onDepth,
    disabled,
    axis,
    // An `inside` row is stretched to its line, so `length` describes nothing: use the hook's own
    // travel there, and the element's measured extent for an `auto` one.
    travel: travel ?? (length === 'auto' ? 'element' : layout === 'inside' ? undefined : length),
    label: label ?? name,
    display,
    mixed,
    detents,
    snap,
    keyStep,
  });

  // The typed readout: the text being typed, or null while the readout shows.
  const typing = typed === undefined || typed === false ? null : typed === true ? {} : typed;
  const [entry, setEntry] = useState<string | null>(null);
  const readoutButton = useRef<HTMLButtonElement>(null);
  const entryField = useRef<HTMLInputElement>(null);
  /** Whether the field is still open: the blur that follows Enter or Escape mustn't set it again. */
  const open = useRef(false);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (entry !== null && !wasOpen.current) entryField.current?.select();
    if (entry === null && wasOpen.current) readoutButton.current?.focus();
    wasOpen.current = entry !== null;
  }, [entry]);
  const startTyping = () => {
    if (disabled || typing === null) return;
    open.current = true;
    setEntry(mixed ? '' : (typing.format ?? plainText)(value));
  };
  const commit = () => {
    if (!open.current || entry === null || typing === null) return;
    open.current = false;
    const next = (typing.parse ?? plainNumber)(entry);
    setEntry(null);
    if (next === null) return;
    onChange(clamp(param, next));
    onRelease?.();
  };
  const entryKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      open.current = false;
      setEntry(null);
    }
  };
  const labelled = detentLabel !== undefined && detents !== undefined && detents.length > 0;

  const reach = depth ?? 0;
  const far = Math.max(0, Math.min(1, gesture.fraction + reach));
  const span =
    onDepth === undefined || reach === 0
      ? null
      : { at: Math.min(gesture.fraction, far), size: Math.abs(far - gesture.fraction) };

  const filled = !mixed && (fill ?? layout !== 'inside');
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
      data-orientation={axis}
      data-layout={layout}
      data-side={layout === 'inline' ? side : undefined}
      data-length={length === 'auto' ? 'auto' : undefined}
      data-disabled={disabled || undefined}
      data-mixed={mixed || undefined}
      data-labels={labelled || undefined}
      {...hintAttribute(hint)}
      style={style}
    >
      {(name || driver) && (
        <Text role="body" size="caption" case="label" className="lib-slider__caption" data-part="caption">
          {name}
          {driver && (
            <span className="lib-slider__driver" data-part="driver">
              {name ? ' ' : ''}← {driver}
            </span>
          )}
        </Text>
      )}
      <div className="lib-slider__frame" title={title}>
        <Surface material="well" radius="pill" className={`lib-slider__track ${focusRing}`} data-part="track" {...gesture.props}>
          {filled && <span className="lib-slider__fill" data-part="fill" aria-hidden="true" />}
          {span !== null && <span className="lib-slider__span" data-part="span" aria-hidden="true" />}
          {span !== null && <span className="lib-slider__reach" data-part="reach" aria-hidden="true" />}
          {span !== null && live !== undefined && <span className="lib-slider__live" data-part="live" aria-hidden="true" />}
          {detents?.map((d) => (
            <span
              key={d}
              className="lib-slider__detent"
              data-part="detent"
              data-default={d === param.defaultValue || undefined}
              aria-hidden="true"
              style={{ '--lib-slider-detent': fractionOf(param, d) } as CSSProperties}
            />
          ))}
          {!mixed && <Surface as="span" material="handle" radius="pill" className="lib-slider__thumb" data-part="thumb" aria-hidden="true" />}
        </Surface>
      </div>
      {labelled && (
        <Text as="div" role="body" size="caption" leading="tight" className="lib-slider__labels" data-part="labels" aria-hidden="true">
          {detents.map((d) => (
            <Text
              key={d}
              role="body"
              size="caption"
              leading="tight"
              tabular
              className="lib-slider__detent-label"
              data-part="detent-label"
              data-default={d === param.defaultValue || undefined}
              style={{ '--lib-slider-detent': fractionOf(param, d) } as CSSProperties}
            >
              {detentLabel(d)}
            </Text>
          ))}
        </Text>
      )}
      {showValue && typing !== null && entry !== null ? (
        <Text
          as="input"
          role="numeral"
          size="label"
          ref={entryField}
          type="text"
          inputMode="decimal"
          className="lib-slider__readout lib-slider__entry"
          data-part="entry"
          aria-label={`${label ?? name}, type a value`}
          value={entry}
          autoComplete="off"
          spellCheck={false}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setEntry(event.currentTarget.value)}
          onKeyDown={entryKey}
          onBlur={commit}
        />
      ) : showValue && typing !== null ? (
        <Text
          as="button"
          role="numeral"
          size="label"
          ref={readoutButton}
          type="button"
          className={`lib-slider__readout lib-slider__typed ${focusRing}`}
          data-part="readout"
          disabled={disabled}
          aria-label={`${label ?? name} ${gesture.text}, type a value`}
          title="Type a value"
          onClick={startTyping}
        >
          {gesture.text}
        </Text>
      ) : (
        showValue && (
          <Text role="numeral" size="label" className="lib-slider__readout" data-part="readout">
            {gesture.text}
          </Text>
        )
      )}
    </div>
  );
}

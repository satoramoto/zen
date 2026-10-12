import type { CSSProperties } from 'react';
import './Meter.css';

/** Caption above the meter, beside it, or laid over a horizontal bar. */
export type MeterLayout = 'stacked' | 'inline' | 'inside';
/** Which side of the meter the caption and reading sit on, laid inline. */
export type MeterSide = 'left' | 'right';

/** `live.meter~`: a level, read-only. Mirrors `@openflow/widgets` Meter. */
export interface MeterProps {
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

const unit = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

/**
 * **Job.** Show a level that something else is driving (a signal, an envelope, an energy) so the
 * player can see what the picture is reacting to. It never invites a touch: it is not a disabled
 * slider.
 *
 * **Behaviour.** Read-only: no gesture, no focus, no write. `role="meter"` with `aria-valuenow` the
 * level as 0–100, named by `label`, else the caption. `value` and `peak` are clamped to 0–1 (a
 * non-finite value reads 0). `peak` is drawn as a line, not a second fill, because it answers a
 * different question (how far it has been, not where it is now).
 *
 * **Parts** (`data-part`). `caption`; `channel` the bar, a `well`; `level` the lit fill (`--lit`,
 * `--mat-lit-glow`); `hold` the peak line; `readout` the reading, in the readout face with tabular
 * figures (laid over the bar when `inside`).
 */
export function Meter({
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
}: MeterProps) {
  const level = unit(value);
  const held = peak === undefined ? undefined : unit(peak);
  const style = {
    '--lib-meter-fill': level,
    ...(held === undefined ? {} : { '--lib-meter-peak': held }),
    ...(width === undefined ? {} : { '--lib-meter-thickness': `${width}px` }),
    ...(length === undefined ? {} : { '--lib-meter-length': `${length}px` }),
    ...(ink === undefined ? {} : { '--lib-meter-ink': ink }),
  } as CSSProperties;

  return (
    <div
      className={`lib-meter${className ? ` ${className}` : ''}`}
      data-orientation={orientation}
      data-layout={layout}
      data-side={layout === 'inline' ? side : undefined}
      {...(hint === undefined ? {} : { 'data-hint': hint })}
      style={style}
    >
      {name && (
        <span className="lib-meter__caption" data-part="caption">
          {name}
        </span>
      )}
      <div className="lib-meter__frame" title={title}>
        <div
          className="lib-meter__channel"
          data-part="channel"
          role="meter"
          aria-valuenow={Math.round(level * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label ?? name}
        >
          <i className="lib-meter__level" data-part="level" />
          {held !== undefined && <i className="lib-meter__hold" data-part="hold" />}
        </div>
      </div>
      {showValue && (
        <span className="lib-meter__readout" data-part="readout">
          {display ?? String(Math.round(level * 100))}
        </span>
      )}
    </div>
  );
}

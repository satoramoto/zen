import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { fraction, useAdjust } from './adjust';
import type { HueSlot } from '../hue';
import { focusRing } from '../../../primitives/Ring';
import { Text } from '../../../primitives/Text';
import type { TipAction } from '../../../view/tip';
import './StepValue.css';

export type { TipAction };

/** A categorical hue slot (an app maps its own meaning, e.g. Yahaha's parts), or `t` neutral. */
export type StepHue = 't' | HueSlot;

export interface StepValueProps {
  /** The value, in `min`–`max`. */
  value: number;
  min?: number;
  max?: number;
  /** Where a double-click puts it; none: a double-click does nothing. */
  defaultValue?: number;
  /** The value as shown ("16", "+4", "1k"). Default: the number. */
  display?: string;
  /** A short tag before the value ("R2"), marked with its hue. */
  tag?: string;
  /** The tag's hue: a slot `1`–`4` (`--hue-1..4`), or `t` neutral. */
  hue?: StepHue;
  /** `a` a level (shows where it sits in its range), `t` a plain table cell. */
  ink?: 'a' | 't';
  /** Faded (a part that doesn't sound): tag and value at reduced strength. Still settable. */
  dim?: boolean;
  /** Shown, not settable. Stays focusable. */
  disabled?: boolean;
  /** The px a drag across the whole range takes. */
  span?: number;
  /** The slider's accessible name ("Right 2 delay send"). */
  name: string;
  /** The spoken value, when `display` alone isn't enough ("+4 dB"). Default: `display`. */
  valuetext?: string;
  /** The tooltip key, rendered as `data-tip`. */
  tip?: string;
  /** The app's tooltip action, applied with `tip` when both are set. */
  tipAction?: TipAction;
  /** A new whole value, from a drag, a wheel notch, a key or a double-click. */
  onchange?: (value: number) => void;
}


/**
 * A value set in place, in a small cell: a part's send, a Master EQ band's gain, a style insert's
 * amount. Press and drag sideways, a wheel notch or an arrow key steps it; Page Up / Down by ten,
 * Home and End to the ends, a double-click back to its default.
 *
 * **Job.** Let a player read one number at a glance, see whose number it is, and nudge it without
 * opening anything. In a column of cells the numbers must line up and the owner must be findable by
 * colour before reading.
 *
 * **Changed.** *Hierarchy and numerals:* the value is now the loudest thing, set in the readout face
 * at numeral weight with tabular figures and a fixed minimum width, right-aligned, so a column of
 * cells reads like a table and digits don't jitter while dragging (typography.md). The tag drops to
 * a label (label case, tracking, secondary ink). *Colour meaning:* the owner's hue moves from the
 * tag's letters to a small swatch beside it, so hue marks identity only and the text keeps full
 * contrast on light palettes; the value is no longer painted in the accent, which is kept for focus
 * and the live drag (color.md: fewer colours, stricter purpose; at most two per component).
 * *Affordance:* a level (`ink="a"`) carries a thin lamp under it showing where it sits in its
 * range, lit in its hue slot with the palette's bloom, so it looks like something with a range
 * that slides; the cell takes a hover fill and an ew-resize cursor, and a drag lights the lamp in
 * the accent. Dim and disabled use the text ladder and an unlit lamp rather than opacity; disabled
 * is the screen's one "shown, not usable" look, a dashed edge with its text in `--text-3`, and a
 * not-allowed cursor. A 2px accent `:focus-visible` ring (craft-details.md). *One hue carrier*
 * (the 2026-10 review): the swatch is an `--space-2` square at the control radius, the same mark
 * as a lamp's LED, rather than a 6px pill, and the range lamp is a 3px line on the cell's bottom
 * edge, so in a column it can't read as the next row's top rule.
 *
 * **Kept.** No bar or box at rest, so it fits a dense cell; every way to set it (drag, wheel, keys,
 * double-click to default) and its slider semantics (aria-valuenow/min/max, valuetext, disabled
 * stays focusable); controlled through `onchange`, sending only real changes, at most one per frame
 * while dragging.
 *
 * **Tuning knobs**
 * - `--yh-stepvalue-fill`: how much of the lamp is lit, 0–1 (where the value sits in its range); set inline by the component.
 */
export function StepValue({
  value,
  min = 0,
  max = 127,
  defaultValue,
  display,
  tag,
  hue = 't',
  ink = 'a',
  dim = false,
  disabled = false,
  span = 128,
  name,
  valuetext,
  tip,
  tipAction,
  onchange,
}: StepValueProps) {
  const shown = display ?? String(value);
  const { ref, handlers } = useAdjust<HTMLSpanElement>({ value, min, max, defaultValue, disabled, span, onchange });

  useEffect(() => {
    const node = ref.current;
    if (!node || !tipAction || tip === undefined) return;
    const handle = tipAction(node, tip);
    return () => {
      if (handle) handle.destroy?.();
    };
  }, [ref, tip, tipAction]);

  const level = { '--yh-stepvalue-fill': String(fraction(value, min, max)) } as CSSProperties;

  return (
    <span
      ref={ref}
      className={`yh-stepvalue ${focusRing}`}
      role="slider"
      tabIndex={0}
      aria-label={name}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valuetext ?? shown}
      aria-disabled={disabled ? 'true' : undefined}
      data-ink={ink}
      data-dim={dim ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
      data-hue={hue === 't' ? undefined : hue}
      data-tip={tip}
      style={level}
      {...handlers}
    >
      {tag && (
        <Text role="body" size="caption" weight="strong" case="label" className="yh-stepvalue__tag">
          <span className="yh-stepvalue__swatch" aria-hidden="true" />
          {tag}
        </Text>
      )}
      {/* A table cell (`ink` 't') reads in plain body weight, quieter than a level. */}
      <Text role="numeral" size="label" weight={ink === 't' ? 'body' : undefined} className="yh-stepvalue__value">
        {shown}
      </Text>
      {ink === 'a' && <span className="yh-stepvalue__lamp" aria-hidden="true" />}
    </span>
  );
}

export default StepValue;

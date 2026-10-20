import { useRef } from 'react';
import { Text } from '../../../primitives/Text';
import { barParams, barReadoutView, type BarReadoutModelProps } from './BarReadout.model';
import { useBarInput } from './useBarInput';
import './BarReadout.css';

// The props and what they draw are framework-free, in the model; the input is `barInput.ts`;
// `BarReadout.svelte` renders the same view.
export type { BarKind, BarReadoutModelProps } from './BarReadout.model';

export type BarReadoutProps = BarReadoutModelProps;

/**
 * BarReadout: one row of the Channel page's groups, a label, a thin bar and the value with its unit.
 *
 * **Job.** Show one mixer or insert setting (level, pan, an EQ frequency, a send) so a player reads
 * the number and, from the bar, roughly where it sits in its range, and let them set it: press
 * anywhere on the bar and drag sideways (relative, 2px a unit, Shift 8px), the wheel and arrows step
 * one, Page Up / Page Down ten, Home and End the ends, a double-click resets to `default`. While an
 * edit is live the fill and value follow the local value until the state catches up. Controlled:
 * it sends through `onChange`.
 *
 * **Changed.** *Hierarchy:* the label is the Stage's one caption (caption size, body weight,
 * `--text-3`, the pack's label case) and the value the strongest thing in the row, primary text at
 * body size in the readout face and numeral weight, the unit smaller and fainter after it
 * (typography.md, "Text Color System"); Readout uses the same recipe. *Numerals:* tabular figures
 * in a right-aligned slot sized in `ch` for the widest value ("16.0 kHz", "−48 dB"), and the unit
 * in a fixed column drawn even when empty, so "90", "−18 dB" and "8.0 kHz" line up on their last
 * digit rather than on the unit, and a drag never makes the row jitter, even under packs whose
 * readout face is proportional (typography.md, "Tabular Numbers"). *Colour meaning:* the fill
 * and its cap take one ink, `--yh-bar-readout-ink` (the accent unless the page points it at the
 * part's hue), the track is a tint of the text colour so it shows on light and dark palettes, and
 * the soft-takeover "↕" is the one thing drawn in `--warning`, because the fader really is away
 * (color.md, "Semantic Colors"). *Affordance:* a bipolar row marks its centre with a tick, the track
 * thickens under the pointer and while dragging, the cursor says "drag sideways", and focus is a
 * `:focus-visible` ring in the accent (craft-details.md, "Focus States"). A disabled row draws its
 * track dashed and its text in the muted `--text-3` (never the faint `--text-4`, which vanished on
 * dark packs), so "not there" reads differently from "at zero" and can still be read.
 *
 * **Kept.** One control-height row of label, bar and value; the fill from zero or from the centre;
 * the 2px cap at the value; every input and its feel (frame-batched drag sends, the local value held
 * until the state matches or 500 ms pass); the slider role, name, `aria-valuetext` ("Level 90",
 * "Low freq 120 Hz", "Ratio 3:1"), "hardware fader away", and a disabled row that stays focusable
 * and reads its absence ("Send 5, not added").
 *
 * **Tuning knobs.**
 * - `--yh-bar-readout-ink`: the fill and cap's ink (default `--accent`; a page may point it at a hue).
 * - `--yh-bar-readout-line`: the line's thickness, a hairline at rest and `--space-1` under the
 *   pointer or while dragging.
 */
export function BarReadout(props: BarReadoutProps) {
  const barRef = useRef<HTMLSpanElement>(null);
  const state = useBarInput(barRef, barParams(props));
  const view = barReadoutView(props, state);

  return (
    <div className={view.className}>
      <Text role="body" size="caption" case="label" className="yh-bar-readout__label">
        <span className="yh-bar-readout__label-text">{view.label}</span>
        {view.waiting && (
          <Text role="body" size="inherit" weight="strong" className="yh-bar-readout__away" aria-hidden="true">
            ↕
          </Text>
        )}
      </Text>
      <span ref={barRef} className="yh-bar-readout__bar" tabIndex={0} {...view.slider}>
        <span className="yh-bar-readout__track" />
        {view.centre && <span className="yh-bar-readout__centre" />}
        {view.fill && (
          <>
            <span className="yh-bar-readout__fill" style={{ left: view.fill.left, width: view.fill.width }} />
            <span className="yh-bar-readout__cap" style={{ left: view.fill.cap }} />
          </>
        )}
      </span>
      <span className="yh-bar-readout__slot" aria-hidden="true">
        <Text role="numeral" size="body" className="yh-bar-readout__value">
          {view.value}
        </Text>
        {/* Always drawn, empty when there's no unit, so every row's last digit lines up. */}
        <Text role="body" size="caption" className="yh-bar-readout__unit">
          {view.unit}
        </Text>
      </span>
    </div>
  );
}

import type { HueSlot } from '../../core/hue';
import { BOX, R, START, arc, point, sweepOf } from './geometry';
import { useKnob, type TipAction } from './useKnob';
import './Knob.css';

export type { TipAction };
export { useKnob };

export interface KnobProps {
  /** The plain name ("Dynamics", "Retrig rate"). For an unused knob, the board's "---". */
  label: string;
  /** The Genos code beneath the ring ("DynCtrl"). */
  code?: string;
  /** The value as shown ("127", "1/8", "Off"). */
  value?: string;
  /** A small unit after the value ("%"). */
  unit?: string;
  /** How far round the arc is, 0–1 of its 270°. */
  fraction?: number;
  /** Nothing is mapped to this knob: dim name, an empty ring, no value. */
  unused?: boolean;
  /** A categorical hue slot (1–4, `--hue-n`) for what owns this knob; an app maps its meaning (e.g. Yahaha's parts). Its arc wears that hue. Default: ink. */
  hue?: HueSlot;
  /** The accessible name. Default: "{label} ({code}) {value}{unit}", or "unused". */
  name?: string;
  /** The tooltip key, rendered as `data-tip`. */
  tip?: string;
  /** The app's tooltip hook, applied with `tip` when both are set. */
  tipAction?: TipAction;
  /** Called on a click that didn't turn the knob, Space or Enter. */
  onpress?: () => void;
  /** Called with the steps turned (positive: clockwise): ±1 on a key or a wheel notch, the steps a drag covered. Not when unused. */
  onstep?: (delta: number) => void;
}

/**
 * Knob: one of the eight band knobs.
 *
 * **Job.** Say what this knob sets and where it is now, in one glance from arm's length, and
 * invite a turn. The player reads the number first, the arc second (how far round), the name
 * third; the Genos code is reference only.
 *
 * **Changed.** *Headless* (the materials pass): behaviour lives in `useKnob`, and the markup is
 * named parts (`data-part`: root, label, dial, well, body, arc, pointer, value, unit, code) whose
 * look comes from the theme's Materials: the ring's groove is a `well`, a round cap inside it is
 * the `handle` the value sits on, and the value arc is lit (`--lit` is the hue slot or ink, its
 * bloom `--mat-lit-glow`'s drop-shadow twin), so a design system can be tried on without touching
 * the knob. *Hierarchy and numerals:* the value moves into the ring's centre in the readout
 * face at numeral weight with tabular figures, so the number and the arc that measures it read as
 * one object, and the value no longer jumps width as it changes (`typography.md`, Tabular
 * Numbers). *Colour meaning:* the original painted value, arc and dot in the accent; here the
 * accent is kept for focus only and the arc is drawn in ink, or in a hue slot when `hue` says
 * what owns the knob (`color.md`, the 60/30/10 rule and "maximum 2 colours per component").
 * *Affordance:* the tip dot becomes a pointer tick just outside the ring at the arc's end, like
 * the index mark beside a hardware knob, so it looks like something that turns; hovering lifts the
 * well and the cursor says drag up/down. *Contrast:* an unused knob keeps a fainter well and a dim
 * name. *Rhythm:* name, ring and code sit on the library's spacing and scale with `--control-h`,
 * labels follow the pack's `--label-case` and tracking, and a visible `:focus-visible` ring uses
 * the accent (`craft-details.md`, Focus States). *Hierarchy at rest*: a value of "0" or "Off"
 * steps down to `--text-3` (the rule SendReadout uses for a send at 0). *Legibility*: the name
 * wraps to two balanced lines instead of an ellipsis, and every knob keeps two lines' room, so
 * rings line up across a bank; the Genos code is optional, drawn only when given.
 *
 * **Kept.** Fully controlled, and the same input: a drag turns it relative to where it is (a
 * step every 4px up or right, 16px with Shift) and never jumps to the pointer; ↑ → / ↓ ← and the
 * wheel step it, a trackpad's small deltas adding up to one notch; a click that didn't turn it is
 * a press, as are Space and Enter. The 270° sweep from bottom left, the sizes, the spoken name and
 * the unused state are the original's.
 */
export function Knob({
  label,
  code = '',
  value = '',
  unit = '',
  fraction = 0,
  unused = false,
  hue,
  name,
  tip,
  tipAction,
  onpress,
  onstep,
}: KnobProps) {
  const spoken = name ?? (unused ? 'unused' : `${label}${code ? ` (${code})` : ''} ${value}${unit}`);
  const { rootProps } = useKnob({ unused, name: spoken, tip, tipAction, onpress, onstep });

  const deg = unused ? 0 : sweepOf(fraction);
  const lit = arc(START, START + deg);
  // The pointer: a short tick just outside the ring at the arc's end, so it never merges into the
  // lit arc (same ink on a neutral knob) and stays clear of the value in the centre.
  const tipOuter = point(START + deg, R + 7);
  const tipInner = point(START + deg, R + 3);
  // "0" and "Off" say "nothing here" and step back, as a send at 0 does (SendReadout).
  const rest = !unused && /^(0|off)$/i.test(value.trim());

  return (
    <button
      {...rootProps}
      className="yh-knob"
      data-part="root"
      data-unused={unused || undefined}
      data-rest={rest || undefined}
      data-hue={hue}
      data-tip={tip}
    >
      <span className="yh-knob__label" data-part="label">
        {label}
      </span>
      <span className="yh-knob__dial" data-part="dial">
        {/* The groove: the full 270° sweep, cut from a disc so it can wear any material. */}
        <span className="yh-knob__track" data-part="well" aria-hidden="true" />
        {/* The cap the arc sits around. */}
        <span className="yh-knob__body" data-part="body" aria-hidden="true" />
        <svg className="yh-knob__ring" viewBox={`0 0 ${BOX} ${BOX}`} aria-hidden="true">
          {!unused && lit && <path className="yh-knob__lit" data-part="arc" d={lit} />}
          {!unused && (
            <line
              className="yh-knob__pointer"
              data-part="pointer"
              x1={tipInner.x.toFixed(2)}
              y1={tipInner.y.toFixed(2)}
              x2={tipOuter.x.toFixed(2)}
              y2={tipOuter.y.toFixed(2)}
            />
          )}
        </svg>
        {!unused && (
          <span className="yh-knob__value" data-part="value">
            {value}
            {unit && (
              <span className="yh-knob__unit" data-part="unit">
                {unit}
              </span>
            )}
          </span>
        )}
      </span>
      {code && (
        <span className="yh-knob__code" data-part="code">
          {code}
        </span>
      )}
    </button>
  );
}

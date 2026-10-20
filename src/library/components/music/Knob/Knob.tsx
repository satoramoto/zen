import { Text } from '../../../primitives/Text';
import { knobView, type KnobModelProps, type TipAction } from './Knob.model';
import { useKnob } from './useKnob';
// The well and the cap are Surface materials drawn as plain spans with Surface's class and data
// (`knobView`; no layer, so never a shader). Before Knob.css, so its corners win.
import '../../../primitives/Surface.css';
import './Knob.css';

export type { TipAction, KnobModelProps };
export { useKnob };

/** Every Knob prop (Knob.model.ts). */
export type KnobProps = KnobModelProps;

/**
 * Knob: one of the eight band knobs.
 *
 * **Job.** Say what this knob sets and where it is now, in one glance from arm's length, and
 * invite a turn. The player reads the number first, the arc second (how far round), the name
 * third; the Genos code is reference only.
 *
 * **Changed.** *Headless* (the materials pass): behaviour lives in `useKnob` (over the `knobInput.ts` store), the
 * look's decisions in `knobView` (Knob.model.ts, shared with Knob.svelte), and the markup is
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
 *
 * **Built from.** The well (`well`) and the cap (`handle`) are `Surface` materials; focus is
 * `focusRing`. Name, value and code stay plain spans, not `Text`: their sizes follow the ring
 * (`--yh-knob-ring`) and KnobBank restyles them, which `.lib-text`'s role sizes would override.
 *
 * **Tuning knobs.**
 * - `--yh-knob-ring`: the ring's side (default 2.25 control heights); KnobBank sets it per slot.
 * - `--yh-knob-round`: the well's and cap's corners, a disc whatever the pack's radii.
 */
export function Knob(props: KnobProps) {
  const { unused, tip, tipAction, onpress, onstep } = props;
  const view = knobView(props);
  const { rootProps } = useKnob({ unused, name: view.name, tip, tipAction, onpress, onstep });

  return (
    <button {...rootProps} className={view.root.className} {...view.root.attrs}>
      <Text {...view.label} className="yh-knob__label" data-part="label">
        {props.label}
      </Text>
      <span className="yh-knob__dial" data-part="dial">
        {/* The groove: the full 270° sweep, cut from a disc so it can wear any material. */}
        <span className={view.track.className} {...view.track.attrs} />
        {/* The cap the arc sits around. */}
        <span className={view.body.className} {...view.body.attrs} />
        <svg className="yh-knob__ring" viewBox={view.viewBox} aria-hidden="true">
          {view.arc !== null && <path className="yh-knob__lit" data-part="arc" d={view.arc} />}
          {view.pointer && <line className="yh-knob__pointer" data-part="pointer" {...view.pointer} />}
        </svg>
        {view.value !== null && (
          <Text role="numeral" className="yh-knob__value" data-part="value">
            {view.value}
            {view.unit !== null && (
              <Text role="body" size="caption" leading="tight" className="yh-knob__unit" data-part="unit">
                {view.unit}
              </Text>
            )}
          </Text>
        )}
      </span>
      {view.code !== null && (
        <Text role="caption" className="yh-knob__code" data-part="code">
          {view.code}
        </Text>
      )}
    </button>
  );
}

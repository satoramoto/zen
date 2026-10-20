import { useRef, type CSSProperties } from 'react';
import { Text } from '../../../primitives/Text';
import { tempoReadoutView, type TempoReadoutModelProps } from './TempoReadout.model';
import { bindTempoNumber, bindTempoStep } from './tempoGestures';
import { useBinding, useTip } from './useTempoGestures';
import './TempoReadout.css';

// The props and the view are framework-free, in the model; the gestures are the `tempoGestures.ts`
// store; `TempoReadout.svelte` renders the same view.
export type { TipAction, TempoReadoutModelProps } from './TempoReadout.model';

export type TempoReadoutProps = TempoReadoutModelProps;

/**
 * TempoReadout: the display's tempo block, "104 BPM" with Tempo + and − stacked at its right.
 *
 * **Job.** Show the tempo so a player reads it at a glance across the stage, and let them change
 * it in place: drag the number up or down (a step every 4px) or scroll on it, ↑ ↓ step 1 BPM and
 * Page Up / Page Down 10, a double-click goes back to the style's own tempo. + and − report a hold
 * (`true` on press, `false` on release) so the parent can repeat while held. It holds no tempo and
 * no timers: every change is asked for through a callback, and the number shows `bpm` as given.
 *
 * **Changed.** *Numerals:* the number is set in the pack's readout face at its numeral weight with
 * tabular figures, right-aligned in a box as wide as the widest value (`max`'s digit count in ch),
 * so 99 → 100 → 104 never shifts the unit or the buttons (typography.md, "Tabular Numbers").
 * *Hierarchy:* the unit drops to a caption in the muted ink at body weight and the pack's label
 * case, the one caption recipe of the Stage, so the eye lands on the value first (typography.md).
 * *Affordance:* + and − are real keys, a framed pair on the raised surface with one hairline
 * between them, each a control-height square with its glyph at heading size (they were 30px wide
 * slivers with 18px glyphs), instead of bare glyphs that read as text; the draggable number shows
 * a faint well on hover and the `ns-resize` cursor (craft-details.md). *Colour meaning:* + and −
 * move time, but they wear their role hue `--role-2` only while active (the app maps the role;
 * in Yahaha it is transport): at rest the pair is neutral, the strong border and secondary glyphs,
 * so the app's one saturated key (Yahaha's Start / Stop) stays alone; hover raises the surface,
 * and only a press fills it with `--role-2` and `--role-2-text`. The number stays neutral text and no status colour appears; the accent
 * appears only as the focus ring (color.md). *Sizing:* the numeral's size is one
 * custom property, `--yh-tempo-readout-size` (default `--size-numeral`), which a parent sets on
 * the root or passes as `size`, so a display can make the tempo its hero without overriding this
 * widget's CSS; + and − keep the control size at any numeral size. *Materials:* the parts are
 * named (`data-part`: root, window, value, unit, steps, step); the reading is a `screen` window
 * (none of its own when it already sits on a screen, as in the Display) and + and − are `key`s,
 * pressed with `--mat-key-pressed`, so the theme's materials decide how they are made.
 *
 * **Kept.** The spinbutton with its spoken value ("104 BPM"), the drag, wheel, key and
 * double-click gestures, the hold reporting with a single press from the keyboard, the button
 * names ("Tempo up (Scene Launch)", "Tempo down (Function)"), the `data-tip` keys, the app's
 * `tipAction` on the number and both buttons with their keys, and `cells`, where it fills its
 * size container with the reading on the foot and + over − exactly as tall as the number's
 * capitals.
 *
 * **Tuning knobs.**
 * - `--yh-tempo-readout-size`: the numeral's size (default `--size-numeral`; `cells` fits it to
 *   the container); a parent sets it on the element, or `size` inline; + and − scale with it.
 * - `--yh-tempo-readout-digits`: the widest value's digit count, set inline, so the number's
 *   slot never jitters.
 */
export function TempoReadout(props: TempoReadoutProps) {
  const { bpm, min, max, onTempo, onReset, onPlus, onMinus, tipAction } = props;
  const view = tempoReadoutView(props);

  const number = useRef<HTMLSpanElement>(null);
  const upButton = useRef<HTMLButtonElement>(null);
  const downButton = useRef<HTMLButtonElement>(null);
  useTip(number, tipAction, view.value.tip);
  useTip(upButton, tipAction, view.plus.tip);
  useTip(downButton, tipAction, view.minus.tip);
  useBinding(number, bindTempoNumber, { bpm, min, max, onTempo, onReset });
  useBinding(upButton, bindTempoStep, { report: onPlus });
  useBinding(downButton, bindTempoStep, { report: onMinus });

  const { tabindex, ...valueAttrs } = view.value.attrs;

  return (
    <div className={view.root.className} {...view.root.attrs} style={view.root.style as CSSProperties}>
      <span className={view.window.className} {...view.window.attrs}>
        <Text {...view.value.text} ref={number} className={view.value.className} tabIndex={Number(tabindex)} {...valueAttrs}>
          {view.value.label}
        </Text>
        <Text {...view.unit.text} className={view.unit.className} {...view.unit.attrs}>
          {view.unit.label}
        </Text>
      </span>
      <Text {...view.steps.text} className={view.steps.className} {...view.steps.attrs}>
        <Text as="button" {...view.plus.text} ref={upButton} className={view.plus.className} {...view.plus.attrs}>
          <span aria-hidden="true">{view.plus.glyph}</span>
        </Text>
        <Text as="button" {...view.minus.text} ref={downButton} className={view.minus.className} {...view.minus.attrs}>
          <span aria-hidden="true">{view.minus.glyph}</span>
        </Text>
      </Text>
    </div>
  );
}

export default TempoReadout;

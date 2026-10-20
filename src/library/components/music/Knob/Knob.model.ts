// Knob's model: its props and the view both renderers draw from them (classes, `data-*`, ARIA, the
// arc and pointer geometry, which texts show). No framework: `Knob.tsx` (React) and `Knob.svelte`
// (Svelte) both render `knobView`; the input is the `knobInput.ts` store beside it.
import type { HueSlot } from '../../core/hue';
import { focusRing } from '../../../primitives/Ring';
import type { ElementView, TextModelProps } from '../../../primitives/Text.model';
import { BOX, R, START, arc, point, sweepOf } from './geometry';
import { knobRootAttrs, type TipAction } from './knobInput';

export type { TipAction };

/** Every Knob prop (it has no framework children). */
export interface KnobModelProps {
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
  /** A categorical hue slot (1–5, `--hue-n`) for what owns this knob; an app maps its meaning (e.g. Yahaha's parts). Its arc wears that hue. Default: ink. */
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

/** What the renderers draw. */
export interface KnobView {
  /** The spoken name. */
  name: string;
  /** The button. */
  root: ElementView;
  /** The name's Text props (class `yh-knob__label`, `data-part="label"`). */
  label: Pick<TextModelProps, 'role' | 'weight' | 'case'>;
  /** The groove and the cap: Surface materials (well, handle) as plain spans with Surface's class and data. */
  track: ElementView;
  body: ElementView;
  /** The ring's `viewBox`. */
  viewBox: string;
  /** The lit arc's path; null when there is none. */
  arc: string | null;
  /** The pointer tick's ends; null when unused. */
  pointer: { x1: string; y1: string; x2: string; y2: string } | null;
  /** The value shown in the ring's centre; null when unused. */
  value: string | null;
  /** The unit after it; null when none. */
  unit: string | null;
  /** The Genos code line; null when none. */
  code: string | null;
}

/** A disc-shaped Surface span (no layer, so no shader): `lib-surface` with its material and corners. */
function disc(material: 'well' | 'handle', className: string, part: string): ElementView {
  return {
    className: `lib-surface ${className}`,
    attrs: { 'data-material': material, 'data-radius': 'circle', 'data-part': part, 'aria-hidden': 'true' },
  };
}

/** The knob's spoken name: `name`, else "{label} ({code}) {value}{unit}", or "unused". */
export function knobName({ label, code = '', value = '', unit = '', unused = false, name }: KnobModelProps): string {
  return name ?? (unused ? 'unused' : `${label}${code ? ` (${code})` : ''} ${value}${unit}`);
}

export function knobView(props: KnobModelProps): KnobView {
  const { code = '', value = '', unit = '', fraction = 0, unused = false, hue, tip } = props;
  const name = knobName(props);
  const deg = unused ? 0 : sweepOf(fraction);
  const lit = arc(START, START + deg);
  // The pointer: a short tick just outside the ring at the arc's end, so it never merges into the
  // lit arc (same ink on a neutral knob) and stays clear of the value in the centre.
  const tipOuter = point(START + deg, R + 7);
  const tipInner = point(START + deg, R + 3);
  // "0" and "Off" say "nothing here" and step back, as a send at 0 does (SendReadout).
  const rest = !unused && /^(0|off)$/i.test(value.trim());
  return {
    name,
    root: {
      className: `yh-knob ${focusRing}`,
      attrs: {
        ...knobRootAttrs(name),
        'data-part': 'root',
        'data-unused': unused ? 'true' : undefined,
        'data-rest': rest ? 'true' : undefined,
        'data-hue': hue === undefined ? undefined : String(hue),
        'data-tip': tip,
      },
    },
    label: { role: 'caption', weight: unused ? 'body' : 'strong', case: 'label' },
    track: disc('well', 'yh-knob__track', 'well'),
    body: disc('handle', 'yh-knob__body', 'body'),
    viewBox: `0 0 ${BOX} ${BOX}`,
    arc: !unused && lit ? lit : null,
    pointer: unused
      ? null
      : { x1: tipInner.x.toFixed(2), y1: tipInner.y.toFixed(2), x2: tipOuter.x.toFixed(2), y2: tipOuter.y.toFixed(2) },
    value: unused ? null : value,
    unit: unused || !unit ? null : unit,
    code: code ? code : null,
  };
}

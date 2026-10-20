// Knob's model: its props and the tree both renderers draw from them (classes, `data-*`, ARIA, the
// arc and pointer geometry, which texts show, the `knob` store it binds). No framework: `Knob.tsx`
// (React) and `Knob.svelte` (Svelte) both pass `knobView` and `knobHandlers` to their `Tree`; the
// input is the `knobInput.ts` store beside it, registered as `knob` in `src/library/view/stores.ts`.
import type { HueSlot } from '../../core/hue';
import { focusRing } from '../../../primitives/Ring';
import { textView, type ElementView, type TextModelProps } from '../../../primitives/Text.model';
import { h, wire, type Handlers, type Node } from '../../../view/Tree.model';
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

/** A disc-shaped Surface span (no layer, so no shader): `lib-surface` with its material and corners. */
function disc(material: 'well' | 'handle', className: string, part: string): Node {
  return h('span', { class: `lib-surface ${className}`, 'data-material': material, 'data-radius': 'circle', 'data-part': part, 'aria-hidden': 'true' });
}

/** A Text's attributes (its class and `data-*`) plus the part's name. */
function text(props: TextModelProps, part: string): Record<string, string | undefined> {
  const view: ElementView = textView(props);
  return { class: view.className, ...view.attrs, 'data-part': part };
}

/** The knob's spoken name: `name`, else "{label} ({code}) {value}{unit}", or "unused". */
export function knobName({ label, code = '', value = '', unit = '', unused = false, name }: KnobModelProps): string {
  return name ?? (unused ? 'unused' : `${label}${code ? ` (${code})` : ''} ${value}${unit}`);
}

/** The tree Knob draws: the button (binding the `knob` store), its name, the dial (well, cap, ring,
 *  value and unit) and the Genos code. */
export function knobView(props: KnobModelProps): Node {
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
  const label = text({ role: 'caption', weight: unused ? 'body' : 'strong', case: 'label', className: 'yh-knob__label' }, 'label');
  return wire(
    h(
      'button',
      {
        class: `yh-knob ${focusRing}`,
        ...knobRootAttrs(name),
        'data-part': 'root',
        'data-unused': unused ? 'true' : undefined,
        'data-rest': rest ? 'true' : undefined,
        'data-hue': hue === undefined ? undefined : String(hue),
        'data-tip': tip,
      },
      h('span', label, props.label),
      h(
        'span',
        { class: 'yh-knob__dial', 'data-part': 'dial' },
        // The groove: the full 270° sweep, cut from a disc so it can wear any material; then the cap the arc sits around.
        disc('well', 'yh-knob__track', 'well'),
        disc('handle', 'yh-knob__body', 'body'),
        h(
          'svg',
          { class: 'yh-knob__ring', viewBox: `0 0 ${BOX} ${BOX}`, 'aria-hidden': 'true' },
          !unused && lit ? h('path', { class: 'yh-knob__lit', 'data-part': 'arc', d: lit }) : null,
          unused
            ? null
            : h('line', {
                class: 'yh-knob__pointer',
                'data-part': 'pointer',
                x1: tipInner.x.toFixed(2),
                y1: tipInner.y.toFixed(2),
                x2: tipOuter.x.toFixed(2),
                y2: tipOuter.y.toFixed(2),
              }),
        ),
        unused
          ? null
          : h(
              'span',
              text({ role: 'numeral', className: 'yh-knob__value' }, 'value'),
              value,
              unit ? h('span', text({ role: 'body', size: 'caption', leading: 'tight', className: 'yh-knob__unit' }, 'unit'), unit) : null,
            ),
      ),
      code ? h('span', text({ role: 'caption', className: 'yh-knob__code' }, 'code'), code) : null,
    ),
    { bind: [['knob', { unused, tip, tipAction: 'tipAction', onpress: 'press', onstep: 'step' }]] },
  );
}

/** The callbacks `knobView`'s tree names: a press, a step, and the app's tooltip action. */
export function knobHandlers(props: KnobModelProps): Handlers {
  return { press: props.onpress, step: props.onstep, tipAction: props.tipAction };
}

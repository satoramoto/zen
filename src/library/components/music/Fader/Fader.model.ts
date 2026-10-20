// Fader's model: its props and the tree both renderers draw from them (classes, `data-*`, ARIA, the
// 0–1 positions it sets inline, the stores it binds). No framework: `Fader.tsx` (React) and
// `Fader.svelte` (Svelte) both pass `faderView` and `faderHandlers` to their `Tree`; the drag, wheel
// and keys are the `faderInput.ts` store beside it (registered as `faderInput` in
// `src/library/view/stores.ts`), the tooltip the kernel's `tip` store.
import type { HueSlot } from '../../core/hue';
import type { TipAction } from '../../core/Button/Button.model';
import { focusRing } from '../../../primitives/Ring';
import { surfaceView } from '../../../primitives/Surface.model';
import { textView, type TextModelProps } from '../../../primitives/Text.model';
import { h, styleText, wire, type Handlers, type Node } from '../../../view/Tree.model';

/** A categorical hue slot (1–5), or one of the neutral strips: `a`, `t2`, `t`. */
export type FaderHue = HueSlot | 'a' | 't2' | 't';
export type FaderKind = 'part' | 'group' | 'master' | 'off' | 'parked';

/** The parent's tooltip action: called with the node and the key; may return a handle whose `destroy` cleans up. */
export type FaderTipAction = TipAction;

/** The top of the travel: levels are 0–127, whole. */
export const FADER_MAX = 127;

/** Every Fader prop (it has no framework children). */
export interface FaderModelProps {
  /** The accessible name ("Right 1 · Stage Grand, level 90"). */
  name: string;
  /** The text at the top: the level ("90") or the layer and its value ("Rev 40"). Empty when parked. */
  value?: string;
  /** The set level, 0–127: where the cap sits. */
  level?: number;
  /** The left meter, 0–1 of the travel. The one meter drawn shows the louder of the two. */
  meter?: number;
  /** The right meter, 0–1 of the travel. */
  meter2?: number;
  /** The peak hold, 0–1 of the travel. Kept for the original's data; not drawn at Stage scale. */
  peak?: number;
  /** Where the hardware fader is, 0–127, while it's away from the level (soft takeover). Undefined: not away. */
  away?: number;
  /** `part`, `group`, `master` live; `off` a part switched off; `parked` an unused fader. */
  kind?: FaderKind;
  /**
   * The strip's identity: a hue slot (1–5, `--hue-n`; an app maps its meaning, e.g. Yahaha's parts)
   * fills the travel in that hue; `a`, `t2` and `t` are neutral strips (in Yahaha: Style, Multi Pad
   * and Master).
   */
  hue?: FaderHue;
  /** The non-Vol layer look (Pan, Reverb, Chorus, Delay): no meters, a neutral fill, the layer word as a label. */
  layered?: boolean;
  /** A fixed width in px. Default: fills its container. */
  width?: number;
  /** Fill the container's height instead of the fixed six-control-heights travel; a drag still measures the rail. Default false. */
  fillHeight?: boolean;
  /** With `kind="parked"`: an empty hardware slot, a faint solid groove (the banks' empty-slot look) instead of the dashed groove. */
  empty?: boolean;
  /** The tooltip key, rendered as `data-tip`. */
  tip?: string;
  /** The app's tooltip hook, called with the node and `tip` when both are set; may return a handle whose `destroy` cleans up. */
  tipAction?: FaderTipAction;
  /** Called with the level asked for (0–127, whole) on a drag (each level once), a key or the wheel. Not when parked. */
  onlevel?: (level: number) => void;
}

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** "Rev 40" → a layer word and its number; "90" stays a number. */
export function splitValue(value: string): { word: string; num: string } {
  const m = /^(\D+?)\s+(\S.*)$/.exec(value);
  return m ? { word: m[1], num: m[2] } : { word: '', num: value };
}

const ARROW = { up: 'M5 1 9 8H1z', down: 'M5 9 1 2h8z', at: 'M1 4h8v2H1z' } as const;

/** A Text's attributes (its class and `data-*`), plus any of the part's own. */
function text(props: TextModelProps, extra: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  const view = textView(props);
  return { class: view.className, ...view.attrs, ...extra };
}

/** A `well` Surface span with no corners (no layer, so no shader): `lib-surface`, its class and data. */
function well(className: string, part: string, style?: string): Node {
  const view = surfaceView({ material: 'well', radius: 'none', className });
  return h('span', { class: view.className, ...view.attrs, 'data-part': part, style });
}

/**
 * The tree Fader draws: the slider root (binding the `faderInput` store, which finds the rail by its
 * class, and the `tip` store), the head (layer word and number), the travel (groove, fill, ghost,
 * cap, the one meter) and the takeover arrow.
 */
export function faderView({
  name,
  value = '',
  level = 0,
  meter = 0,
  meter2 = 0,
  away,
  kind = 'part',
  hue = 't',
  layered = false,
  width,
  fillHeight = false,
  empty = false,
  tip,
}: FaderModelProps): Node {
  const parked = kind === 'parked';
  const off = kind === 'off';
  const live = !parked && !off;
  const showMeters = !parked && !layered;
  const direction = away === undefined || parked ? undefined : away < level ? 'up' : away > level ? 'down' : 'at';
  const { word, num } = splitValue(parked ? '' : value);
  return wire(
    h(
      'div',
      {
        class: `yh-fader ${focusRing}`,
        tabindex: '0',
        role: 'slider',
        'aria-label': name,
        'aria-orientation': 'vertical',
        'aria-valuemin': '0',
        'aria-valuemax': String(FADER_MAX),
        'aria-valuenow': String(clamp(Math.round(level), 0, FADER_MAX)),
        'aria-valuetext': parked ? undefined : value || undefined,
        'aria-disabled': parked ? 'true' : undefined,
        'data-kind': kind,
        'data-hue': layered || typeof hue !== 'number' ? undefined : String(hue),
        'data-layered': layered ? 'true' : undefined,
        'data-fill-height': fillHeight ? 'true' : undefined,
        'data-empty': parked && empty ? 'true' : undefined,
        'data-away': direction,
        'data-tip': tip,
        style: styleText({ '--yh-fader-level': String(clamp(level, 0, FADER_MAX) / FADER_MAX), width: width === undefined ? undefined : `${width}px` }),
      },
      h(
        'span',
        { class: 'yh-fader__head', 'data-part': 'head', 'aria-hidden': 'true' },
        word ? h('span', text({ role: 'label', size: 'caption', leading: 'tight', className: 'yh-fader__word' }), word) : null,
        // Off, the number steps down a size as well as a shade, so it never competes with a live level.
        h('span', text({ role: 'numeral', size: off ? 'label' : 'heading', className: 'yh-fader__value' }, { 'data-part': 'value' }), num),
      ),
      h(
        'span',
        { class: 'yh-fader__travel', 'data-part': 'travel', 'aria-hidden': 'true' },
        h(
          'span',
          { class: 'yh-fader__rail' },
          well('yh-fader__groove', 'groove'),
          parked ? null : h('span', { class: 'yh-fader__fill', 'data-part': 'fill' }),
          direction === undefined
            ? null
            : h('span', { class: 'yh-fader__ghost', 'data-part': 'ghost', style: styleText({ '--yh-fader-away': String(clamp(away!, 0, FADER_MAX) / FADER_MAX) }) }),
          parked ? null : h('span', { class: 'yh-fader__cap', 'data-part': 'cap' }),
        ),
        // One meter, the louder side: two read as a second, thinner fader at Stage scale.
        showMeters
          ? h(
              'span',
              { class: 'yh-fader__meters' },
              well('yh-fader__meter', 'meter', styleText({ '--yh-fader-m': String(live ? clamp(Math.max(meter, meter2), 0, 1) : 0) })),
            )
          : null,
      ),
      direction === undefined ? null : h('svg', { class: 'yh-fader__takeover', viewBox: '0 0 10 10', 'aria-hidden': 'true' }, h('path', { d: ARROW[direction] })),
    ),
    {
      bind: [
        ['faderInput', { level, parked, onlevel: 'level' }],
        ['tip', { tip, tipAction: 'tipAction' }],
      ],
    },
  );
}

/** The callbacks `faderView`'s tree names: the level asked for, and the app's tooltip action. */
export function faderHandlers(props: FaderModelProps): Handlers {
  return { level: props.onlevel, tipAction: props.tipAction };
}

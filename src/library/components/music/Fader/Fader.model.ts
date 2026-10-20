// Fader's model: its props and the strip it draws from them (classes, `data-*`, ARIA and the 0–1
// positions it sets inline). No framework: `Fader.tsx` (React) and `Fader.svelte` (Svelte) both
// render `faderView`; the drag, wheel and keys are the `faderInput.ts` store beside it.
import type { HueSlot } from '../../core/hue';
import { focusRing } from '../../../primitives/Ring';
import type { ElementView, TextSize } from '../../../primitives/Text.model';

/** A categorical hue slot (1–5), or one of the neutral strips: `a`, `t2`, `t`. */
export type FaderHue = HueSlot | 'a' | 't2' | 't';
export type FaderKind = 'part' | 'group' | 'master' | 'off' | 'parked';

/** The parent's tooltip action: called with the node and the key; may return a handle whose `destroy` cleans up. */
export type FaderTipAction = (node: HTMLElement, key: string) => { update?: (key: string) => void; destroy?: () => void } | void;

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

/** A part drawn as a `Surface` (React) or a plain element with Surface's attributes (Svelte). */
export interface SurfacePart {
  /** The Surface props: what it is made of and its corners. */
  surface: { material: 'well'; radius: 'none' };
  /** The part's own class (after `lib-surface`). */
  className: string;
  /** Its `data-part`. */
  attrs: Record<string, string | undefined>;
  /** Inline custom properties, or none. */
  style?: Record<string, string>;
}

/** The attributes `Surface` emits for a part's surface props (Svelte draws them itself; no shader here, there is no layer). */
export function surfaceAttrs({ material, radius }: SurfacePart['surface']): Record<string, string | undefined> {
  return { 'data-material': material, 'data-radius': radius };
}

/** What a renderer draws. */
export interface FaderView {
  /** The root `div`: its class, slider role, ARIA, `data-*`, and inline style. `tabindex` is `tabIndex` (0). */
  root: ElementView & { tabIndex: number; style: Record<string, string | undefined> };
  /** The layer word over the number ("Rev"), or empty for none. */
  word: string;
  /** The number. */
  num: string;
  /** The number's Text size: a step down when off. */
  numSize: TextSize;
  groove: SurfacePart;
  /** Whether the fill and cap are drawn (not parked). */
  fill: boolean;
  /** The ghost cap's 0–1 position while away, or null. */
  ghost: Record<string, string> | null;
  /** The one meter (the louder side), or null with no meters. */
  meter: SurfacePart | null;
  /** The takeover arrow's path, or null when not away. */
  takeover: string | null;
  /** Whether the fader is parked: shown, not usable. */
  parked: boolean;
}

const ARROW = { up: 'M5 1 9 8H1z', down: 'M5 9 1 2h8z', at: 'M1 4h8v2H1z' } as const;

/** The strip Fader draws from its props. */
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
}: FaderModelProps): FaderView {
  const parked = kind === 'parked';
  const off = kind === 'off';
  const live = !parked && !off;
  const showMeters = !parked && !layered;
  const direction = away === undefined || parked ? undefined : away < level ? 'up' : away > level ? 'down' : 'at';
  const { word, num } = splitValue(parked ? '' : value);
  return {
    root: {
      className: `yh-fader ${focusRing}`,
      tabIndex: 0,
      attrs: {
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
      },
      style: { '--yh-fader-level': String(clamp(level, 0, FADER_MAX) / FADER_MAX), width: width === undefined ? undefined : `${width}px` },
    },
    word,
    num,
    // Off, the number steps down a size as well as a shade, so it never competes with a live level.
    numSize: off ? 'label' : 'heading',
    groove: { surface: { material: 'well', radius: 'none' }, className: 'yh-fader__groove', attrs: { 'data-part': 'groove' } },
    fill: !parked,
    ghost: direction === undefined ? null : { '--yh-fader-away': String(clamp(away!, 0, FADER_MAX) / FADER_MAX) },
    // One meter, the louder side: two read as a second, thinner fader at Stage scale.
    meter: showMeters
      ? {
          surface: { material: 'well', radius: 'none' },
          className: 'yh-fader__meter',
          attrs: { 'data-part': 'meter' },
          style: { '--yh-fader-m': String(live ? clamp(Math.max(meter, meter2), 0, 1) : 0) },
        }
      : null,
    takeover: direction === undefined ? null : ARROW[direction],
    parked,
  };
}

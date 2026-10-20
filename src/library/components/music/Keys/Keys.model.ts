// Keys' model: its props, the strip it draws from them (classes, `data-*`, ARIA, inline lengths,
// text), and the pure steps of setting the split. No framework: `Keys.tsx` (React) and
// `Keys.svelte` (Svelte) both render `keysView`; the pointer and keyboard input is the
// `keysInput.ts` store and the measured width the `fillWidth.ts` store, beside it.
import type { HueSlot } from '../../core/hue';
import type { TextModelProps } from '../../../primitives/Text.model';
import {
  BLACK_HEIGHT_RATIO,
  BLACK_WIDTH_RATIO,
  chordNames,
  heldNames,
  keysLabel,
  layout,
  noteAt,
  noteName,
  type KeyPart,
  type KeyRange,
  type KeysLayout,
} from './keyLayout';

/** The app's tooltip hook, applied to the split handle (the original's `use:tip` action). */
export type TipAction = (node: HTMLElement, key: string) => { destroy?: () => void } | void;

/** Every Keys prop (it takes no children). */
export interface KeysModelProps {
  /** The lowest and highest MIDI note shown, both included (C3 = 60). Default: C1-C6, 61 keys. */
  range?: KeyRange;
  /** The split note, the highest note of the left zone; null = no split (no left zone). */
  split?: number | null;
  /** The held notes the left zone plays: they fill in `leftHue`. */
  heldLeft?: number[];
  /** The held notes the right zone plays: they fill in `rightHue`. */
  heldRight?: number[];
  /**
   * The left zone's categorical hue slot (`--hue-n`), for its lamp and held keys; an app maps its
   * meaning (e.g. Yahaha's Left part takes 4). Default 4.
   */
  leftHue?: HueSlot;
  /** The left zone's name on the ruler. Default "Left". */
  leftName?: string;
  /**
   * The right zone's categorical hue slot (`--hue-n`), for its lamp and held keys; an app maps
   * its meaning (e.g. Yahaha's Right 1–3 parts take 1–3). Default 1.
   */
  rightHue?: HueSlot;
  /** The right zone's name on the ruler. Default "Right". */
  rightName?: string;
  /**
   * The widget's width: px, or `'fill'` to take its container's width and lay the keys out from
   * the measured width (re-laid on every resize). Default 1392.
   */
  width?: number | 'fill';
  /**
   * The zone ruler above the keys: each zone's name, what it holds, the split's name. Default
   * true. Off, it is just the keys (one strip height): held keys still wear their zone's hue, so
   * the split reads on the keys, and the picture's accessible label still says it all. With
   * `onSplit` the handle stays (the split line is its hit column), without its labelled flag.
   */
  ruler?: boolean;
  /** The lowest and highest note the split may be set to (the engine's 24-96). */
  splitMin?: number;
  splitMax?: number;
  /** Parameter lock on the split: the handle reads as locked and nothing here moves it. */
  splitLocked?: boolean;
  /** Armed: the next key pressed with the pointer becomes the split. */
  picking?: boolean;
  /** The app's tooltip hook, applied to the split handle with the key `settings.split_strip`. */
  tipAction?: TipAction;
  /** Asks for a new split note (a drag, an arrow, or a key picked while armed). Without it the keys are a picture. */
  onSplit?: (note: number) => void;
  /** Asks to arm (`true`) or disarm (`false`) the pick: a click on the handle, Enter, Esc, or a key picked. */
  onPick?: (armed: boolean) => void;
}

/** The handle's tooltip key. */
export const KEYS_TIP = 'settings.split_strip';
/** A drag moves the split only once the pointer has moved this far, so a click stays a click. */
export const DRAG_SLOP = 3;

const px = (n: number) => `${n}px`;

/** Attributes: every value a string, or undefined for none. */
type Attrs = Record<string, string | undefined>;
/** Inline style declarations by CSS property name (custom properties included). */
type Style = Record<string, string>;

/** One zone on the ruler: its name, then the pick hint or what it holds. */
export interface KeysZoneView {
  side: KeyPart;
  attrs: Attrs;
  style: Style;
  name: string;
  /** The armed hint replaces what it holds (the right zone, or the only one). */
  hint: boolean;
  /** What it holds, joined ("G A C E"); null when nothing. */
  held: string | null;
}

/** One white key: a caption `Text` rendered as a `div`, its C name as its text. */
export interface KeysWhiteView {
  note: number;
  text: TextModelProps;
  attrs: Attrs;
  style: Style;
  label: string;
}

export interface KeysBlackView {
  note: number;
  attrs: Attrs;
  style: Style;
}

/** What the input store reads: the split's settings and the geometry the pointer maps through. */
export interface KeysSettings {
  split: number | null;
  splitMin: number;
  splitMax: number;
  splitLocked: boolean;
  picking: boolean;
  /** The layout width, px (the measured width with `width="fill"`). */
  width: number;
  keys: KeysLayout;
  blackWidth: number;
}

/** What a renderer draws. */
export interface KeysView {
  root: { className: string; attrs: Attrs; style: Style };
  /** Whether the root measures its own width (`width="fill"`). */
  fill: boolean;
  /** The ruler's zones and, without a handle, the split's name on it; null with `ruler={false}`. */
  ruler: { zones: KeysZoneView[]; marker: { style: Style; text: string } | null } | null;
  strip: { attrs: Attrs };
  whites: KeysWhiteView[];
  blacks: KeysBlackView[];
  /** The split line; `join` draws its step round a black key. Null without a split on the keys. */
  split: { attrs: Attrs; join: boolean } | null;
  /** Armed: the pick surface over the keys. */
  pick: boolean;
  /** Armed, for the Esc that disarms. */
  armed: boolean;
  /** The split handle (with `onSplit` and a split on the keys), focusable (`tabindex` 0, set by each renderer); its text is the split's name. */
  handle: { attrs: Attrs; style: Style; text: string } | null;
  settings: KeysSettings;
}

/**
 * The strip Keys draws from its props. `measured` is the root's own width, px, read by the
 * renderer with `width="fill"` (0 until measured); ignored for a fixed width.
 */
export function keysView(
  {
    range = { low: 36, high: 96 },
    split = 54,
    heldLeft = [],
    heldRight = [],
    leftHue = 4,
    leftName = 'Left',
    rightHue = 1,
    rightName = 'Right',
    width: widthProp = 1392,
    ruler = true,
    splitMin = 24,
    splitMax = 96,
    splitLocked = false,
    picking = false,
    onSplit,
  }: KeysModelProps,
  measured = 0,
): KeysView {
  const fill = widthProp === 'fill';
  // Unmeasured (first render without layout, or a hidden container), the layout runs at 0 px: no
  // division by it, and the root hides its contents until it has a width.
  const width = fill ? Math.max(0, measured) : Math.max(0, widthProp);
  const unmeasured = fill && measured <= 0;
  const keys = layout(range, width, split, heldLeft, heldRight);
  const hueOf = (side: KeyPart | null) => (side === 'left' ? String(leftHue) : side === 'right' ? String(rightHue) : undefined);
  const interactive = onSplit !== undefined && split !== null;
  const armed = interactive && picking && !splitLocked;
  const blackWidth = keys.whiteWidth * BLACK_WIDTH_RATIO;
  // Where the split line meets the top of the keys: the zones and the flag meet there.
  const topX = keys.splitX === null ? null : keys.splitX + (keys.splitStep * blackWidth) / 2;
  const splitName = split === null ? '' : noteName(split);

  const zone = (side: KeyPart): KeysZoneView => {
    const right = side === 'right';
    const from = right ? (topX ?? 0) : 0;
    const to = right ? width : (topX ?? width);
    const held = right ? heldNames(split === null ? [...heldLeft, ...heldRight] : heldRight) : chordNames(heldLeft);
    const lit = right ? heldRight.length > 0 || (split === null && heldLeft.length > 0) : heldLeft.length > 0;
    return {
      side,
      attrs: {
        'data-part': 'zone',
        'data-side': side,
        'data-hue': String(right ? rightHue : leftHue),
        'data-split': topX !== null ? '' : undefined,
        'data-on': lit ? 'true' : 'false',
      },
      style: { left: px(from), width: px(Math.max(0, to - from)) },
      name: right ? rightName : leftName,
      hint: armed && right,
      held: held.length > 0 ? held.join(' ') : null,
    };
  };
  const zones =
    topX !== null ? [zone('left'), zone('right')] : split !== null && split >= range.high ? [zone('left')] : [zone('right')];

  const handle =
    interactive && topX !== null
      ? {
          attrs: {
            'data-part': 'handle',
            role: 'slider',
            'aria-label': splitLocked
              ? 'Split point (locked)'
              : armed
                ? 'Split point: click a key to set it, Esc cancels'
                : 'Split point: drag, or click then click a key',
            'aria-orientation': 'horizontal',
            'aria-valuemin': String(splitMin),
            'aria-valuemax': String(splitMax),
            'aria-valuenow': String(split),
            'aria-valuetext': splitName,
            'aria-disabled': splitLocked ? 'true' : undefined,
            'data-tip': KEYS_TIP,
          },
          style: { left: px(topX) },
          text: splitName,
        }
      : null;

  return {
    root: {
      className: 'yh-keys',
      attrs: {
        'data-part': 'root',
        'data-width': fill ? 'fill' : undefined,
        'data-unmeasured': unmeasured ? '' : undefined,
        'data-picking': armed ? '' : undefined,
        'data-locked': splitLocked ? '' : undefined,
        'data-ruler': ruler ? undefined : 'off',
      },
      style: {
        width: fill ? '100%' : px(width),
        '--yh-keys-black-w': px(blackWidth),
        '--yh-keys-split-x': px(keys.splitX ?? 0),
        '--yh-keys-split-step': String(keys.splitStep),
      },
    },
    fill,
    ruler: ruler
      ? { zones, marker: !interactive && topX !== null ? { style: { left: px(topX) }, text: splitName } : null }
      : null,
    strip: { attrs: { 'data-part': 'strip', role: 'img', 'aria-label': keysLabel(range, split, heldLeft, heldRight) } },
    whites: keys.whites.map((key) => ({
      note: key.note,
      text: { role: 'body', size: 'caption', leading: 'tight', weight: key.held ? 'strong' : undefined, tabular: true },
      attrs: {
        'data-part': 'white',
        'data-held': key.held ?? undefined,
        'data-hue': hueOf(key.held),
        'data-c': key.label ? '' : undefined,
      },
      style: { left: px(key.x), width: px(keys.whiteWidth) },
      label: key.label,
    })),
    blacks: keys.blacks.map((key) => ({
      note: key.note,
      attrs: { 'data-part': 'black', 'data-held': key.held ?? undefined, 'data-hue': hueOf(key.held) },
      style: { left: px(key.x) },
    })),
    split: keys.splitX !== null ? { attrs: { 'data-part': 'split', 'data-step': String(keys.splitStep) }, join: keys.splitStep !== 0 } : null,
    pick: armed,
    armed,
    handle,
    settings: { split, splitMin, splitMax, splitLocked, picking, width, keys, blackWidth },
  };
}

/** The split note asked for `note`: clamped to the limits and rounded; null when locked, without a split, or already there. */
export function askedSplit(note: number | null, { split, splitMin, splitMax, splitLocked }: Pick<KeysSettings, 'split' | 'splitMin' | 'splitMax' | 'splitLocked'>): number | null {
  if (note === null || splitLocked || split === null) return null;
  const next = Math.max(splitMin, Math.min(splitMax, Math.round(note)));
  return next !== split ? next : null;
}

/** The note a key on the handle steps the split to (arrows a semitone, PageUp/PageDown an octave, Home/End the limits); null for any other key. */
export function steppedSplit(key: string, { split, splitMin, splitMax }: Pick<KeysSettings, 'split' | 'splitMin' | 'splitMax'>): number | null {
  if (split === null) return null;
  const to: Record<string, number> = {
    ArrowRight: split + 1,
    ArrowUp: split + 1,
    ArrowLeft: split - 1,
    ArrowDown: split - 1,
    PageUp: split + 12,
    PageDown: split - 12,
    Home: splitMin,
    End: splitMax,
  };
  return key in to ? to[key] : null;
}

/**
 * The key under a client point, given the strip's box: `top` reads it at the black keys' height
 * (a drag: black keys by x alone). The strip may be drawn scaled (screens scale to fit): the point
 * is mapped back to its own px.
 */
export function noteUnder(
  { keys, width, blackWidth }: Pick<KeysSettings, 'keys' | 'width' | 'blackWidth'>,
  box: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number,
  top: boolean,
): number | null {
  const scale = box.width > 0 ? width / box.width : 1;
  const x = (clientX - box.left) * scale;
  const y = top ? 0 : (clientY - box.top) * scale;
  return noteAt(keys, x, y, blackWidth, box.height * scale * BLACK_HEIGHT_RATIO);
}

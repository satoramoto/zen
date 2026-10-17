import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import type { HueSlot } from '../../core/hue';
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
} from './keyLayout';
import { Text } from '../../../primitives/Text';
import './Keys.css';

/** The app's tooltip hook, applied to the split handle (the original's `use:tip` action). */
export type TipAction = (node: HTMLElement, key: string) => { destroy?: () => void } | void;

export interface KeysProps {
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

/** A drag moves the split only once the pointer has moved this far, so a click stays a click. */
const DRAG_SLOP = 3;
const TIP = 'settings.split_strip';
const px = (n: number) => `${n}px`;

type Zone = { side: KeyPart; name: string; hue: HueSlot; from: number; to: number; held: string[]; lit: boolean };

/**
 * The root's own width in layout px (unscaled, so a frame drawn scaled still lays out at design
 * px), while `on`; 0 until measured. Read before paint, then on every resize.
 */
function useFillWidth(on: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!on || !el) return;
    const read = () => setMeasured(Math.max(0, el.clientWidth));
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [on]);
  return [ref, measured] as const;
}

/**
 * The keyboard strip: the keyboard's range, where the split sits, and what each zone (left and
 * right of the split; in Yahaha, the parts) is holding.
 *
 * **Job.** At a glance a player needs three things: which zone owns which keys, where the split
 * is (as a note name, not a guess from position), and which keys are sounding. With `onSplit` it
 * is also where the split is set: drag the split flag, step it with the arrows (PageUp/PageDown an
 * octave, Home/End the limits), or click it (Enter) to arm a pick and press the key that should
 * become the split. Esc disarms.
 *
 * **Changed.** *Hierarchy:* a zone ruler above the keys names each zone (`leftName`, `rightName`:
 * "Left", "Right 1") and what it holds ("G A C E", "E4 A4"), so the picture's accessible label is also what a sighted
 * player reads; before, held notes were only colour on keys. The ruler is the line a player
 * wants mid-song, so it is a full `--control-h` tall and readable from a metre: what is held at
 * `--size-body` in the strong weight, the zone's name at `--size-label` in `--text-2`. Held keys
 * no longer carry their own small name: it said again, at caption size, what the ruler says.
 * *Colour meaning:* each zone's lamp is its underline on the ruler, in the zone's hue slot
 * (`leftHue`, `rightHue`), lit with `--bloom` while the zone sounds, so the zone's name, its
 * colour and its keys line up; as a 3px
 * strip on the keys' top edge it was cut by every sharp and read as the frame. *Affordance:* the split is a labelled
 * flag reading the split note ("F#2") with a grip, sitting on the split line, instead of a 6px
 * grip lost in the keys; locked it turns dashed and loses its grip, armed it rings in `--accent`
 * with a "press a key" hint, so each state looks like what it does (craft-details.md, focus and
 * keyboard handlers). *Contrast:* the keys are drawn as keys, light faces and dark sharps in either
 * scheme, in a real keyboard's proportions, rather than near-black on black (color.md, light and
 * dark themes); the faces are the contract's `--key-white` and `--key-black`, and the gaps,
 * sharp edges and C names are mixed between them, not derived from the ground; the C names sit at
 * a 45% mix so they read on the faces. The split line is one ink with the flag's foot,
 * `--text-1`, with a 1px halo in whichever key face lies farthest from it, so it can't be taken
 * for a key gap below the sharps in any scheme. Hue slots (`--hue-N`) appear only for zone
 * identity, in the zone underlines and the held keys; the left-zone tint is gone because the
 * underline and ruler already say who owns the range (color.md 60/30/10, anti-ai-slop.md token
 * role drift). *Numerals:* note names are set in `--font-readout` with tabular figures.
 *
 * **Width.** A fixed `width` in px, or `width="fill"`: the strip takes its container's width
 * (`width: 100%`), measures itself before paint and on every resize (a `ResizeObserver`), and lays
 * the keys out from that, so a caller no longer measures for it. Until it has a width (a hidden
 * container, or no layout yet) it keeps its height and hides its contents rather than drawing
 * keys at 0 px.
 *
 * **Kept.** MIDI numbers with C3 = 60 and a name on every C; the split line that steps round a
 * black key the way the keys' own edges do; held right notes drawing over held left ones; the
 * controlled model (the strip only asks through `onSplit`/`onPick`); the slider semantics,
 * keyboard steps, drag slop, Esc caught before the app's, and the accessible names.
 *
 * **Built from.** No `Surface`, `Text` or `focusRing` yet: the key faces are the contract's
 * `--key-white` / `--key-black`, not the `key` material, so a Surface would change them; the
 * ruler's type mixes weights the text roles don't pair (a label at body weight, readout figures
 * at label size); and focus lands on the handle while its ring is drawn on the flag inside it.
 *
 * **Tuning knobs.**
 * - `--yh-keys-black-w`, `--yh-keys-split-x`, `--yh-keys-split-step`: the layout's geometry (a
 *   sharp's width, the split's x and its step round a sharp), set inline from the key layout.
 * - `--yh-keys-ruler-h`, `--yh-keys-strip-h`, `--yh-keys-black-h`, `--yh-keys-flag-w`: the ruler's
 *   and strip's heights, a sharp's length, the split flag's width; all from `--control-h`.
 * - `--yh-keys-line`, `--yh-keys-key-radius`: the split line's weight, a key's lower corners.
 * - `--yh-keys-white`, `--yh-keys-black`, `--yh-keys-gap`, `--yh-keys-sharp-edge`,
 *   `--yh-keys-label`: the key faces and the steps between them (gaps, a sharp's edge, C names).
 * - `--yh-keys-split-ink`, `--yh-keys-split-halo`: the split line's ink and the halo that keeps it
 *   off the faces.
 * - `--yh-keys-hue`: a zone's hue slot, for its lamp and held keys.
 */
export function Keys({
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
  tipAction,
  onSplit,
  onPick,
}: KeysProps) {
  const fill = widthProp === 'fill';
  const [rootRef, measured] = useFillWidth(fill);
  // Unmeasured (first render without layout, or a hidden container), the layout runs at 0 px: no
  // division by it, and the root hides its contents until it has a width.
  const width = fill ? measured : Math.max(0, widthProp);
  const unmeasured = fill && measured <= 0;
  const keys = useMemo(
    () => layout(range, Math.max(0, width), split, heldLeft, heldRight),
    [range, width, split, heldLeft, heldRight],
  );
  const hueOf = (side: KeyPart | null) => (side === 'left' ? leftHue : side === 'right' ? rightHue : undefined);
  const label = keysLabel(range, split, heldLeft, heldRight);
  const interactive = onSplit !== undefined && split !== null;
  const armed = interactive && picking && !splitLocked;
  const blackWidth = keys.whiteWidth * BLACK_WIDTH_RATIO;
  // Where the split line meets the top of the keys: the zones and the flag meet there.
  const topX = keys.splitX === null ? null : keys.splitX + (keys.splitStep * blackWidth) / 2;

  const zones: Zone[] = useMemo(() => {
    const right: Zone = {
      side: 'right',
      name: rightName,
      hue: rightHue,
      from: topX ?? 0,
      to: width,
      held: heldNames(split === null ? [...heldLeft, ...heldRight] : heldRight),
      lit: heldRight.length > 0 || (split === null && heldLeft.length > 0),
    };
    const left: Zone = {
      side: 'left',
      name: leftName,
      hue: leftHue,
      from: 0,
      to: topX ?? width,
      held: chordNames(heldLeft),
      lit: heldLeft.length > 0,
    };
    if (topX !== null) return [left, right];
    if (split !== null && split >= range.high) return [left];
    return [right];
  }, [topX, width, split, heldLeft, heldRight, leftName, leftHue, rightName, rightHue, range.high]);

  const strip = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLSpanElement>(null);

  // The app's tooltip, on the handle.
  const hasHandle = interactive && topX !== null;
  useEffect(() => {
    if (!tipAction || !handle.current) return;
    const result = tipAction(handle.current, TIP);
    return () => result?.destroy?.();
  }, [tipAction, hasHandle]);

  // Esc while armed disarms, and only that: caught first so the app's Esc doesn't also leave the screen.
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  useEffect(() => {
    if (!armed) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      pickRef.current?.(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [armed]);

  /** Asks for a split note, clamped to the limits; nothing when it is already there or locked. */
  function ask(note: number | null) {
    if (note === null || splitLocked || split === null) return;
    const next = Math.max(splitMin, Math.min(splitMax, Math.round(note)));
    if (next !== split) onSplit?.(next);
  }

  /** The key under a pointer; `top` reads it at the black keys' height (a drag: black keys by x alone). */
  function keyUnder(event: PointerEvent, top: boolean): number | null {
    const box = strip.current?.getBoundingClientRect();
    if (!box) return null;
    // The strip may be drawn scaled (screens scale to fit): map back to its own px.
    const scale = box.width > 0 ? width / box.width : 1;
    const x = (event.clientX - box.left) * scale;
    const y = top ? 0 : (event.clientY - box.top) * scale;
    return noteAt(keys, x, y, blackWidth, box.height * scale * BLACK_HEIGHT_RATIO);
  }

  function capture(event: PointerEvent) {
    try {
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
  }

  // The handle: drag to move; a click (no drag) arms or disarms the pick.
  const drag = useRef<{ pointer: number; startX: number; dragged: boolean } | null>(null);

  function handleDown(event: PointerEvent) {
    if (event.button !== 0 || splitLocked) return;
    drag.current = { pointer: event.pointerId, startX: event.clientX, dragged: false };
    capture(event);
  }
  function handleMove(event: PointerEvent) {
    const d = drag.current;
    if (!d || d.pointer !== event.pointerId) return;
    if (!d.dragged && Math.abs(event.clientX - d.startX) < DRAG_SLOP) return;
    d.dragged = true;
    ask(keyUnder(event, true));
  }
  function handleUp(event: PointerEvent) {
    const d = drag.current;
    if (!d || d.pointer !== event.pointerId) return;
    drag.current = null;
    if (!d.dragged) onPick?.(!picking);
  }
  function handleCancel(event: PointerEvent) {
    if (drag.current?.pointer === event.pointerId) drag.current = null;
  }

  function handleKey(event: KeyboardEvent) {
    if (split === null) return;
    if (event.key === 'Escape') {
      if (picking) {
        event.preventDefault();
        onPick?.(false);
      }
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!splitLocked) onPick?.(!picking);
      return;
    }
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
    if (!(event.key in to)) return;
    event.preventDefault();
    ask(to[event.key]);
  }

  // The pick, while armed: the key pressed becomes the split; sliding keeps choosing; lifting disarms.
  const pickPointer = useRef<number | null>(null);

  function pickDown(event: PointerEvent) {
    if (event.button !== 0) return;
    pickPointer.current = event.pointerId;
    capture(event);
    ask(keyUnder(event, false));
  }
  function pickMove(event: PointerEvent) {
    if (pickPointer.current === event.pointerId) ask(keyUnder(event, false));
  }
  function pickUp(event: PointerEvent) {
    if (pickPointer.current !== event.pointerId) return;
    pickPointer.current = null;
    onPick?.(false);
  }
  function pickCancel(event: PointerEvent) {
    if (pickPointer.current === event.pointerId) pickPointer.current = null;
  }

  const rootStyle = {
    width: fill ? '100%' : px(width),
    '--yh-keys-black-w': px(blackWidth),
    '--yh-keys-split-x': px(keys.splitX ?? 0),
    '--yh-keys-split-step': keys.splitStep,
  } as CSSProperties;

  const splitName = split === null ? '' : noteName(split);

  return (
    <div
      className="yh-keys"
      data-part="root"
      ref={rootRef}
      style={rootStyle}
      data-width={fill ? 'fill' : undefined}
      data-unmeasured={unmeasured ? '' : undefined}
      data-picking={armed ? '' : undefined}
      data-locked={splitLocked ? '' : undefined}
      data-ruler={ruler ? undefined : 'off'}
    >
      {ruler && (
      <div className="yh-keys__ruler" data-part="ruler" aria-hidden="true">
        {zones.map((zone) => (
          <div
            key={zone.side}
            className="yh-keys__zone"
            data-part="zone"
            data-side={zone.side}
            data-hue={zone.hue}
            data-split={topX !== null ? '' : undefined}
            data-on={zone.lit ? 'true' : 'false'}
            style={{ left: px(zone.from), width: px(Math.max(0, zone.to - zone.from)) }}
          >
            <Text role="body" size="label" case="label" className="yh-keys__part" data-part="zone-name">
              {zone.name}
            </Text>
            {armed && zone.side !== 'left' ? (
              <Text role="body" size="label" className="yh-keys__hint" data-part="hint">
                Press a key to set the split · Esc cancels
              </Text>
            ) : (
              zone.held.length > 0 && (
                <Text role="body" weight="strong" tabular className="yh-keys__held" data-part="held">
                  {zone.held.join(' ')}
                </Text>
              )
            )}
          </div>
        ))}
        {!interactive && topX !== null && (
          <Text
            role="body"
            size="label"
            weight="strong"
            tabular
            className="yh-keys__marker"
            data-part="marker"
            style={{ left: px(topX) }}
          >
            {splitName}
          </Text>
        )}
      </div>
      )}

      <div className="yh-keys__body" data-part="body">
        <div className="yh-keys__strip" data-part="strip" role="img" aria-label={label} ref={strip}>
          {keys.whites.map((key) => (
            <Text
              as="div"
              role="body"
              size="caption"
              leading="tight"
              weight={key.held ? 'strong' : undefined}
              tabular
              key={key.note}
              className="yh-keys__white"
              data-part="white"
              data-held={key.held ?? undefined}
              data-hue={hueOf(key.held)}
              data-c={key.label ? '' : undefined}
              style={{ left: px(key.x), width: px(keys.whiteWidth) }}
            >
              {key.label}
            </Text>
          ))}
          {keys.blacks.map((key) => (
            <div
              key={key.note}
              className="yh-keys__black"
              data-part="black"
              data-held={key.held ?? undefined}
              data-hue={hueOf(key.held)}
              style={{ left: px(key.x) }}
            />
          ))}
          {keys.splitX !== null && (
            <div className="yh-keys__split" data-part="split" data-step={keys.splitStep}>
              <span className="yh-keys__split-top" data-part="split-top" />
              {keys.splitStep !== 0 && <span className="yh-keys__split-join" data-part="split-join" />}
              <span className="yh-keys__split-bottom" data-part="split-bottom" />
            </div>
          )}
        </div>
        {armed && (
          // The pick surface: pointer only (the handle's arrows are the keyboard's way).
          <div
            className="yh-keys__pick"
            data-part="pick"
            aria-hidden="true"
            onPointerDown={pickDown}
            onPointerMove={pickMove}
            onPointerUp={pickUp}
            onPointerCancel={pickCancel}
          />
        )}
      </div>

      {hasHandle && split !== null && (
        <span
          ref={handle}
          className="yh-keys__handle"
          data-part="handle"
          role="slider"
          tabIndex={0}
          style={{ left: px(topX ?? 0) }}
          aria-label={
            splitLocked
              ? 'Split point (locked)'
              : armed
                ? 'Split point: click a key to set it, Esc cancels'
                : 'Split point: drag, or click then click a key'
          }
          aria-orientation="horizontal"
          aria-valuemin={splitMin}
          aria-valuemax={splitMax}
          aria-valuenow={split}
          aria-valuetext={splitName}
          aria-disabled={splitLocked ? 'true' : undefined}
          data-tip={TIP}
          onKeyDown={handleKey}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleCancel}
        >
          <Text role="body" size="label" weight="strong" leading="tight" tabular className="yh-keys__flag" data-part="flag">
            <span className="yh-keys__grip" data-part="grip" aria-hidden="true" />
            {splitName}
          </Text>
        </span>
      )}
    </div>
  );
}

export default Keys;

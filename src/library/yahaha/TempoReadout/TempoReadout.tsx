import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, type RefObject } from 'react';
import type { TipAction } from '../Pad/Pad';
import './TempoReadout.css';

export interface TempoReadoutProps {
  /** Beats per minute. */
  bpm: number;
  /** The unit after the number. */
  unit?: string;
  /** The lowest tempo a drag, scroll or key asks for. */
  min?: number;
  /** The highest tempo a drag, scroll or key asks for. */
  max?: number;
  /** Called with the tempo a drag, scroll or key on the number asks for (within `min`–`max`). */
  onTempo?: (bpm: number) => void;
  /** Tempo + held (`true`) and released (`false`). */
  onPlus?: (down: boolean) => void;
  /** Tempo − held and released, as `onPlus`. */
  onMinus?: (down: boolean) => void;
  /** The number double-clicked: back to the style's own tempo. */
  onReset?: () => void;
  /** Fill the size container it sits in: the number on its foot, + over − as one column beside it. */
  cells?: boolean;
  /** With `cells`: the unit set large, in the numeral's ink, rather than as a small label. */
  unitLarge?: boolean;
  /** The number's tooltip key, rendered as its `data-tip`. Default `display.tempo`. */
  tip?: string;
  /**
   * The app's tooltip action (`use:tip`), applied to the number with `tip` and to + and − with
   * their own keys (`tempo.up`, `tempo.down`), as the original does.
   */
  tipAction?: TipAction;
  /**
   * The numeral's size, a CSS length ("96px", "var(--size-display)"), set as
   * `--yh-tempo-readout-size` on the root; it wins over the `cells` fit. Default: that property's
   * value, `--size-numeral` (or the container fit with `cells`).
   */
  size?: string;
}

/** Applies the app's tooltip action to a node while `tipAction` is set; destroyed on unmount or key change. */
function useTip(ref: RefObject<HTMLElement | null>, tipAction: TipAction | undefined, key: string) {
  useEffect(() => {
    const node = ref.current;
    if (!node || !tipAction) return;
    const handle = tipAction(node, key);
    return () => handle?.destroy?.();
  }, [ref, tipAction, key]);
}

/** Pixels of drag per BPM. */
const DRAG_PX = 4;

const STEP_KEYS: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 };

/** A glyph's pointer and keyboard presses as a hold. */
function useHold(report: ((down: boolean) => void) | undefined) {
  const held = useRef(false);
  const release = () => {
    if (!held.current) return;
    held.current = false;
    report?.(false);
  };
  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.button !== 0) return;
      held.current = true;
      report?.(true);
    },
    onPointerUp: release,
    onPointerLeave: release,
    onPointerCancel: release,
    // A click with no pointer detail is the keyboard's (Enter or Space): one step.
    onClick: (e: MouseEvent) => {
      if (e.detail !== 0) return;
      report?.(true);
      report?.(false);
    },
  };
}

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
 * *Hierarchy:* the unit drops to a caption-sized label in the muted ink and the pack's label case,
 * so the eye lands on the value first (typography.md). *Affordance:* + and − are real keys, a
 * framed pair on the raised surface with one hairline between them, instead of bare glyphs that
 * read as text; the draggable number shows a faint well on hover and the `ns-resize` cursor
 * (craft-details.md). *Colour meaning:* no status colour; the accent appears only as the focus
 * ring, so it reads on light and dark packs alike (color.md). *Sizing:* the numeral's size is one
 * custom property, `--yh-tempo-readout-size` (default `--size-numeral`), which a parent sets on
 * the root or passes as `size`; + and − scale from it, so a display can make the tempo its hero
 * without overriding this widget's CSS.
 *
 * **Kept.** The spinbutton with its spoken value ("104 BPM"), the drag, wheel, key and
 * double-click gestures, the hold reporting with a single press from the keyboard, the button
 * names ("Tempo up (Scene Launch)", "Tempo down (Function)"), the `data-tip` keys, the app's
 * `tipAction` on the number and both buttons with their keys, and `cells`, where it fills its
 * size container with the reading on the foot and + over − exactly as tall as the number's
 * capitals.
 */
export function TempoReadout({
  bpm,
  unit = 'BPM',
  min = 5,
  max = 500,
  onTempo,
  onPlus,
  onMinus,
  onReset,
  cells = false,
  unitLarge = false,
  tip = 'display.tempo',
  tipAction,
  size,
}: TempoReadoutProps) {
  const number = useRef<HTMLSpanElement>(null);
  const upButton = useRef<HTMLButtonElement>(null);
  const downButton = useRef<HTMLButtonElement>(null);
  useTip(number, tipAction, tip);
  useTip(upButton, tipAction, 'tempo.up');
  useTip(downButton, tipAction, 'tempo.down');
  const drag = useRef<{ id: number; y: number; from: number; last: number } | null>(null);

  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)));
  const ask = (next: number) => {
    const v = clamp(next);
    if (v !== Math.round(bpm)) onTempo?.(v);
  };

  // The latest `ask` for the wheel listener, which is attached once.
  const askRef = useRef(ask);
  askRef.current = ask;
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  // Scroll: one BPM per wheel step. Not passive, so the page doesn't scroll under it.
  useEffect(() => {
    const node = number.current;
    if (!node) return;
    const wheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      askRef.current(bpmRef.current + (e.deltaY < 0 ? 1 : -1));
    };
    node.addEventListener('wheel', wheel, { passive: false });
    return () => node.removeEventListener('wheel', wheel);
  }, []);

  const down = (e: PointerEvent<HTMLSpanElement>) => {
    if (e.button !== 0) return;
    drag.current = { id: e.pointerId, y: e.clientY, from: bpm, last: bpm };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLSpanElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const next = clamp(d.from + Math.trunc((d.y - e.clientY) / DRAG_PX));
    if (next === d.last) return;
    d.last = next;
    onTempo?.(next);
  };
  const up = (e: PointerEvent<HTMLSpanElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    drag.current = null;
  };
  const key = (e: KeyboardEvent) => {
    const step = STEP_KEYS[e.key];
    if (step === undefined) return;
    e.preventDefault();
    ask(bpm + step);
  };

  const plus = useHold(onPlus);
  const minus = useHold(onMinus);

  const digits = Math.max(String(Math.round(max)).length, String(Math.round(bpm)).length);
  const classes = ['yh-tempo-readout', cells && 'yh-tempo-readout--cells', cells && unitLarge && 'yh-tempo-readout--unit-large']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} data-cells={cells || undefined} style={
        {
          '--yh-tempo-readout-digits': digits,
          ...(size === undefined ? {} : { '--yh-tempo-readout-size': size }),
        } as CSSProperties
      }
    >
      <span className="yh-tempo-readout__reading">
        <span
          ref={number}
          className="yh-tempo-readout__bpm"
          role="spinbutton"
          tabIndex={0}
          aria-label={`Tempo, ${unit}. Drag, scroll or use the arrow keys; double-click for the style's tempo`}
          aria-valuenow={bpm}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={`${bpm} ${unit}`}
          data-tip={tip}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onKeyDown={key}
          onDoubleClick={() => onReset?.()}
        >
          {bpm}
        </span>
        <span className="yh-tempo-readout__unit" aria-hidden="true">
          {unit}
        </span>
      </span>
      <span className="yh-tempo-readout__steps" role="group" aria-label="Tempo">
        <button ref={upButton} type="button" className="yh-tempo-readout__step" aria-label="Tempo up (Scene Launch)" data-tip="tempo.up" {...plus}>
          <span aria-hidden="true">+</span>
        </button>
        <button ref={downButton} type="button" className="yh-tempo-readout__step" aria-label="Tempo down (Function)" data-tip="tempo.down" {...minus}>
          <span aria-hidden="true">−</span>
        </button>
      </span>
    </div>
  );
}

export default TempoReadout;

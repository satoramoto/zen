import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import './Fader.css';

export type FaderHue = 'r1' | 'r2' | 'r3' | 'l' | 'a' | 't2' | 't';
export type FaderKind = 'part' | 'group' | 'master' | 'off' | 'parked';

export interface FaderProps {
  /** The accessible name ("Right 1 · Stage Grand, level 90"). */
  name: string;
  /** The text at the top: the level ("90") or the layer and its value ("Rev 40"). Empty when parked. */
  value?: string;
  /** The set level, 0–127: where the cap sits. */
  level?: number;
  /** The left meter, 0–1 of the travel. */
  meter?: number;
  /** The right meter, 0–1 of the travel. */
  meter2?: number;
  /** The peak hold line, 0–1 of the travel. */
  peak?: number;
  /** Where the hardware fader is, 0–127, while it's away from the level (soft takeover). Undefined: not away. */
  away?: number;
  /** `part`, `group`, `master` live; `off` a part switched off; `parked` an unused fader. */
  kind?: FaderKind;
  /** The strip's identity: a part (`r1`, `r2`, `r3`, `l`) takes its part hue; `a` (Style), `t2` (Multi Pad) and `t` (Master) are neutral. */
  hue?: FaderHue;
  /** The non-Vol layer look (Pan, Reverb, Chorus, Delay): no meters, a neutral fill, the layer word as a label. */
  layered?: boolean;
  /** A fixed width in px. Default: fills its container. */
  width?: number;
  /** With `kind="parked"`: a dotted ghost in the strip's faded hue instead of the dashed grey groove. */
  empty?: boolean;
  /** The tooltip key, rendered as `data-tip`. */
  tip?: string;
  /** The app's tooltip hook, called with the node and `tip` when both are set; may return a handle whose `destroy` cleans up. */
  tipAction?: (
    node: HTMLElement,
    key: string,
  ) => { update?: (key: string) => void; destroy?: () => void } | void;
  /** Called with the level asked for (0–127, whole) on a drag (each level once), a key or the wheel. Not when parked. */
  onlevel?: (level: number) => void;
}

const MAX = 127;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const PART_HUE: Partial<Record<FaderHue, string>> = { r1: '1', r2: '2', r3: '3', l: '4' };

/** ↑ / → +1, ↓ / ← −1, Page Up / Down ±10 (Home 0, End 127 below). */
const STEPS: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 };
/** An ask the state hasn't confirmed is dropped after this pause, so `level` always wins in the end. */
const SETTLE_MS = 400;
/** A wheel notch in px: a trackpad's small deltas add up to one before the fader moves 2. */
const WHEEL_PX = 20;

/** "Rev 40" → a layer word and its number; "90" stays a number. */
function splitValue(value: string): { word: string; num: string } {
  const m = /^(\D+?)\s+(\S.*)$/.exec(value);
  return m ? { word: m[1], num: m[2] } : { word: '', num: value };
}

/**
 * **Job.** One mixer strip's level. At a glance a player needs the set level as a number, where the
 * fader sits on its travel, whether the part is sounding, and above all whether the hardware fader
 * has to be moved through the level before it takes over again.
 *
 * **Changed.** *Hierarchy and numerals*: the level is the largest thing, in the readout face with
 * tabular figures and in text ink, not the strip hue, so it holds contrast on light palettes too
 * (`typography.md` §10 tabular numbers, `color.md` §4 contrast); a layer word ("Rev") becomes a small
 * label above its number instead of sharing its size. *Affordance*: the set level is a real cap
 * that overhangs the groove, so it reads as a thing to grab and drag; the 3px bracket and tick did
 * not. It is a `slider` (value 0–127, vertical) rather than a button, so assistive tech announces
 * the level and the keys it already obeyed. *Colour meaning* (`color.md` §3, `anti-ai-slop.md` #8
 * token role drift): the part hue fills the travel only, for part identity; Style and Master are
 * neutral instead of borrowing the focus accent; meters are neutral (they measure sound, they are
 * not identity); soft takeover is a state, so it is drawn in `--warning`, with an arrow that says
 * which way to move the hardware instead of a bare ↕. Bloom on the fill comes from `--bloom`, so
 * flat palettes stay flat. Focus is a visible `--accent` ring (`craft-details.md` §1).
 *
 * **Kept.** Fully controlled: a drag, ↑ ↓ → ← ±1, Page Up / Down ±10, Home, End and the wheel (±2 a
 * notch, trackpad deltas summed) ask through `onlevel` and move nothing themselves; quick repeats
 * count from the level last asked for until `level` catches up. Two meters with a peak hold, the
 * off / parked / empty / layered looks, and the caller's accessible name.
 */
export function Fader({
  name,
  value = '',
  level = 0,
  meter = 0,
  meter2 = 0,
  peak = 0,
  away,
  kind = 'part',
  hue = 't',
  layered = false,
  width,
  empty = false,
  tip,
  tipAction,
  onlevel,
}: FaderProps) {
  const parked = kind === 'parked';
  const off = kind === 'off';
  const live = !parked && !off;
  const showMeters = !parked && !layered;
  const isAway = away !== undefined && !parked;
  const frac = clamp(level, 0, MAX) / MAX;
  const { word, num } = splitValue(parked ? '' : value);

  const root = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLSpanElement>(null);

  // The level last asked for, until the state catches up (see Kept above).
  const asked = useRef<number | null>(null);
  const askedAt = useRef(0);
  const lastSent = useRef<number | null>(null);
  const dragId = useRef<number | null>(null);
  const wheelAcc = useRef(0);

  useEffect(() => {
    if (level === asked.current) asked.current = null;
  }, [level]);

  // Handlers read the latest props through this ref: the wheel listener is attached once.
  const latest = useRef({ level, parked, onlevel });
  latest.current = { level, parked, onlevel };

  const base = () => {
    if (asked.current !== null && Date.now() - askedAt.current > SETTLE_MS) asked.current = null;
    return asked.current ?? clamp(latest.current.level, 0, MAX);
  };

  const ask = (next: number) => {
    const v = clamp(Math.round(next), 0, MAX);
    asked.current = v === latest.current.level ? null : v;
    askedAt.current = Date.now();
    // A drag repeats the same level on every pixel within a step: send each level once.
    if (dragId.current !== null && v === lastSent.current) return;
    lastSent.current = v;
    latest.current.onlevel?.(v);
  };
  const askRef = useRef({ ask, base });
  askRef.current = { ask, base };

  // React's wheel listener is passive; this one must be able to stop the page scrolling.
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const wheel = (event: WheelEvent) => {
      if (latest.current.parked || event.deltaY === 0) return;
      event.preventDefault();
      const px = event.deltaMode === 1 ? event.deltaY * WHEEL_PX : event.deltaMode === 2 ? event.deltaY * WHEEL_PX * 10 : event.deltaY;
      if (Math.sign(px) !== Math.sign(wheelAcc.current)) wheelAcc.current = 0;
      wheelAcc.current += px;
      if (Math.abs(wheelAcc.current) < WHEEL_PX) return;
      const dir = wheelAcc.current < 0 ? 1 : -1;
      wheelAcc.current = 0;
      askRef.current.ask(askRef.current.base() + 2 * dir);
    };
    node.addEventListener('wheel', wheel, { passive: false });
    return () => node.removeEventListener('wheel', wheel);
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node || !tipAction || tip === undefined) return;
    const handle = tipAction(node, tip);
    return () => handle?.destroy?.();
  }, [tip, tipAction]);

  const levelAt = (clientY: number) => {
    const box = rail.current?.getBoundingClientRect();
    if (!box || box.height === 0) return level;
    return Math.round(clamp(1 - (clientY - box.top) / box.height, 0, 1) * MAX);
  };

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (parked || event.button > 0) return;
    dragId.current = event.pointerId;
    lastSent.current = null;
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
    ask(levelAt(event.clientY));
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragId.current === event.pointerId) ask(levelAt(event.clientY));
  };
  const pointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (dragId.current === event.pointerId) dragId.current = null;
  };

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (parked) return;
    let next: number | null = null;
    if (event.key in STEPS) next = base() + STEPS[event.key];
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = MAX;
    if (next === null) return;
    event.preventDefault();
    ask(next);
  };

  const style = { '--yh-fader-level': frac, width: width === undefined ? undefined : `${width}px` } as CSSProperties;
  const partHue = layered ? undefined : PART_HUE[hue];

  return (
    <div
      ref={root}
      className="yh-fader"
      role="slider"
      tabIndex={0}
      aria-label={name}
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={MAX}
      aria-valuenow={clamp(Math.round(level), 0, MAX)}
      aria-valuetext={parked ? undefined : value || undefined}
      aria-disabled={parked ? true : undefined}
      data-kind={kind}
      data-hue={partHue}
      data-layered={layered || undefined}
      data-empty={parked && empty ? true : undefined}
      data-away={isAway ? (away! < level ? 'up' : away! > level ? 'down' : 'at') : undefined}
      data-tip={tip}
      style={style}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerEnd}
      onPointerCancel={pointerEnd}
      onKeyDown={keyDown}
    >
      <span className="yh-fader__head" aria-hidden="true">
        {word && <span className="yh-fader__word">{word}</span>}
        <span className="yh-fader__value">{num}</span>
      </span>
      <span className="yh-fader__travel" aria-hidden="true">
        <span className="yh-fader__rail" ref={rail}>
          <span className="yh-fader__groove" />
          {!parked && <span className="yh-fader__fill" />}
          {isAway && (
            <span className="yh-fader__ghost" style={{ '--yh-fader-away': clamp(away!, 0, MAX) / MAX } as CSSProperties} />
          )}
          {!parked && <span className="yh-fader__cap" />}
        </span>
        {showMeters && (
          <span className="yh-fader__meters">
            <span className="yh-fader__meter" style={{ '--yh-fader-m': live ? clamp(meter, 0, 1) : 0 } as CSSProperties} />
            <span className="yh-fader__meter" style={{ '--yh-fader-m': live ? clamp(meter2, 0, 1) : 0 } as CSSProperties} />
            {live && peak > 0 && (
              <span className="yh-fader__peak" style={{ '--yh-fader-p': clamp(peak, 0, 1) } as CSSProperties} />
            )}
          </span>
        )}
      </span>
      {isAway && (
        <svg className="yh-fader__takeover" viewBox="0 0 10 10" aria-hidden="true">
          {away! < level ? <path d="M5 1 9 8H1z" /> : away! > level ? <path d="M5 9 1 2h8z" /> : <path d="M1 4h8v2H1z" />}
        </svg>
      )}
    </div>
  );
}

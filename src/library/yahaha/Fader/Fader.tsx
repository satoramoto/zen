import type { CSSProperties } from 'react';
import { FADER_MAX as MAX, useFader } from './useFader';
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
  /** The strip's identity: a part (`r1`, `r2`, `r3`, `l`) takes its part hue; `a` (Style), `t2` (Multi Pad) and `t` (Master) are neutral. */
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
  tipAction?: (
    node: HTMLElement,
    key: string,
  ) => { update?: (key: string) => void; destroy?: () => void } | void;
  /** Called with the level asked for (0–127, whole) on a drag (each level once), a key or the wheel. Not when parked. */
  onlevel?: (level: number) => void;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const PART_HUE: Partial<Record<FaderHue, string>> = { r1: '1', r2: '2', r3: '3', l: '4' };

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
 * flat palettes stay flat. Focus is a visible `--accent` ring (`craft-details.md` §1). *Alignment*:
 * the opt-in `fillHeight` (off by default) lets the fader take its container's height, so a bank of
 * strips lines up to whatever height the region gives it without overriding the fader's own size;
 * a drag maps the pointer onto the rail's measured height, so the travel stays exact at any size.
 * *Affordance, again* (the 2026-10 review): the cap is a raised `--surface-3` key with a
 * `--border-strong` edge and an ink grip line, not a bar of text ink, so on a neutral strip
 * (Style, Master, whose fill is ink too) cap and fill no longer merge into one white bar.
 * *Hierarchy*: one 2px meter in `--text-4`, hard against the groove, showing the louder side,
 * with no peak line, so it no longer reads as a second, thinner fader; an off part's number drops
 * to `--size-label`, so a silent "64" doesn't compete with the live levels. *Empty slot*: `empty`
 * draws the banks' one empty look, a faint solid groove (`--text-1` at 10%) with no cap, value or
 * edge, instead of a dotted thread. *Headless* (2026-10): the behaviour lives in `useFader`; the
 * markup is named parts (`data-part`: head, value, travel, groove, fill, ghost, cap, meter), and the
 * look comes from the theme's Materials: the groove and meter channel are `well`, the cap a
 * `handle` (its grip line stays the Fader's own, in ink), the fill is lit in the strip ink
 * (`--lit`, `--mat-lit-glow`), so a material set can restyle the strip without touching it.
 *
 * **Kept.** Fully controlled: a drag, ↑ ↓ → ← ±1, Page Up / Down ±10, Home, End and the wheel (±2 a
 * notch, trackpad deltas summed) ask through `onlevel` and move nothing themselves; quick repeats
 * count from the level last asked for until `level` catches up. The meter props (`meter`,
 * `meter2`, `peak`) as the original's, the off / parked / empty / layered looks, the warning ghost
 * cap and arrow for takeover, the word-over-number layer value, and the caller's accessible name.
 */
export function Fader({
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

  const { rootProps, railRef } = useFader({ name, value, level, parked, tip, tipAction, onlevel });

  const style = { '--yh-fader-level': frac, width: width === undefined ? undefined : `${width}px` } as CSSProperties;
  const partHue = layered ? undefined : PART_HUE[hue];

  return (
    <div
      {...rootProps}
      className="yh-fader"
      data-kind={kind}
      data-hue={partHue}
      data-layered={layered || undefined}
      data-fill-height={fillHeight || undefined}
      data-empty={parked && empty ? true : undefined}
      data-away={isAway ? (away! < level ? 'up' : away! > level ? 'down' : 'at') : undefined}
      data-tip={tip}
      style={style}
    >
      <span className="yh-fader__head" data-part="head" aria-hidden="true">
        {word && <span className="yh-fader__word">{word}</span>}
        <span className="yh-fader__value" data-part="value">{num}</span>
      </span>
      <span className="yh-fader__travel" data-part="travel" aria-hidden="true">
        <span className="yh-fader__rail" ref={railRef}>
          <span className="yh-fader__groove" data-part="groove" />
          {!parked && <span className="yh-fader__fill" data-part="fill" />}
          {isAway && (
            <span
              className="yh-fader__ghost"
              data-part="ghost"
              style={{ '--yh-fader-away': clamp(away!, 0, MAX) / MAX } as CSSProperties}
            />
          )}
          {!parked && <span className="yh-fader__cap" data-part="cap" />}
        </span>
        {showMeters && (
          <span className="yh-fader__meters">
            {/* One meter, the louder side: two read as a second, thinner fader at Stage scale. */}
            <span
              className="yh-fader__meter"
              data-part="meter"
              style={{ '--yh-fader-m': live ? clamp(Math.max(meter, meter2), 0, 1) : 0 } as CSSProperties}
            />
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

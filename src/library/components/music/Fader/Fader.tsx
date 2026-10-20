import type { CSSProperties } from 'react';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import { faderView, type FaderModelProps } from './Fader.model';
import { useFader } from './useFader';
import './Fader.css';

// The props and the strip they draw are framework-free, in the model; `Fader.svelte` renders the same view.
export type { FaderHue, FaderKind, FaderModelProps, FaderTipAction } from './Fader.model';

export type FaderProps = FaderModelProps;

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
 * token role drift): the hue slot fills the travel only, for identity; the neutral strips (Yahaha's
 * Style and Master) are neutral instead of borrowing the focus accent; meters are neutral (they measure sound, they are
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
 * edge, instead of a dotted thread. *Headless* (2026-10): the behaviour lives in the `faderInput.ts`
 * store (`useFader` binds it here, the `faderInput` action in Svelte), the strip in `Fader.model.ts`; the
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
 *
 * **Tuning knobs.**
 * - `--yh-fader-*`: the strip ink (`-ink`), the cap's height, corner and ghost line (`-cap-h`,
 *   `-cap-r`, `-line`), the groove and meter widths (`-groove-w`, `-meter-w`), and the 0–1
 *   positions the component sets inline (`-level`, `-away`, `-m`).
 */
export function Fader(props: FaderProps) {
  const view = faderView(props);
  const { rootRef, railRef } = useFader({
    level: props.level ?? 0,
    parked: view.parked,
    tip: props.tip,
    tipAction: props.tipAction,
    onlevel: props.onlevel,
  });

  return (
    <div
      ref={rootRef}
      className={view.root.className}
      tabIndex={view.root.tabIndex}
      {...view.root.attrs}
      style={view.root.style as CSSProperties}
    >
      <span className="yh-fader__head" data-part="head" aria-hidden="true">
        {view.word && (
          <Text role="label" size="caption" leading="tight" className="yh-fader__word">
            {view.word}
          </Text>
        )}
        <Text role="numeral" size={view.numSize} className="yh-fader__value" data-part="value">
          {view.num}
        </Text>
      </span>
      <span className="yh-fader__travel" data-part="travel" aria-hidden="true">
        <span className="yh-fader__rail" ref={railRef}>
          <Surface as="span" {...view.groove.surface} className={view.groove.className} {...view.groove.attrs} />
          {view.fill && <span className="yh-fader__fill" data-part="fill" />}
          {view.ghost && <span className="yh-fader__ghost" data-part="ghost" style={view.ghost as CSSProperties} />}
          {view.fill && <span className="yh-fader__cap" data-part="cap" />}
        </span>
        {view.meter && (
          <span className="yh-fader__meters">
            <Surface
              as="span"
              {...view.meter.surface}
              className={view.meter.className}
              {...view.meter.attrs}
              style={view.meter.style as CSSProperties}
            />
          </span>
        )}
      </span>
      {view.takeover && (
        <svg className="yh-fader__takeover" viewBox="0 0 10 10" aria-hidden="true">
          <path d={view.takeover} />
        </svg>
      )}
    </div>
  );
}

import { usePad, type TipAction } from './usePad';
import './Pad.css';

export type { TipAction };

/** Section families, utilities, Start / Stop, and the four part hues the engine can light. */
export type PadFamily = 'intro' | 'main' | 'ending' | 'brk' | 'fill' | 'util' | 'start' | 'r1' | 'r2' | 'r3' | 'l';
export type PadState = 'idle' | 'dark' | 'playing' | 'next' | 'armed' | 'running';
/** The colour role a pad draws in: neutral (`--selected`), a part hue, `--success` or `--transport`. */
export type PadTone = 'neutral' | 'hue-1' | 'hue-2' | 'hue-3' | 'hue-4' | 'success' | 'transport';

export interface PadProps {
  /** The label, centred in the pad ("Main B", "Sync Start"); wraps at word boundaries, but a short last word (a numeral, a letter) stays with the word before it. */
  label: string;
  /** The pad's number on the Launchkey ("1" … "16"). Not drawn; it only goes into the default accessible name. */
  index?: string;
  /** The family: a section, `util`, `start` (Start / Stop), or a part hue (`r1`, `r2`, `r3`, `l`). */
  family?: PadFamily;
  /** The face. `dark` means the pad is absent from this style or unavailable. */
  state?: PadState;
  /** The flash phase of `next` and `armed`: false drops the fill and thins the ring. */
  lit?: boolean;
  /** The accessible name. Default: "{label} (pad {index})". */
  name?: string;
  /** The tooltip key, rendered as `data-tip`. */
  tip?: string;
  /** The app's tooltip action, applied with `tip` when both are set. */
  tipAction?: TipAction;
  /** Called on a click, Space or Enter. */
  onPress?: () => void;
  /** Hang NEXT / ARMED on the top edge at the right, mostly outside the pad, instead of in a row above the label (the label stays centred). */
  tagCorner?: boolean;
  /** A transport pad (Start / Stop, Sync Start, Sync Stop, Tap, Auto Fill): `util` and `start` draw in `--transport`; Start / Stop running stays `--success`. */
  transport?: boolean;
  /** Ring NEXT in `--accent` (what `hues.ts` says "next" is) instead of the pad's own colour. Default true: next is `--accent` everywhere; `false` is kept only for compatibility. */
  accentNext?: boolean;
  /** Unavailable: `aria-disabled="true"`, still focusable, and a press does nothing. Default false. */
  disabled?: boolean;
  /** Fill the parent cell (width and height 100%) instead of the fixed square. Default false. */
  fillCell?: boolean;
  /**
   * How an on pad (`playing`) shows it: `fill`, the solid fill (the default; a playing section),
   * or `ring`, an outline and a lit dot, for a bank's pads, so the solid fill stays with what
   * plays.
   */
  onFace?: PadOnFace;
}

/** How an on pad shows it: see `PadProps.onFace`. */
export type PadOnFace = 'fill' | 'ring';

const PART_TONE: Partial<Record<PadFamily, PadTone>> = { r1: 'hue-1', r2: 'hue-2', r3: 'hue-3', l: 'hue-4' };

/**
 * Ties a short last word (a numeral, a letter, a roman numeral, a sign: up to three characters) to
 * the word before it with a no-break space, so "Main B", "Intro III" or "Quick 1" never wraps the
 * numeral away from its word. Longer last words wrap as usual.
 */
export function tieLastWord(label: string): string {
  // A lone sign ("Start / Stop") stays with the word before it, so the line never starts with it.
  return label.replace(/ (\S{1,3})$/, ' $1').replace(/ ([^\w\s]) /g, ' $1 ');
}

/** Which colour role a pad wears, from its family, state and transport flag. */
export function padTone(family: PadFamily, state: PadState, transport: boolean): PadTone {
  const part = PART_TONE[family];
  if (part) return part;
  // Running is a state, not the transport's identity (hues.ts), so it wins over the role hue.
  if (family === 'start' && state === 'running') return 'success';
  const util = family === 'util' || family === 'start';
  if (util && transport) return 'transport';
  return 'neutral';
}

/**
 * One pad of the Launchkey band, drawn as the key a player presses.
 *
 * **Job.** Say, at a glance across a 4 × 4 bank, which pad is sounding, which is queued or armed
 * for the next bar, which is not in this style, and what each one is called, and take a press by
 * pointer, Space or Enter.
 *
 * **Changed.** *Affordance*: an idle pad is a raised face on `--surface-2` with an edge, so it
 * reads as a key to press, not an outline drawing; it gives a little on press. *Colour meaning*
 * (color.md 3, "state changes: structure, not circus"; anti-ai-slop.md 8, token role drift): the
 * original gave each of five section families its own hue, which the contract does not have and
 * which competed with state. Sections and utilities are now neutral: identity is the label, and the
 * only fill is "sounding" in `--selected` / `--selected-text`. Part hues (`r1` → `--hue-1`, `r2` →
 * `--hue-2`, `r3` → `--hue-3`, `l` → `--hue-4`) stay, because there the colour is the part.
 * Start / Stop running is `--success` with `--success-text` ink, transport pad or not: running is
 * a state, not the transport's identity. A transport pad (the original's "hue of time") wears the
 * contract's role hue, `--transport` / `--transport-text`, so it no longer borrows `--action`, the
 * screen's call to action, and stays clear of the part hues and the states; and it wears it only
 * while active (hues.ts): at rest its edge is the neutral `--border-strong`, so Start / Stop is the
 * one saturated key a player finds without looking. ARMED is a state that needs attention, so its
 * ring and chip are `--warning` with `--warning-text` ink whatever the pad; NEXT rings in
 * `--accent` by default, the contract's "next" role, so queued reads the same on every pad
 * (`accentNext`, now on unless set false; before, a neutral pad's NEXT rang in `--text-1`, the same
 * white as the playing fill beside it). *A solid fill means sounding or running* (the Stage rule):
 * `onFace="ring"` draws an on pad that isn't sounding (a bank's pads, Auto Fill on) as the raised
 * face with a ring in its colour and a lit dot top-left, so only the playing section and Start /
 * Stop fill. One ring weight, `--yh-wait-ring` (twice `--border-width`, border included), and one
 * 14% wash serve the waiting faces here, on Button and on LampButton. Ink on a state fill is the
 * state's own text token, not `--surface-0`, so it holds contrast on light palettes too.
 * *Hierarchy*: an absent pad is a dashed edge on no face with a muted label, so absence reads as
 * structure, not as a fainter colour. *Typography* (typography.md 8): labels use `--label-case`
 * and `--tracking` at `--size-label`, the NEXT / ARMED tag at caption size with tracking; a short
 * last word (a numeral, a letter) is tied to the word before it, so "Main B" never breaks into
 * "MAIN / B". Glow uses `--bloom`, so flat palettes stay flat. Focus is a 2px `--accent` ring
 * (craft-details.md 1). Options: `disabled` keeps the pad in the tab order but marks it
 * `aria-disabled` and ignores presses, drawn as every unavailable key is, a dashed edge and a
 * `--text-3` label with no press give (*affordance*: unavailable must not look pressable);
 * `fillCell` makes the pad fill its grid cell, so banks lay out pads without overriding the pad's
 * size variables (*alignment*). The NEXT / ARMED
 * chip never covers the label (*hierarchy*: the name outranks the state, which the ring already
 * says): at the top, the pad keeps the chip's row clear and centres the label below it; with
 * `tagCorner` the chip hangs on the top edge, mostly outside the pad, so a one-letter song-form
 * step keeps its letter centred and in line with its neighbours. *Headless*: the press and the
 * tooltip live in `usePad`; the markup is named parts (`face`, `chip`, `label`), and the face is
 * made of the theme's `key` material at rest and `--mat-key-pressed` while sounding, on or held,
 * its lit dot `--mat-lit-glow`, so a material set restyles the pad without touching it. State
 * still wins over material: sounding keeps its solid fill, waiting its ring and wash.
 *
 * **Kept.** The label centred and wrapping only at word boundaries; no pad number on the face (it
 * goes into the accessible name); NEXT / ARMED out of the label's flow;
 * the flash driven by the parent through `lit`; rings drawn without changing the pad's size; the
 * `tagCorner` and `transport` options of the golden Stage; the classes and `data-*` hooks.
 */
export function Pad({
  label,
  index = '',
  family = 'main',
  state = 'idle',
  lit = true,
  name,
  tip,
  tipAction,
  onPress,
  tagCorner = false,
  transport = false,
  accentNext = true,
  disabled = false,
  fillCell = false,
  onFace = 'fill',
}: PadProps) {
  const { ref, onClick } = usePad({ onPress, disabled, tip, tipAction });
  const tone = padTone(family, state, transport);
  const tag = state === 'next' ? 'NEXT' : state === 'armed' ? 'ARMED' : '';
  const util = family === 'util' || family === 'start';

  return (
    <button
      ref={ref}
      type="button"
      className="yh-pad"
      data-part="face"
      data-state={state}
      data-tone={tone}
      data-family={family}
      data-util={util || undefined}
      data-lit={tag ? String(lit) : undefined}
      data-tag={tag ? (tagCorner ? 'corner' : 'top') : undefined}
      data-tip={tip}
      data-next={accentNext ? 'accent' : undefined}
      data-fill={fillCell || undefined}
      data-on-face={onFace}
      aria-label={name ?? `${label}${index ? ` (pad ${index})` : ''}`}
      aria-pressed={state === 'playing' || state === 'running'}
      aria-disabled={disabled || undefined}
      onClick={onClick}
    >
      {tag && (
        <span className={`yh-pad__tag${tagCorner ? ' yh-pad__tag--corner' : ''}`} data-part="chip" aria-hidden="true">
          {tag}
        </span>
      )}
      <span className="yh-pad__label" data-part="label">
        {tieLastWord(label)}
      </span>
    </button>
  );
}

export default Pad;

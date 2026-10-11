import { useEffect, useRef } from 'react';
import './Pad.css';

/** Section families, utilities, Start / Stop, and the four part hues the engine can light. */
export type PadFamily = 'intro' | 'main' | 'ending' | 'brk' | 'fill' | 'util' | 'start' | 'r1' | 'r2' | 'r3' | 'l';
export type PadState = 'idle' | 'dark' | 'playing' | 'next' | 'armed' | 'running';
/** The colour role a pad draws in: neutral (`--selected`), a part hue, `--success` or `--action`. */
export type PadTone = 'neutral' | 'hue-1' | 'hue-2' | 'hue-3' | 'hue-4' | 'success' | 'action';

/** A tooltip action in the shape of the app's `use:tip`: called with the node and the key. */
export type TipAction = (
  node: HTMLElement,
  key: string,
) => { update?: (key: string) => void; destroy?: () => void } | void;

export interface PadProps {
  /** The label, centred in the pad ("Main B", "Sync Start"); wraps at word boundaries. Tie a numeral to its word with a no-break space. */
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
  /** Draw NEXT / ARMED as a chip in the top-right corner instead of a line above the label. */
  tagCorner?: boolean;
  /** A transport pad (Start / Stop, Sync Start, Sync Stop, Tap, Auto Fill): `util` and `start` draw in `--action`. */
  transport?: boolean;
}

const PART_TONE: Partial<Record<PadFamily, PadTone>> = { r1: 'hue-1', r2: 'hue-2', r3: 'hue-3', l: 'hue-4' };

/** Which colour role a pad wears, from its family, state and transport flag. */
export function padTone(family: PadFamily, state: PadState, transport: boolean): PadTone {
  const part = PART_TONE[family];
  if (part) return part;
  const util = family === 'util' || family === 'start';
  if (util && transport) return 'action';
  if (family === 'start' && state === 'running') return 'success';
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
 * Start / Stop running is `--success`; a transport pad is the bank's one call to action,
 * `--action` / `--action-text` (the original's "hue of time"). ARMED is a state that needs
 * attention, so its ring and chip are `--warning` whatever the pad; NEXT rings in the pad's own
 * colour. *Hierarchy*: an absent pad is a dashed edge on no face with a muted label, so absence
 * reads as structure, not as a fainter colour. *Typography* (typography.md 8): labels use
 * `--label-case` and `--tracking` at `--size-label`, the NEXT / ARMED tag at caption size with
 * tracking. Glow uses `--bloom`, so flat palettes stay flat. Focus is a 2px `--accent` ring
 * (craft-details.md 1).
 *
 * **Kept.** The label centred and wrapping only at word boundaries; no pad number on the face (it
 * goes into the accessible name); NEXT / ARMED out of the label's flow so the label never moves;
 * the flash driven by the parent through `lit`; rings drawn without changing the pad's size; the
 * `tagCorner` and `transport` options of the golden Stage.
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
}: PadProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const tone = padTone(family, state, transport);
  const tag = state === 'next' ? 'NEXT' : state === 'armed' ? 'ARMED' : '';
  const util = family === 'util' || family === 'start';

  useEffect(() => {
    if (!ref.current || !tipAction || tip === undefined) return;
    const handle = tipAction(ref.current, tip);
    return () => handle?.destroy?.();
  }, [tip, tipAction]);

  return (
    <button
      ref={ref}
      type="button"
      className="yh-pad"
      data-state={state}
      data-tone={tone}
      data-family={family}
      data-util={util || undefined}
      data-lit={tag ? String(lit) : undefined}
      data-tip={tip}
      aria-label={name ?? `${label}${index ? ` (pad ${index})` : ''}`}
      aria-pressed={state === 'playing' || state === 'running'}
      onClick={() => onPress?.()}
    >
      {tag && (
        <span className={`yh-pad__tag${tagCorner ? ' yh-pad__tag--corner' : ''}`} aria-hidden="true">
          {tag}
        </span>
      )}
      <span className="yh-pad__label">{label}</span>
    </button>
  );
}

export default Pad;

// Pad's model: its props, the tone it wears, and the face it draws (classes, `data-*` and ARIA).
// No framework: `Pad.tsx` (React) and `Pad.svelte` (Svelte) both render `padView`; the press and
// the tooltip are the `padPress.ts` store beside it.
import type { HueSlot, RoleSlot } from '../../core/hue';
import { focusRing } from '../../../primitives/Ring';
import type { ElementView, TextModelProps } from '../../../primitives/Text.model';
import type { TipAction } from './padPress';

export type { TipAction };

/** Section families, utilities and Start / Stop. A categorical colour is `hue`, not a family. */
export type PadFamily = 'intro' | 'main' | 'ending' | 'brk' | 'fill' | 'util' | 'start';
export type PadState = 'idle' | 'dark' | 'playing' | 'next' | 'armed' | 'running';
/** The colour role a pad draws in: neutral (`--selected`), a hue slot, `--success` or a role hue. */
export type PadTone = 'neutral' | 'hue-1' | 'hue-2' | 'hue-3' | 'hue-4' | 'hue-5' | 'success' | 'role-1' | 'role-2';
/** How an on pad shows it: see `PadModelProps.onFace`. */
export type PadOnFace = 'fill' | 'ring';

/** Every Pad prop (a pad has no framework children). */
export interface PadModelProps {
  /** The label, centred in the pad ("Main B", "Sync Start"); wraps at word boundaries, but a short last word (a numeral, a letter) stays with the word before it. */
  label: string;
  /** The pad's number on the controller ("1" … "16"). Not drawn; it only goes into the default accessible name. */
  index?: string;
  /** The family: a section, `util` or `start` (Start / Stop). */
  family?: PadFamily;
  /**
   * A categorical hue slot (`--hue-1` … `--hue-5`): the pad draws in it whatever its family. An
   * app maps its meaning (e.g. Yahaha's parts). Default: none, the family's neutral or role tone.
   */
  hue?: HueSlot;
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
  /**
   * A role hue slot for a `util` or `start` pad: it draws in `--role-n` / `--role-n-text` while
   * active (an app maps its meaning, e.g. Yahaha's transport keys take role 2); Start / Stop
   * running stays `--success`. Default: none, neutral.
   */
  role?: RoleSlot;
  /** Ring NEXT in `--accent` (the contract's "next" role) instead of the pad's own colour. Default true: next is `--accent` everywhere; `false` is kept only for compatibility. */
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

/**
 * Ties a short last word (a numeral, a letter, a roman numeral, a sign: up to three characters) to
 * the word before it with a no-break space, so "Main B", "Intro III" or "Quick 1" never wraps the
 * numeral away from its word. Longer last words wrap as usual.
 */
export function tieLastWord(label: string): string {
  // A lone sign ("Start / Stop") stays with the word before it, so the line never starts with it.
  return label.replace(/ (\S{1,3})$/, ' $1').replace(/ ([^\w\s]) /g, ' $1 ');
}

/** Which colour role a pad wears, from its family, state, role slot and hue slot (a hue wins). */
export function padTone(family: PadFamily, state: PadState, role?: RoleSlot, hue?: HueSlot): PadTone {
  if (hue) return `hue-${hue}`;
  // Running is a state, not the role's identity, so it wins over the role hue.
  if (family === 'start' && state === 'running') return 'success';
  const util = family === 'util' || family === 'start';
  if (util && role) return `role-${role}`;
  return 'neutral';
}

/** What a renderer draws: the face (a `Text` rendered as a `<button>`), the chip and the label. */
export interface PadView {
  /** The face's Text props. */
  text: TextModelProps;
  /** The face's class (beside Text's own; a Surface's too) and its `type`, `data-*` and ARIA attributes. */
  face: ElementView;
  /** The NEXT / ARMED chip: its Text props, class, attributes and word; null for none. */
  chip: { text: TextModelProps; className: string; attrs: Record<string, string | undefined>; word: string } | null;
  /** The label's text, its short last word tied. */
  label: string;
}

/** The face Pad draws from its props. */
export function padView({
  label,
  index = '',
  family = 'main',
  state = 'idle',
  lit = true,
  name,
  tip,
  hue,
  tagCorner = false,
  role,
  accentNext = true,
  disabled = false,
  fillCell = false,
  onFace = 'fill',
}: PadModelProps): PadView {
  const tone = padTone(family, state, role, hue);
  const tag = state === 'next' ? 'NEXT' : state === 'armed' ? 'ARMED' : '';
  const util = family === 'util' || family === 'start';
  return {
    text: { role: 'label', leading: 'snug' },
    face: {
      className: `yh-pad lib-surface ${focusRing}`,
      attrs: {
        type: 'button',
        'data-material': 'key',
        'data-radius': 'control',
        'data-part': 'face',
        'data-state': state,
        'data-tone': tone,
        'data-family': family,
        'data-hue': hue === undefined ? undefined : String(hue),
        'data-util': util ? 'true' : undefined,
        'data-lit': tag ? String(lit) : undefined,
        'data-tag': tag ? (tagCorner ? 'corner' : 'top') : undefined,
        'data-tip': tip,
        'data-next': accentNext ? 'accent' : undefined,
        'data-fill': fillCell ? 'true' : undefined,
        'data-on-face': onFace,
        'aria-label': name ?? `${label}${index ? ` (pad ${index})` : ''}`,
        'aria-pressed': String(state === 'playing' || state === 'running'),
        'aria-disabled': disabled ? 'true' : undefined,
      },
    },
    chip: tag
      ? {
          text: { size: 'caption', weight: 'strong', case: 'upper' },
          className: `yh-pad__tag${tagCorner ? ' yh-pad__tag--corner' : ''}`,
          attrs: { 'data-part': 'chip', 'aria-hidden': 'true' },
          word: tag,
        }
      : null,
    label: tieLastWord(label),
  };
}

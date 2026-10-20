import type { ReactNode } from 'react';
import { Tree } from '../../../view/Tree';
import { buttonHandlers, buttonView, type ButtonModelProps } from './Button.model';
import '../../../primitives/Text.css';
import './Button.css';

// The props, faces, accessible name and behaviour are framework-free, in the model and its stores;
// this file and `Button.svelte` only hand the model's tree to their `Tree`.
export type { ButtonGlyph, ButtonHue, ButtonSize, ButtonVariant, ButtonFace, TipAction, ButtonModelProps } from './Button.model';

export interface ButtonProps extends ButtonModelProps {
  /** An icon before the label, or alone (an `Icon`, an SVG), drawn in the face's ink and hidden
   *  from assistive tech. Alone (no `label`), give the button a `name` for its accessible name and
   *  a `title` for its hover hint: an icon-only key, such as a panel's show/hide toggle. */
  icon?: ReactNode;
}

/**
 * **Job.** Does one thing when pressed (Panic, Stop, a page step, a One Touch) and shows, at a
 * glance, whether that thing is switched on, chosen, armed or unavailable. A player reading a
 * crowded transport needs the label first, then the state, then (for hued buttons) whose it is.
 *
 * **Changed.** *Hierarchy:* the original had one rank, so Panic, a page step and Start / Stop all
 * looked alike; a `variant` now ranks them — `primary` is the single `--action` fill, `secondary` a
 * hairline key, `quiet` no outline (color.md, "Component color limit"; anti-ai-slop.md on restraint).
 * *Contrast:* the original drew the rest label in the hue itself, which fails on light palettes
 * (a pink on white); the label is now always `--text-1` and the hue moves to the outline, the fill
 * and the waiting ring (color.md §4, 4.5:1 for text). *Colour meaning:* hue only marks identity
 * (slots `1`–`4` → `--hue-1..4`; sections stay neutral, their label names them, so no section passes
 * for a hued key), Start / Stop running is `--success` and record
 * `--danger` (state), focus is `--accent`; a neutral switch that is on uses `--selected`. *A solid
 * fill means sounding or running* (the Stage rule): only Start / Stop running (`ok`), record
 * (`rec`) and the `primary` call to action fill. Every other key that is *on* draws a
 * double-weight ring and a lit dot in its colour, and a *chosen* key keeps its rest outline and
 * gains `--text-1` ink and a rule along the bottom, the same mark as an underlined tab; so
 * on, chosen and waiting are three different shapes, not one fill for eleven things (colour
 * meaning; color.md, "state changes: structure, not circus"). A `role-2` key (in Yahaha, the keys
 * that move time) takes the contract's `--role-2` role hue, but only while active: at rest it is
 * neutral (a `--border-strong` outline, a neutral hover), its hue appears on the waiting ring, the
 * on ring and the `primary` fill (Start), so Start is the one saturated key a player finds without
 * looking. Each solid face takes its own ink: `--on-hue` on a hue slot or the accent,
 * `--success-text`, `--danger-text` and `--role-2-text` on the rest (the original used `--on-hue`
 * everywhere, which the contract only promises against the categorical hues). Lit hued marks
 * bloom by `--bloom`, so they glow on Push and stay flat on paper palettes. *Affordance:* a
 * disabled button reads as unavailable by structure: a dashed edge and a `--text-3` label (still
 * readable, never `--text-4`), and a not-allowed cursor; hover and press tint the face by its own
 * tone; a visible `:focus-visible` ring sits outside the face (craft-details.md §1). One ring
 * weight, `--yh-wait-ring` (twice `--border-width`), and one 14% tint serve the waiting face here,
 * on LampButton and on Pad. *Rhythm:* sizes derive from `--control-h` and `--space-*`, so density
 * packs scale every key together; labels follow `--label-case` and `--tracking` and use tabular
 * numerals (typography.md). Every width is a floor: a key never truncates its own name, it grows
 * to hold it (`pair` is now 1.6 control heights, enough for four capitals and a glyph). A `tall`
 * key spans two control rows with a heading-size label, so the transport's primary key (Start /
 * Stop) leads by size as well as fill (hierarchy), and grows rather than reading "ST…". The waiting
 * face can flash: the parent drives `lit`, as on the Pad, and its off phase keeps the label and a
 * hairline ring in the tone, so a queued key blinks without the row jumping (affordance;
 * craft-details.md). *Headless:* named parts (`face`, `label`, `glyph`); the face is made of the
 * theme's `key` material, `--mat-key-pressed` while held, on or chosen, and the on dot is lit with
 * `--mat-lit-glow`, so a material set restyles every key without touching it. Meaning still wins:
 * the primary, running and recording fills, the rings, the underline and the dashed edge stay; a
 * `quiet` key has no key material at all, and chosen it draws as the pack's chosen tab
 * (`--mat-tabs-chosen-*`: fill, shadow, ink), so a quiet toggle reads as selected in each pack's
 * own vocabulary rather than as a rule curving into a rounded corner.
 *
 * **Kept.** Every face comes from props, in the same precedence (disabled, chosen, on, waiting,
 * off); the outline is an inset shadow so faces never change size; the same glyphs, accessible
 * names, `aria-pressed`/`aria-haspopup`/`aria-expanded`/`aria-disabled`; disabled stays focusable;
 * long press (held or right-click) swallows its click; `hold` follows one pointer and ends on
 * release, cancel, lost capture, disable or unmount.
 *
 * **Tuning knobs**
 * - `--yh-button-*`: the face's colour roles, set per tone and variant in Button.css: `tone`
 *   (whose key it is), `fill` and `ink` (the on ring, dot, underline and solid face, and the label
 *   on it), `line` (rest outline), `rest` (rest hover tint), `glow` (lit bloom), `cta` and
 *   `cta-ink` (the primary fill and its label), `tint` (the hover, press and waiting wash).
 * - `--yh-wait-ring`: the waiting and on ring's weight, one weight across Button, LampButton and Pad.
 */
export function Button({ icon, ...props }: ButtonProps) {
  return <Tree tree={buttonView(props, { icon: icon !== undefined })} slots={{ icon }} handlers={buttonHandlers(props)} />;
}

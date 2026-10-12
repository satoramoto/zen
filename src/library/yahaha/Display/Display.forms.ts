// Display's forms (docs/assembly.md): what each one needs, in scale units, worked out from the
// same parts and steps Display.css draws with, so the CSS honours the numbers. `displayLengthCss`
// turns a need into the CSS the hero's readouts scale from (`--yh-display-min-w`, `-min-h`).
import { CHAR_WIDTH, ROLE_LEADING, lengthMax, lengthSum } from '../../layout/assembly/units';
import type { Form, Forms, Length, Need, Units } from '../../layout/assembly/types';
import type { Step } from '../../primitives/step';
import type { TextRole } from '../../primitives/Text';

/** The Display's forms, most room first. */
export type DisplayForm = 'full' | 'compact' | 'minimal';

export const DISPLAY_FORM_IDS = ['full', 'compact', 'minimal'] as const satisfies readonly DisplayForm[];

/** The three readouts, ranked. */
export type DisplayReadout = 'section' | 'tempo' | 'chord';

/**
 * Each readout's cap per form, in numeral sizes (`--size-numeral`); every readout's floor is one
 * numeral size. At numeral 32: full 96 / 84 / 72, compact 60 / 52 / 44, minimal 40 / 36 / 32.
 * Display.css sets the same factors (`--yh-display-cap-*`); a test holds the two together.
 */
export const DISPLAY_CAPS: Record<DisplayForm, Record<DisplayReadout, number>> = {
  full: { section: 3, tempo: 2.625, chord: 2.25 },
  compact: { section: 1.875, tempo: 1.625, chord: 1.375 },
  minimal: { section: 1.25, tempo: 1.125, chord: 1 },
};

/**
 * The share of the room past the form's least that each readout's size takes, per axis (its
 * size is the smaller of the two). Each share times what a px of that readout costs on the axis
 * stays at or under 1, so a box at least the form's least is never overflowed:
 * across, 4.6 × 0.15 + 1.8 × 0.1 + 1.8 × 0.07 ≈ 1 (the section's 7 characters and its block's
 * padding, the tempo's 3 digits, the chord's 3 characters); down, the section cell 1.5 × 0.66
 * (its line box and the "then" name), the tempo's line 1.05 × 0.9, the chord's 1.15 × 0.85.
 * Display.css sets the same factors; a test holds the two together.
 */
export const DISPLAY_GROWTH: Record<'w' | 'h', Record<DisplayReadout, number>> = {
  w: { section: 0.15, tempo: 0.1, chord: 0.07 },
  h: { section: 0.66, tempo: 0.9, chord: 0.85 },
};

/**
 * What the needs are sized for, in characters: a section name of seven ("Intro II" in a
 * condensed face, "Main B" anywhere; a longer one steps the three readouts down together), a chord
 * of three ("Am7"; a longer one steps itself down), four notes, a fingering of sixteen ("Fingered
 * On Bass"; a longer one ends in an ellipsis, whole in its spoken name and tooltip), "fill after
 * bar 4", three digits of tempo. Text in label case (the keys, the One Touch caption, BPM) counts
 * a quarter wider (`CAPS`), for capitals and tracking.
 */
export const DISPLAY_CONTENT = {
  section: 7,
  chord: 3,
  notes: 13,
  fingering: 16,
  when: 16,
  bpm: 3,
  unit: 3,
  oneTouch: 9,
  tap: 3,
  styleTempo: 11,
} as const;

/** Capitals and label tracking: a label-cased character is this many average ones. */
const CAPS = 1.25;

/** The chrome per form: spacing steps, and the beat cells' line. */
export const DISPLAY_CHROME: Record<
  DisplayForm,
  {
    /** The frame's padding: block, inline. */
    pad: [Step, Step];
    /** Under the header: the gap to its rule (none: no rule), then the gap to the readouts. */
    rule: Step | null;
    below: Step;
    /** Between the readout cells. */
    columns: Step;
    /** Inside the tempo cell: number, beat, keys. */
    tempo: Step;
    /** The tempo keys' side padding. */
    keyPad: Step;
    /** The beat cells' line (BarBeat is three times it): a step, or a hairline. */
    beat: Units;
    /** The style name's least width, in control heights. */
    name: number;
  }
> = {
  full: { pad: [3, 2], rule: 3, below: 4, columns: 3, tempo: 3, keyPad: 2, beat: { space: 2 }, name: 4.5 },
  compact: { pad: [2, 1], rule: 2, below: 3, columns: 2, tempo: 2, keyPad: 1, beat: { space: 1 }, name: 4.5 },
  minimal: { pad: [1, 1], rule: null, below: 1, columns: 2, tempo: 1, keyPad: 1, beat: { px: 2 }, name: 3 },
};

const sum = lengthSum;
const max = lengthMax;
const chars = (role: TextRole, n: number): Units => ({ chars: { [role]: n } });
const lines = (role: TextRole, n: number): Units => ({ lines: { [role]: n } });
/** k numeral sizes (a numeral line is its size: leading 1). */
const numeral = (k: number): Units => lines('numeral', k);
const space = (...steps: Step[]): Units => ({ space: steps });
const control = (n: number): Units => ({ control: n });
const times = (n: number, u: Units): Length => sum(...Array<Length>(n).fill(u));

/** One form's least, from the parts Display.css lays out (each readout at its floor). */
function least(id: DisplayForm): Need {
  const c = DISPLAY_CHROME[id];
  const k = DISPLAY_CONTENT;
  const thenName: TextRole = id === 'minimal' ? 'label' : 'heading';

  // The tempo keys: Tap and Style tempo, a step apart.
  const keysW = sum(space(c.keyPad, c.keyPad, c.keyPad, c.keyPad, 1), chars('label', (k.tap + k.styleTempo) * CAPS));

  // The section: the block (its name, a fifth of its size each side), the "then" tab under it
  // (the arrow and the next name over when, or the status over the arrow and name).
  const blockW = sum(chars('numeral', k.section), numeral(0.4));
  const tabW = sum(space(3, 3), max(sum(chars('label', 0.5 / CHAR_WIDTH), space(2), chars(thenName, k.section)), chars('label', k.when)));
  const section: Need = {
    w: max(blockW, tabW),
    h: sum(numeral(1.15), space(1, 1), lines(thenName, 1), lines('body', 1)),
  };

  // The chord: its line box, then the notes over the fingering (each a body line at most).
  const chord: Need = {
    w: max(chars('numeral', k.chord), chars('label', k.fingering), chars('label', k.notes)),
    h: sum(numeral(1.15), space(1, 1, 1), lines('body', 2)),
  };

  // The tempo: the number and + over − (never shorter than the pair), centred in the section's
  // line box; the beat cells; the keys (in the header, minimal).
  const readoutW = sum(chars('numeral', k.bpm), space(2), chars('caption', k.unit * CAPS), space(3), control(1));
  const beatW = space(6, 6, 6, 6);
  const beatH = times(3, c.beat);
  const reading = max(numeral(1.15), numeral(1.05), control(2));
  const tempo: Need =
    id === 'minimal'
      ? { w: max(readoutW, beatW), h: sum(reading, space(c.tempo), beatH) }
      : { w: max(readoutW, beatW, keysW), h: sum(reading, space(c.tempo, c.tempo), beatH, control(1)) };

  const readouts: Need = {
    w: sum(section.w, chord.w, tempo.w, space(c.columns, c.columns)),
    h: max(section.h, chord.h, tempo.h),
  };

  // The header: ‹ name ›, One Touch (its caption, then 1–4); minimal: no caption, the tempo keys.
  const style = sum(control(2 + c.name), space(1, 1));
  const header: Need =
    id === 'minimal'
      ? { w: sum(style, space(1), control(4), space(1), keysW), h: control(1) }
      : { w: sum(style, space(3), chars('caption', k.oneTouch * CAPS), space(3), control(4)), h: sum(control(1), space(c.rule ?? 0), { px: 2 }) };

  const [block, inline] = c.pad;
  return {
    w: sum(space(inline, inline), max(header.w, readouts.w)),
    h: sum(space(block, block), header.h, space(c.below), readouts.h),
  };
}

/** The room past `min` at which every readout reaches its cap. */
function ideal(id: DisplayForm, min: Need): Need {
  const past = (axis: 'w' | 'h') =>
    max(...(['section', 'tempo', 'chord'] as const).map((r) => numeral((DISPLAY_CAPS[id][r] - 1) / DISPLAY_GROWTH[axis][r])));
  return { w: sum(min.w, past('w')), h: sum(min.h, past('h')) };
}

function form(id: DisplayForm): Form<DisplayForm> {
  const min = least(id);
  // Every form takes spare width (the chord's column and the readouts use it). Past its ideal no
  // readout grows, so extra height would only be an empty band: no form grows on h; the solver
  // raises it toward its ideal, and the readouts use all of that.
  return { id, min, ideal: ideal(id, min), grow: { w: true } };
}

/**
 * The Display's forms, most room first: `full` (the roomy chrome, the large caps), `compact`
 * (tight chrome, about 200px tall on the compact scale), `minimal` (the tempo keys in the header,
 * a hairline beat, no rule: every concept in the least height). Each is smaller than the one
 * before on both axes. The needs are the Display's own box (no parts column: the Stage's mixer
 * names the sounds); the Region's plate is added by the solver.
 */
export const DISPLAY_FORMS: Forms<DisplayForm> = [form('full'), form('compact'), form('minimal')];

/** Each spacing step as CSS. */
const STEP_CSS: Record<Step, string> = {
  0: '0px',
  1: 'var(--space-1)',
  2: 'var(--space-2)',
  3: 'var(--space-3)',
  4: 'var(--space-4)',
  5: 'var(--space-5)',
  6: 'var(--space-6)',
};
/** Each text role's size as CSS (code is set at body size). */
const SIZE_CSS: Record<TextRole, string> = {
  display: 'var(--size-display)',
  numeral: 'var(--size-numeral)',
  heading: 'var(--size-heading)',
  body: 'var(--size-body)',
  label: 'var(--size-label)',
  caption: 'var(--size-caption)',
  code: 'var(--size-body)',
};

/**
 * A length as CSS, in the contract's variables: control heights `var(--control-h)`, steps
 * the spacing steps' variables, units the first step, text its role's size variable times its
 * leading (lines) or the average glyph width (chars). `target` is not used here (the solver's
 * `minTarget` has no variable).
 */
export function displayLengthCss(len: Length): string {
  if (len === 0) return '0px';
  if ('max' in len) return `max(${len.max.map(displayLengthCss).join(', ')})`;
  if ('sum' in len) return `calc(${len.sum.map(displayLengthCss).join(' + ')})`;
  const parts: string[] = [];
  const u = len as Units;
  if (u.control) parts.push(`var(--control-h) * ${u.control}`);
  if (u.space !== undefined) for (const s of typeof u.space === 'number' ? [u.space] : u.space) parts.push(STEP_CSS[s]);
  if (u.unit) parts.push(`var(--space-1) * ${u.unit}`);
  for (const [role, n] of Object.entries(u.lines ?? {}) as [TextRole, number][]) parts.push(`${SIZE_CSS[role]} * ${round(n * ROLE_LEADING[role])}`);
  for (const [role, n] of Object.entries(u.chars ?? {}) as [TextRole, number][]) parts.push(`${SIZE_CSS[role]} * ${round(n * CHAR_WIDTH)}`);
  if (u.px) parts.push(`${u.px}px`);
  if (u.target) throw new Error('Display: a target has no CSS variable');
  return parts.length ? `calc(${parts.join(' + ')})` : '0px';
}

const round = (n: number) => Number(n.toFixed(4));

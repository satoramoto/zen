// SongForm's forms (docs/assembly.md): what each half needs, in scale units, read from the
// lengths SongForm.css actually sets. Each need is the half's own box; the Region's plate is the
// solver's. A test resolves every list under every pack and holds the CSS breakpoints to them.
import { ROLE_LEADING, combineForms, lengthMax, lengthSum, type Forms, type Length, type Units } from '../../layout/assembly';
import type { Step } from '../../primitives/step';
import type { TextRole } from '../../primitives/Text';

/** The transport cluster's forms (`part="transport"`). */
export type TransportFormId = 'keys' | 'tight' | 'compact';
/** The song form strip's forms (`part="form"`). */
export type FormFormId = 'strip' | 'folded';
/** The form over the transport, one region (`part="both"`). */
export type SongFormFormId = 'full' | 'short';

/*
 * The width breakpoints in SongForm.css, in control heights (the root's em is --control-h).
 * Container queries can't read variables, so the CSS repeats these numbers; the test holds each
 * one to the width its font really needs under every scale.
 */
export const BREAKS = {
  /** The strip's steps at heading size from here (body below). */
  stripHeading: 31,
  /** The strip's steps at numeral size from here. */
  stripNumeral: 39,
  /** The folded strip's steps at heading size from here (body below; it never goes to numeral). */
  foldedHeading: 36,
  /** The keys' labels grow (body, Start / Stop at display) from this width, once five control heights tall. */
  keysBig: 25,
  /** ...and from this height. */
  keysBigHeight: 5,
} as const;

/* ---------- small helpers ---------- */

const chars = (role: TextRole, n: number): Units => ({ chars: { [role]: n } as Partial<Record<TextRole, number>> });
/** `n` times the role's font size (one line at leading 1, as the steps and the tag set it). */
const size = (role: TextRole, n: number): Units => ({ lines: { [role]: n / ROLE_LEADING[role] } as Partial<Record<TextRole, number>> });
const space = (...steps: Step[]): Units => ({ space: steps });
const times = (len: Length, n: number): Length[] => Array<Length>(n).fill(len);
/** A key's two borders, at the widest --border-width a material sets (2px each side, budgeted). */
const BORDERS: Units = { px: 4 };

/* ---------- the transport ---------- */

/**
 * A cell key's least width: the widest cell label whole. "Sync Start" (10 characters, one spare
 * for a caps face) and its `--space-2` inset each side; "Auto Fill" (9) with the lamp's LED and
 * gap (each `--space-2`) and its inset; never under three control heights (the CSS floor).
 */
const keyW = (role: TextRole): Length =>
  lengthMax(
    { control: 3 },
    lengthSum(chars(role, 11), space(2, 2), BORDERS),
    lengthSum(chars(role, 9), space(2, 2, 2, 2), BORDERS),
  );
/** Start / Stop: "Start" (5, one spare) and its inset, never under `floor` control heights. */
const startW = (role: TextRole, floor: number): Length => lengthMax({ control: floor }, lengthSum(chars(role, 6), space(2, 2), BORDERS));

/** The keys' gap: `--space-3` between every key (SongForm.css `.yh-songform__transport`). */
const KEY_GAP: Step = 3;

/** Start / Stop and four columns of two keys. */
const keysW = (label: TextRole, start: TextRole): Length =>
  lengthSum(startW(start, 3.5), ...times(keyW(label), 4), space(KEY_GAP, KEY_GAP, KEY_GAP, KEY_GAP));

export const TRANSPORT_FORMS: Forms<TransportFormId> = [
  {
    // Today's block: Start / Stop tall at the left, then a column a job (sync, fills, fade and
    // reset, the two modes), two rows of keys. It fills the height it is given (beside the hero),
    // and once five control heights tall and 25 wide its labels grow with the keys.
    id: 'keys',
    min: { w: keysW('label', 'label'), h: { control: 2, space: KEY_GAP } },
    ideal: {
      w: lengthMax(keysW('body', 'display'), { control: BREAKS.keysBig }),
      h: { control: BREAKS.keysBigHeight },
    },
    grow: { w: true, h: true },
  },
  {
    // Shorter and narrower: Start / Stop tall at the left, then a column a job in three rows
    // (sync, fills, fade and reset), the two modes along the bottom row under sync and fills; every
    // key one control height. Three control heights tall, so it is never taller than the hero's
    // least form beside it on the Stage.
    id: 'tight',
    min: {
      w: lengthSum(startW('label', 3), ...times(keyW('label'), 3), space(KEY_GAP, KEY_GAP, KEY_GAP)),
      h: { control: 3, space: [KEY_GAP, KEY_GAP] },
    },
    ideal: {
      w: lengthSum(startW('label', 3), ...times(keyW('label'), 3), space(KEY_GAP, KEY_GAP, KEY_GAP)),
      h: { control: 3, space: [KEY_GAP, KEY_GAP] },
    },
    grow: { w: true, h: true },
  },
  {
    // Narrow: Start / Stop tall down the left, then a row a job in two columns (sync, fills,
    // fade and reset, the modes), every key one control height. About 12 control heights wide, so
    // it sits beside the hero on a 900 px screen.
    id: 'compact',
    min: {
      w: lengthSum(startW('label', 3), keyW('label'), keyW('label'), space(KEY_GAP, KEY_GAP)),
      h: { control: 4, space: [KEY_GAP, KEY_GAP, KEY_GAP] },
    },
    ideal: {
      w: lengthSum(startW('label', 3), keyW('label'), keyW('label'), space(KEY_GAP, KEY_GAP)),
      h: { control: 4, space: [KEY_GAP, KEY_GAP, KEY_GAP] },
    },
    grow: { w: true, h: true },
  },
];

/* ---------- the song form ---------- */

/** A step's least width: "III" in the step font (`font × 1.8`) and its `--space-2` inset each side. */
const stepW = (role: TextRole): Length => lengthSum(chars(role, 3), space(2, 2));
/** Break: its word in the step font (5, one spare) and its `--space-3` inset, never under 2.5 control heights. */
const breakW = (role: TextRole): Length => lengthMax({ control: 2.5 }, lengthSum(chars(role, 6), space(3, 3), BORDERS));
/**
 * The strip's one row: ten steps, `--space-2` between steps in a part (seven gaps), `--space-6`
 * between the parts (two) and before Break (the form's gap and Break's own inset), Break's seam
 * (a hairline) and Break.
 */
const rowW = (role: TextRole): Length =>
  lengthSum(...times(stepW(role), 10), space(2, 2, 2, 2, 2, 2, 2, 6, 6, 6, 6), { px: 2 }, breakW(role));
/** A step's least height: 1.25 control heights, or one line of its glyph, its `--space-1` inset each way and borders. */
const stepH = (role: TextRole): Length => lengthMax({ control: 1.25 }, lengthSum(size(role, 1), space(1, 1), BORDERS));
/** The captions inline (folded): "Intro", "Main", "Ending" (15 characters, a spare each) and a `--space-2` after each. */
const CAPTIONS_W: Length = lengthSum(chars('caption', 18), space(2, 2, 2));
/** The caption line over the strip and its `--space-2` gap. */
const CAPTION_H: Length = lengthSum({ lines: { caption: 1 } }, space(2));
/** Folded: room above the steps for the NEXT tag that hangs over a step's top edge (0.72 caption sizes). */
const TAG_H: Length = size('caption', 0.72);

export const FORM_FORMS: Forms<FormFormId> = [
  {
    // The part captions over the steps, the steps in one row; the steps' glyphs at body size,
    // heading from 31 control heights wide and numeral from 39 (the strip read from a metre).
    // Its least height holds the numeral, so no width can clip a step.
    id: 'strip',
    min: { w: rowW('body'), h: lengthSum(CAPTION_H, stepH('numeral')) },
    ideal: {
      w: lengthMax(rowW('numeral'), { control: BREAKS.stripNumeral }),
      h: lengthSum(CAPTION_H, lengthMax({ control: 2 }, stepH('numeral'))),
    },
    grow: { w: true },
  },
  {
    // Shorter: each caption folded in before its part's steps, on the steps' line; the glyphs at
    // body size, heading from 36 control heights wide, never numeral.
    id: 'folded',
    min: { w: lengthSum(rowW('body'), CAPTIONS_W), h: lengthSum(TAG_H, stepH('heading')) },
    ideal: {
      w: lengthMax(lengthSum(rowW('heading'), CAPTIONS_W), { control: BREAKS.foldedHeading }),
      h: lengthSum(TAG_H, lengthMax({ control: 1.5 }, stepH('heading'))),
    },
    grow: { w: true },
  },
];

/** The widths the CSS breakpoints are held to (the test resolves them under every pack). */
export const WIDTHS = {
  /** The strip's row with its steps in `role`. */
  strip: (role: TextRole): Length => rowW(role),
  /** The folded strip's row, captions inline. */
  folded: (role: TextRole): Length => lengthSum(rowW(role), CAPTIONS_W),
  /** The keys with their grown labels (body, Start / Stop at display). */
  keysBig: keysW('body', 'display'),
};

/* ---------- both ---------- */

/** The gap between the form and the transport under it (SongForm.css `.yh-songform__inner`). */
export const BOTH_GAP: Step = 4;

/**
 * The form over the transport, one region (`part="both"`), most room first: the captioned strip,
 * then the folded one. The transport keeps its keys: the tight and compact clusters are narrower
 * but taller, and under the form (always the wider) narrower buys nothing.
 */
export const SONG_FORM_FORMS: Forms<SongFormFormId> = combineForms('down', BOTH_GAP, { form: FORM_FORMS, transport: TRANSPORT_FORMS }, [
  { id: 'full', parts: { form: 'strip', transport: 'keys' } },
  { id: 'short', parts: { form: 'folded', transport: 'keys' } },
]);

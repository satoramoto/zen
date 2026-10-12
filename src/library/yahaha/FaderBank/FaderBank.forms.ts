// FaderBank's forms (docs/assembly.md): what the mixer's BODY needs, in scale units, never
// measured. The Region round it (plate inset, head inset, the head's one control height) is the
// solver's to add. Each length below is a rule in FaderBank.css; the two are kept together.
import { lengthMax, lengthSum, type Forms, type Length } from '../../layout/assembly';
import type { Step } from '../../primitives/step';

export type FaderBankForm = 'tall' | 'short';

/* ---------- widths: the words the bank must keep whole ---------- */

/** Characters of a label-size Text. */
const label = (chars: number): Length => ({ chars: { label: chars } });

/**
 * Key labels are the label role in the label case (upper case in some faces, wider than the
 * 0.6 em average), so each key counts one character more than its word.
 */
const KEY_SLACK = 1;

/** A strip-wide LampButton: the bank's side inset (`--space-1` each side), its LED and gap (`--space-2` each), its border (≤ 1.5 px a side). */
const lampKey = (word: string): Length => ({ space: [1, 1, 2, 2], chars: { label: word.length + KEY_SLACK }, px: 4 });
/** The page Button under Master: the bank's side inset, no LED. */
const pageKey = (word: string): Length => ({ space: [1, 1], chars: { label: word.length + KEY_SLACK }, px: 4 });
/** A function LampButton in its Group: the `cell` key's own side inset (`--space-2`), its LED and gap. */
const functionKey = (word: string): Length => ({ space: [2, 2, 2, 2], chars: { label: word.length + KEY_SLACK }, px: 4 });

/**
 * One `Tabs` row: each tab its word and the widest tab inset any material gives (`--space-3` a
 * side), plus the track's padding and the hairline gaps between tabs.
 */
const tabs = (words: readonly string[]): Length =>
  lengthSum(...words.map((w): Length => ({ space: [3, 3], chars: { label: w.length + KEY_SLACK } })), { px: 6 + 3 * words.length });

/**
 * The head (the Region's): the fader pages (Panel, Style) and, in its aside, the layers (Vol …
 * Delay), a `--space-3` apart. Every material's head inset is no wider than its plate inset, so
 * this is what the body must be at least as wide as for the head to stay one row.
 */
const HEAD_W = lengthSum(tabs(['Panel', 'Style']), { space: 3 }, tabs(['Vol', 'Pan', 'Reverb', 'Chorus', 'Delay']));

/**
 * The strip row: nine content-sized tracks (`minmax(min-content, …fr)`), so each keeps its words:
 * a part its name ("Right 1") and its On/Off key; Style; "Multi Pad"; an empty slot a `--space-4`
 * wash; Master its name and the page key, inset on its plate. Ten column gaps and two divider
 * tracks (`--space-1`). The sound under each name is data of any length: it takes the strip's
 * width and ellipsizes, it never widens the strip.
 */
function stripRow(gap: Step, plate: Step): Length {
  const part = lengthMax(label(7), lampKey('Off'), { target: 1 });
  const master = lengthSum(lengthMax(label(6), pageKey('Panel')), { space: [plate, plate] });
  return lengthSum(part, part, part, part, label(5), label(9), { space: [4, 4] }, master, {
    space: [...Array<Step>(10).fill(gap), 1, 1],
  });
}

/** The function row: Harm/Arp, Sound, L Hold, Looper, a `--space-3` apart (their Group's gap). */
const FUNCTIONS_W = lengthSum(functionKey('Harm/Arp'), functionKey('Sound'), functionKey('L Hold'), functionKey('Looper'), { space: [3, 3, 3] });

const widthOf = (gap: Step, plate: Step): Length => lengthMax(stripRow(gap, plate), FUNCTIONS_W, HEAD_W);

/* ---------- heights: one column, top to bottom ---------- */

interface Column {
  /** The fader's travel: what is left of the strip once its head and the name are placed. */
  travel: Length;
  /** Master's plate inset (above its strip, below its page key). */
  plate: Step;
  /** The Fader's gap between its numeral row and its travel, and the room under the travel. */
  faderGap: Step;
  faderFoot: Step | 0;
  /** The name button's block padding. */
  namePad: Step | 0;
  /** Between the strips and the lamp row; between the grid and the function row; above its rule. */
  rowGap: Step;
  rootGap: Step;
  footPad: Step;
}

/**
 * The name block: the part's name (label), its sound and the marks line (captions), never less
 * than a control height, since it is a button. The marks line is counted: while any strip has a
 * mark every strip keeps it.
 */
const nameH = (pad: Step | 0): Length =>
  lengthMax({ control: 1 }, { space: pad === 0 ? [] : [pad, pad], lines: { label: 1, caption: 2 } });

function heightOf(c: Column): Length {
  const fader = lengthSum({ control: 1 }, { space: c.faderFoot === 0 ? [c.faderGap] : [c.faderGap, c.faderFoot] }, c.travel);
  const strip = lengthSum({ space: [c.plate, 1] }, fader, nameH(c.namePad));
  const lamps: Length = { control: 1, space: c.plate };
  const foot: Length = { space: c.footPad, px: 2, control: 1 };
  return lengthSum(strip, { space: [c.rowGap, c.rootGap] }, lamps, foot);
}

/* ---------- the forms ---------- */

/** `tall`: the board's mixer. Least travel three control heights, enough to read a level by where the cap sits. */
const TALL: Column = { travel: { control: 3 }, plate: 2, faderGap: 2, faderFoot: 1, namePad: 1, rowGap: 3, rootGap: 4, footPad: 3 };
/** `short`: the same strips and keys, every step tighter; least travel one control height and a `--space-3` (a usable drag; keys and wheel are exact). */
const SHORT: Column = { travel: { control: 1, space: 3 }, plate: 1, faderGap: 1, faderFoot: 0, namePad: 0, rowGap: 2, rootGap: 1, footPad: 2 };

const TALL_W = widthOf(2, 2);
const SHORT_W = widthOf(1, 1);

/**
 * The mixer's forms, most room first:
 *
 * - `tall`: today's strips, the travel growing with the room (grow w and h). Least: travel
 *   3 control heights. Ideal: travel 4, and 24 control heights across (the board's 702 px region).
 * - `short`: much less height, every concept kept (the four parts with names, sounds, levels and
 *   On keys; Style, Multi Pad, Master; soft takeover; the page key and the four function keys).
 *   Least: travel 1 control height and `--space-3`. Ideal: travel 2, 20 across. Grows in width.
 */
export const FADER_BANK_FORMS: Forms<FaderBankForm> = [
  {
    id: 'tall',
    min: { w: TALL_W, h: heightOf(TALL) },
    ideal: { w: lengthMax(TALL_W, { control: 24 }), h: heightOf({ ...TALL, travel: { control: 4 } }) },
    grow: { w: true, h: true },
  },
  {
    id: 'short',
    min: { w: SHORT_W, h: heightOf(SHORT) },
    ideal: { w: lengthMax(SHORT_W, { control: 20 }), h: heightOf({ ...SHORT, travel: { control: 2 } }) },
    grow: { w: true },
  },
];

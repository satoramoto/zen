import { Region } from '../../layout/Region';
import { Pad, type PadFamily, type PadOnFace, type PadState, type TipAction } from '../../components/music/Pad/Pad';
import { PART_HUE_INDEX, type Part } from '../hues';
import { useChosenForm, useForm } from '../../layout/assembly/forms';
import { lengthMax, needsAcross, needsDown } from '../../layout/assembly/units';
import type { Forms, Length, Need } from '../../layout/assembly/types';
import type { Step } from '../../primitives/step';
import './PadBank.css';

export type { TipAction };

/** A bank pad's family: the library Pad's families, or a Yahaha part the engine lights in its hue. */
export type BankPadFamily = PadFamily | Part;

const isPart = (family: BankPadFamily): family is Part => family === 'r1' || family === 'r2' || family === 'r3' || family === 'l';

/** One of the sixteen band pads. */
export interface PadItem {
  /**
   * The caption ("Rack 1", "Manual Bass"). Tie a numeral to its word with a no-break space (U+00A0),
   * so only whole words wrap; mark where a long word may break with a soft hyphen (U+00AD) and give
   * `name` without it.
   */
  label: string;
  /**
   * A section (`intro`, `main`, `ending`, `brk`, `fill`: the Sections bank), `util` (neutral),
   * `start` (Start / Stop), or a part (`r1`, `r2`, `r3`, `l`) for a pad the engine lights in that
   * part's hue. A playing section is the solid fill (it is sounding); any other on pad is a ring.
   */
  family: BankPadFamily;
  /** A transport pad (Sync Start, Auto Fill, Tap, Sync Stop, Start / Stop): `--transport` (the Pad's role 2) while active, neutral at rest. */
  transport?: boolean;
  /** The face: `playing` is on / loaded / chosen, `dark` is absent or an empty slot, `armed` / `next` wait. */
  state: PadState;
  /** Nothing is assigned to this pad on this bank: drawn as a quiet mark, not a key, and not pressable. */
  empty?: boolean;
  /** The accessible name. Default: "{label} (pad {n})", or "Pad {n}: empty". */
  name?: string;
  /** The tooltip key. */
  tip?: string;
}

/** Each bank tab's tooltip key, by the bank's name. */
const BANK_TIP: Record<string, string> = {
  Sections: 'padpage.sections',
  'Quick Racks': 'padpage.racks',
  Chord: 'padpage.chord',
  'Multi Pads': 'padpage.multi_pads',
  Setup: 'padpage.setup',
};

/** The Launchkey's pad count: the bank always draws this many cells. */
export const PAD_SLOTS = 16;

/** The most armed pads that still carry their ARMED chip; past this the ring alone says it. */
export const ARMED_CHIPS = 2;

/* ---------- forms: the room the pads take (docs/assembly.md) ---------- */

/** The bank's forms: two rows of eight (the Launchkey's layout), the same with smaller chipless pads, or all sixteen in one row. */
export type PadBankForm = 'two-rows' | 'small' | 'one-row';

/** The space between pads, as a step: PadBank.css's `--yh-padbank-gap` reads the same one. */
export const PAD_GAP: Step = 2;

/**
 * The least side a pad keeps its face whole at, the larger of three:
 * - a target (`target: 1`: a control height, or the pack's `minTarget` if larger);
 * - across: six caption characters (`Ending`, `Start /`: the longest words wrap whole), the face's
 *   2 px side insets (PadBank.css) and its two borders (up to 1.5 px each);
 * - down: a waiting pad's top chip and two label lines (the chip's row is the caption × 1.4, each
 *   snug label line the caption × 1.15: 3.7 caption sizes, which is 2.85 caption lines at their
 *   1.3 leading), the face's insets (two `--space-1` above the label, one below, Pad.css) and
 *   its two borders.
 */
export const PAD_MIN_SIDE: Length = lengthMax(
  { target: 1 },
  { chars: { caption: 6 }, px: 7 },
  { lines: { caption: 2.85 }, space: [1, 1, 1], px: 3 },
);

/** A comfortable pad: 2.5 control heights (the library Pad's own size), never below the least. */
export const PAD_IDEAL_SIDE: Length = lengthMax(PAD_MIN_SIDE, { control: 2.5 });

/**
 * The least side of a `small` pad, which carries no waiting chip (its ring alone says ARMED /
 * NEXT, PadBank.css), the larger of three:
 * - a target (`target: 1`), as `PAD_MIN_SIDE`;
 * - across: the same six caption characters, 2 px side insets and two borders;
 * - down: two snug label lines (the caption × 1.15 each: 2.3 caption sizes, 1.77 caption lines
 *   at their 1.3 leading, rounded up), one `--space-1` inset above and one below, and the two borders;
 * - the bank tabs: eight pads and their seven gaps must be as wide as the head's one row of five
 *   tabs, so each pad takes an eighth of that row less the gaps. The row is the five names'
 *   39 label characters plus the widest materials' tab chrome (hardware: ten `--space-3` tab
 *   insets, 30 units, and a 3 px track inset each side and four 2 px gaps, 14 px); a material
 *   with more chrome must raise this (the tabs test checks every pack).
 */
export const PAD_SMALL_SIDE: Length = lengthMax(
  { target: 1 },
  { chars: { caption: 6 }, px: 7 },
  { lines: { caption: 1.77 }, space: [1, 1], px: 3 },
  // (39 label characters + 30 units + 14 px − 7 × --space-2, which is 2 units) / 8.
  { chars: { label: 39 / 8 }, unit: (30 - 7 * 2) / 8, px: 14 / 8 },
);

/** A comfortable `small` pad: 2 control heights, never below its least. */
export const PAD_SMALL_IDEAL_SIDE: Length = lengthMax(PAD_SMALL_SIDE, { control: 2 });

/** `rows` rows of `columns` square pads of side `side`, `PAD_GAP` apart. */
function padGrid(columns: number, rows: number, side: Length): Need {
  const pad: Need = { w: side, h: side };
  const row = needsAcross(PAD_GAP, ...Array<Need>(columns).fill(pad));
  return needsDown(PAD_GAP, ...Array<Need>(rows).fill(row));
}

/** `n` gap steps (the gaps between `n + 1` pads), outside a form's ratio. */
const gaps = (n: number): Length => (n > 0 ? { space: Array<Step>(n).fill(PAD_GAP) } : 0);

/**
 * The bank's forms, most room first, for the Pads region's BODY only (the region's plate, its
 * head inset and the bank tabs' one control-height row are the solver's). All grow across, and
 * their height follows their width (`ratio`), so every pad is a square and the body has no band:
 *
 * - `two-rows`: two rows of eight (pads 1–8 over 9–16), the Launchkey's layout.
 * - `small`: the same two rows of eight, but no pad shows the ARMED / NEXT chip (the ring alone
 *   says it waits), so its pads go down to `PAD_SMALL_SIDE`, narrower and shorter.
 * - `one-row`: all sixteen in one row, 1–16, under half the height.
 */
export const PAD_BANK_FORMS: Forms<PadBankForm> = [
  {
    id: 'two-rows',
    min: padGrid(8, 2, PAD_MIN_SIDE),
    ideal: padGrid(8, 2, PAD_IDEAL_SIDE),
    grow: { w: true },
    ratio: { w: 8, h: 2, fixed: { w: gaps(7), h: gaps(1) } },
  },
  {
    id: 'small',
    min: padGrid(8, 2, PAD_SMALL_SIDE),
    ideal: padGrid(8, 2, PAD_SMALL_IDEAL_SIDE),
    grow: { w: true },
    ratio: { w: 8, h: 2, fixed: { w: gaps(7), h: gaps(1) } },
  },
  {
    id: 'one-row',
    min: padGrid(16, 1, PAD_MIN_SIDE),
    ideal: padGrid(16, 1, PAD_IDEAL_SIDE),
    grow: { w: true },
    ratio: { w: 16, h: 1, fixed: { w: gaps(15), h: 0 } },
  },
];

/** The song-section families: on, they are sounding, so they keep the Pad's solid fill. */
const SECTION_FAMILIES: ReadonlySet<BankPadFamily> = new Set<BankPadFamily>(['intro', 'main', 'ending', 'brk', 'fill']);

/** How a bank pad shows "on": a sounding section fills; everything else (a loaded rack, a chosen fingering, Auto Fill on) rings. */
export function bankOnFace(family: BankPadFamily): PadOnFace {
  return SECTION_FAMILIES.has(family) ? 'fill' : 'ring';
}

/** A cell with nothing given for it. */
const EMPTY: PadItem = { label: '', family: 'util', state: 'idle', empty: true };

export interface PadBankProps {
  /** The sixteen pads, row by row. Fewer: the rest are empty cells; more: those past sixteen are ignored. */
  pads: PadItem[];
  /**
   * The bank's form (`PAD_BANK_FORMS`): `two-rows` (two rows of eight), `small` (two rows of
   * eight, smaller pads without the waiting chip) or `one-row` (sixteen in a row). Wins over the form an assembled screen chose for the region, which wins over `columns`.
   */
  form?: PadBankForm;
  /**
   * The bank on its own, outside the forms: 4 draws a 4 × 4 grid (1–4, 5–8, 9–12, 13–16); 8 is
   * the `two-rows` form. Used only when no `form` is given and no assembled screen chose one, so
   * a screen that assembles the region always decides its shape.
   */
  columns?: 4 | 8;
  /** The pad bank names, one view of the Pads region each, in order ("Sections", "Quick Racks", "Chord", "Multi Pads", "Setup"). */
  banks?: string[];
  /** The chosen bank's index in `banks`. */
  bank?: number;
  /** Each bank tab's tooltip key, by index. Default: by the bank's name (padpage.racks, padpage.chord, …). */
  bankTips?: string[];
  /** The bank's name: the one tab shown when `banks` is missing or empty. */
  bankName?: string;
  /** The flash phase of armed and queued pads. */
  lit?: boolean;
  /** The app's tooltip hook, passed to every pad. */
  tipAction?: TipAction;
  /** A bank tab was chosen (its index in `banks`), by click or arrow key. */
  onBank?: (index: number) => void;
  /** A pad was pressed (0–15). Not for an empty pad. */
  onPress?: (index: number) => void;
}

/**
 * PadBank: the body of the Stage's Pads region: the sixteen Launchkey pads of the chosen bank
 * (Sections, Quick Racks, Chord, Multi Pads or Setup). The banks are the region's views
 * (`PadBankRegion`), so the bank draws no tab row of its own.
 *
 * **Job.** Say which bank the pads are on and, at a glance across sixteen keys, which ones are on
 * (the playing section, the loaded rack, the playing Multi Pad, the chosen fingering), which wait
 * (the next section, Store armed), which slots are empty, and what each one does; take a press by
 * index.
 *
 * **Changed.** *Mapping*: the Sections bank is back, first, because the Launchkey's pads play
 * the sections and a player needs a pad tab that matches the hardware; its sixteen pads are the
 * original's, in the hardware's order (Intro I–III, Sync Start, Ending I–III, Auto Fill; Main
 * A–D, Break, Tap, Sync Stop, Start / Stop). The song-form strip still says the song's shape;
 * these are the same sections as keys. The section hue legend stays gone (`hues.ts`: sections
 * take no hue). The bank list is data, and each tab finds its tooltip by name, not position.
 * *Colour meaning* (`hues.ts`; `color.md`, "state changes: structure, not circus"): the banks
 * are functions, not parts, so their pads are neutral, and a part hue appears only on a pad the
 * engine lights for that part; next is `--accent`; the transport pads wear `--transport` only
 * while active, and Start / Stop running is `--success` (the Pad's rules). *Hierarchy* (the
 * 2026-10 Stage review: a solid fill means "sounding or running" only): a playing section is the
 * solid fill, as on the song-form strip, since it is sounding; any other on pad (the loaded
 * rack, the chosen fingering, Auto Fill on) is the Pad's `ring` face, an outline and a lit dot,
 * so four on pads never read as four white keys competing with the playing section. An absent
 * section is the Pad's dashed dark face and is spoken "not in this style". Waiting is the Pad's ring and chip; when more
 * than two pads are armed at once (Store armed arms every slot) the chips go and the warning
 * rings alone say it, so a row of yellow ARMED words doesn't bury the labels. The chosen bank is
 * the raised key in the region's tab well. *Clutter*: the "Pads" title is gone, since the bank tabs name the
 * region (it keeps "Pads" as its accessible name). *Mapping*: the Launchkey always has sixteen
 * pads, so the bank always draws sixteen cells, whatever `pads` holds (missing ones are empty,
 * extras ignored), and each screen position maps one to one to a hardware pad. *One empty-slot
 * vocabulary* across the three banks: a pad with nothing assigned (the Chord bank's top row,
 * Setup's spare pads) is the pad's full footprint as a faint wash, with no edge and no label, out
 * of the tab order and not pressable, the same faint ink as KnobBank's empty ring and FaderBank's
 * parked groove. A dark pad is kept for what exists but is empty or absent (a Quick Rack slot
 * with nothing stored), with its dashed edge and label, since a press there still means
 * something; edge versus no edge keeps the two apart. *Shape* (affordance: a pad is a square key
 * on the hardware): every pad, empty and dark ones too, is a square with the contract's rounded
 * corners, never a stretched rectangle. Its side is the tighter of the room's width over the
 * columns and its height over the rows, so a wide, short region gets smaller squares; the grid
 * hangs under the tabs, centred across, and spare height goes below it. *Rhythm*: `--space-2`
 * between pads (`PAD_GAP`, the step the forms count), so sixteen keys read as sixteen, not as one
 * slab. With no height given, the room's height follows its width; the same bank also works as a
 * 4 × 4 block. *Forms* (`PAD_BANK_FORMS`, `PadBank.forms`; docs/assembly.md): `two-rows` (two
 * rows of eight), `small` (two rows of eight whose pads drop the waiting chip and let the ring
 * say it, so they can be smaller) and `one-row` (sixteen in a row, 1–16, under half the height), read with
 * `useForm`, so an assembled screen can trade the bank's height away before it zooms; the root
 * carries `data-form`, and a form changes only the bank's own grid. Each declares its body's
 * needs truthfully (`PAD_MIN_SIDE`: a pad keeps its chip and two caption lines whole;
 * `PAD_SMALL_SIDE`: two caption lines, no chip) and a
 * `ratio`, so its height follows its width and the pads stay square. `columns` 4 is the bank on
 * its own, outside the forms: it applies only when no form is given or chosen.
 * *Headless*: named parts (`plate`, `room`, `grid`, `cell`, `empty`); the bank paints no panel of its
 * own (it sits inside a screen's `Region`, which the theme's `plate` material draws) and each pad
 * wears the theme's `key` material (the Pad's), so a material set
 * restyles the bank without touching it.
 *
 * **Kept.** Holds no state: the bank comes in `bank` and the flash phase in `lit`; a tab choice
 * and a press go out by index. A region named "Pads" (now the screen's `Region`, whose tabs are the library `Tabs`),
 * the `bankName` fallback tab, `bankTips`, the 8 / 4 `columns`, each pad's face from the Pad
 * primitive (a waiting pad's ARMED / NEXT chip and the room it keeps above the label are the Pad's
 * own; the bank sets only the inset), and the spoken names ("Rack 1 (pad 1)", "Pad 12: empty").
 *
 * **Tuning knobs.** `--yh-padbank-gap` (the space between pads: `--space-2`, as `PAD_GAP`; a
 * different step must change both), `--yh-padbank-cols` and `--yh-padbank-rows` (the grid the
 * square side is fitted to, set from the form or `columns`),
 * `--yh-padbank-cell` (the square pad's side, the tighter of the room's width and height share).
 */
export function PadBank({
  pads,
  form: given,
  columns,
  lit = true,
  tipAction,
  onPress,
}: PadBankProps) {
  const form = useForm(PAD_BANK_FORMS, given);
  const chosen = useChosenForm();
  // `columns` 4 is the bank outside the forms: only when neither the prop nor a screen names a form.
  const fourByFour = columns === 4 && given === undefined && !PAD_BANK_FORMS.some((f) => f.id === chosen);
  const shown = fourByFour ? 4 : form === 'one-row' ? 16 : 8;
  const cells = Array.from({ length: PAD_SLOTS }, (_, i) => pads[i] ?? EMPTY);
  const armed = cells.filter((pad) => !pad.empty && pad.state === 'armed').length;

  return (
    <div
      className="yh-padbank"
      data-part="root"
      lang="en"
      data-form={fourByFour ? undefined : form}
      data-armed={armed > ARMED_CHIPS ? 'many' : undefined}
    >
      <div className="yh-padbank__room" data-part="room" data-columns={shown}>
        <div className="yh-padbank__pads" data-part="grid" data-columns={shown}>
          {cells.map((pad, i) => (
            <div key={i} className="yh-padbank__cell" data-part="cell" data-empty={pad.empty || undefined}>
              {pad.empty ? (
                <span className="yh-padbank__empty" data-part="empty" role="img" aria-label={pad.name ?? `Pad ${i + 1}: empty`} />
              ) : (
                <Pad
                  label={pad.label}
                  index={String(i + 1)}
                  family={isPart(pad.family) ? 'util' : pad.family}
                  hue={isPart(pad.family) ? PART_HUE_INDEX[pad.family] : undefined}
                  state={pad.state}
                  lit={lit}
                  name={pad.name}
                  tip={pad.tip}
                  tipAction={tipAction}
                  role={pad.transport ? 2 : undefined}
                  fillCell
                  onFace={bankOnFace(pad.family)}
                  onPress={() => onPress?.(i)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
PadBank.forms = PAD_BANK_FORMS;

export interface PadBankRegionProps extends PadBankProps {
  /** The region's name. Default "Pads". */
  name?: string;
  /** The grid area the region fills in its screen. */
  area?: string;
  className?: string;
}

/**
 * The pads as a screen region: a library `Region` whose views are the pad banks (or the one
 * `bankName` view), each tab with its tooltip key, and the PadBank for the chosen bank as its
 * body. The bank stays the caller's (`bank`, `onBank`, by index). `form` passes through to the
 * bank (or comes from the assembled screen); `PAD_BANK_FORMS` are the body's needs, so the
 * region's spec says `head: true` and the solver adds the tabs' row.
 */
export function PadBankRegion({ name = 'Pads', area, className, ...pads }: PadBankRegionProps) {
  const { banks = [], bank = 0, bankTips = [], bankName = '' } = pads;
  const names = banks.length > 0 ? banks : [bankName];
  const body = <PadBank {...pads} />;
  return (
    <Region
      name={name}
      area={area}
      className={className}
      view={String(banks.length > 0 ? bank : 0)}
      onView={(id) => pads.onBank?.(Number(id))}
      tipAction={pads.tipAction}
    >
      {names.map((label, i) => (
        <Region.View key={i} id={String(i)} label={label} tip={bankTips[i] ?? BANK_TIP[label]}>
          {body}
        </Region.View>
      ))}
    </Region>
  );
}

export default PadBank;

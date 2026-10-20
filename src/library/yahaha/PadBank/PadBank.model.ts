// PadBank's model: its props, its forms and the trees a renderer draws: the bank (the root, the
// room, the grid, each cell with its Pad or its empty mark) and the Pads region (a Region, one tab
// per bank, the bank as its body). No framework: `PadBank.tsx` (React) and `PadBank.svelte` /
// `PadBankRegion.svelte` (Svelte) each hand one of these to their `Tree`.
import type { PadFamily, PadModelProps, PadOnFace, PadState } from '../../components/music/Pad/Pad.model';
import type { TipAction } from '../../view/tip';
import { component, each, h, type ComponentNode, type Handlers, type Node } from '../../view/Tree.model';
import { PART_HUE_INDEX, type Part } from '../hues';
import { lengthMax, needsAcross, needsDown } from '../../layout/assembly/units';
import type { Forms, Length, Need } from '../../layout/assembly/types';
import type { Step } from '../../primitives/step';

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
export const BANK_TIP: Record<string, string> = {
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

export interface PadBankRegionProps extends PadBankProps {
  /** The region's name. Default "Pads". */
  name?: string;
  /** The grid area the region fills in its screen. */
  area?: string;
  className?: string;
}

/** A pad's data props: the library Pad's, without its press and the tooltip hook (this tree's handlers). */
function padProps(pad: PadItem, i: number, lit: boolean): Omit<PadModelProps, 'tipAction' | 'onPress'> {
  return {
    label: pad.label,
    index: String(i + 1),
    family: isPart(pad.family) ? 'util' : pad.family,
    hue: isPart(pad.family) ? PART_HUE_INDEX[pad.family] : undefined,
    state: pad.state,
    lit,
    name: pad.name,
    tip: pad.tip,
    role: pad.transport ? 2 : undefined,
    fillCell: true,
    onFace: bankOnFace(pad.family),
  };
}

/**
 * The bank's tree: the root, the room, the grid and the sixteen cells, each a `Pad` (drawn by name,
 * its press the handler `press<i>`) or the empty mark. `form` is the form `useForm` / `getForm`
 * picked (the prop, else the screen's choice, else the first); `chosen` is the screen's choice
 * (`useChosenForm` / `getChosenForm`).
 */
export function padBankView({ pads, form: given, columns, lit = true }: PadBankProps, form: PadBankForm, chosen: string | null): Node {
  // `columns` 4 is the bank outside the forms: only when neither the prop nor a screen names a form.
  const fourByFour = columns === 4 && given === undefined && !PAD_BANK_FORMS.some((f) => f.id === chosen);
  const shown = String(fourByFour ? 4 : form === 'one-row' ? 16 : 8);
  const items = Array.from({ length: PAD_SLOTS }, (_, i) => pads[i] ?? EMPTY);
  const armed = items.filter((pad) => !pad.empty && pad.state === 'armed').length;
  return h(
    'div',
    {
      class: 'yh-padbank',
      'data-part': 'root',
      lang: 'en',
      'data-form': fourByFour ? undefined : form,
      'data-armed': armed > ARMED_CHIPS ? 'many' : undefined,
    },
    h(
      'div',
      { class: 'yh-padbank__room', 'data-part': 'room', 'data-columns': shown },
      h(
        'div',
        { class: 'yh-padbank__pads', 'data-part': 'grid', 'data-columns': shown },
        each(
          items,
          (_, i) => String(i),
          (pad, i) =>
            h(
              'div',
              { class: 'yh-padbank__cell', 'data-part': 'cell', 'data-empty': pad.empty ? 'true' : undefined },
              pad.empty
                ? h('span', { class: 'yh-padbank__empty', 'data-part': 'empty', role: 'img', 'aria-label': pad.name ?? `Pad ${i + 1}: empty` })
                : component('Pad', padProps(pad, i, lit), { on: { onPress: `press${i}`, tipAction: 'tipAction' } }),
            ),
        ),
      ),
    ),
  );
}

/** The bank's handlers: each pad's press with its index (`press<i>`), and the tooltip action. */
export function padBankHandlers({ onPress, tipAction }: Pick<PadBankProps, 'onPress' | 'tipAction'>): Handlers {
  const handlers: Handlers = { tipAction };
  for (let i = 0; i < PAD_SLOTS; i++) handlers[`press${i}`] = () => onPress?.(i);
  return handlers;
}

/** One bank tab: the region's view. */
export interface PadBankTab {
  id: string;
  label: string;
  tip?: string;
}

/** The Pads region's views (one per bank, or the one `bankName` view) and the chosen one's id. */
export function padBankTabs({ banks = [], bank = 0, bankTips = [], bankName = '' }: PadBankProps): { views: PadBankTab[]; view: string } {
  const names = banks.length > 0 ? banks : [bankName];
  return {
    views: names.map((label, i) => ({ id: String(i), label, tip: bankTips[i] ?? BANK_TIP[label] })),
    view: String(banks.length > 0 ? bank : 0),
  };
}

/**
 * The Pads region's tree: a library `Region` (drawn by name; its class as both `className` and
 * `class`, React's and Svelte's names) whose views are the banks (`padBankTabs`), with the PadBank
 * as its body. A tab choice is the handler `view` (the bank's id), a pad's press `press`, the
 * tooltip action `tipAction`. `form` goes to the bank, which reads the screen's otherwise.
 */
export function padBankRegionView({ name = 'Pads', area, className, pads, form, columns, lit, ...tabs }: PadBankRegionProps): ComponentNode {
  const { views, view } = padBankTabs({ pads, ...tabs });
  return component(
    'Region',
    { name, area, className, class: className, views, view },
    {
      on: { onView: 'view', tipAction: 'tipAction' },
      slots: { children: [component('PadBank', { pads, form, columns, lit }, { on: { onPress: 'press', tipAction: 'tipAction' } })] },
    },
  );
}

/** The region's handlers: a tab choice as the bank's index, a pad's press, the tooltip action. */
export function padBankRegionHandlers({ onBank, onPress, tipAction }: PadBankProps): Handlers {
  return { view: (id: string) => onBank?.(Number(id)), press: onPress, tipAction };
}

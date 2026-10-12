import { ChosenTabs, type TabItem } from '../ChosenTabs/ChosenTabs';
import { GroupHeader } from '../GroupHeader/GroupHeader';
import { Pad, type PadFamily, type PadOnFace, type PadState, type TipAction } from '../Pad/Pad';
import './PadBank.css';

export type { TipAction };

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
  family: PadFamily;
  /** A transport pad (Sync Start, Auto Fill, Tap, Sync Stop, Start / Stop): `--transport` while active, neutral at rest. */
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

/** The song-section families: on, they are sounding, so they keep the Pad's solid fill. */
const SECTION_FAMILIES: ReadonlySet<PadFamily> = new Set<PadFamily>(['intro', 'main', 'ending', 'brk', 'fill']);

/** How a bank pad shows "on": a sounding section fills; everything else (a loaded rack, a chosen fingering, Auto Fill on) rings. */
export function bankOnFace(family: PadFamily): PadOnFace {
  return SECTION_FAMILIES.has(family) ? 'fill' : 'ring';
}

/** A cell with nothing given for it. */
const EMPTY: PadItem = { label: '', family: 'util', state: 'idle', empty: true };

export interface PadBankProps {
  /** The sixteen pads, row by row. Fewer: the rest are empty cells; more: those past sixteen are ignored. */
  pads: PadItem[];
  /** Pads a row: 8 (two rows of eight, the Launchkey's layout) or 4 (a 4 × 4 grid: 1–4, 5–8, 9–12, 13–16). */
  columns?: 4 | 8;
  /** The pad bank names, one tab each, in order ("Sections", "Quick Racks", "Chord", "Multi Pads", "Setup"). */
  banks?: string[];
  /** The chosen bank's index in `banks`. */
  bank?: number;
  /** Each bank tab's tooltip key, by index. Default: by the bank's name (padpage.racks, padpage.chord, …). */
  bankTips?: string[];
  /** The bank's name: the one tab shown when `banks` is missing or empty. */
  bankName?: string;
  /** The flash phase of armed and queued pads. */
  lit?: boolean;
  /** The app's tooltip hook, passed to every pad and to the bank tabs. */
  tipAction?: TipAction;
  /** A bank tab was chosen (its index in `banks`), by click or arrow key. */
  onBank?: (index: number) => void;
  /** A pad was pressed (0–15). Not for an empty pad. */
  onPress?: (index: number) => void;
}

/**
 * PadBank: the Stage's Pads region. The bank tabs, and the sixteen Launchkey pads of the chosen
 * bank: Sections, Quick Racks, Chord, Multi Pads or Setup.
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
 * ink with a 2px underline. *Clutter*: the "Pads" title is gone, since the bank tabs name the
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
 * hangs under the tabs, centred across, and spare height goes below it. *Rhythm*: at least `--space-2` between pads, up to
 * `--space-3` when the region is wide, so sixteen keys read as sixteen, not as one slab. With no
 * height given, the room's height follows its width; the same bank also works as a 4 × 4 block.
 *
 * **Kept.** Holds no state: the bank comes in `bank` and the flash phase in `lit`; a tab choice
 * and a press go out by index. A region named "Pads"; the header's one tab style (ChosenTabs, a tablist with arrow keys),
 * the `bankName` fallback tab, `bankTips`, the 8 / 4 `columns`, each pad's face from the Pad
 * primitive (a waiting pad's ARMED / NEXT chip and the room it keeps above the label are the Pad's
 * own; the bank sets only the inset), and the spoken names ("Rack 1 (pad 1)", "Pad 12: empty").
 */
export function PadBank({
  pads,
  columns = 8,
  banks = [],
  bank = 0,
  bankTips = [],
  bankName = '',
  lit = true,
  tipAction,
  onBank,
  onPress,
}: PadBankProps) {
  const names = banks.length > 0 ? banks : [bankName];
  const tabs: TabItem[] = names.map((label, i) => ({ id: String(i), label, tip: bankTips[i] ?? BANK_TIP[label] }));
  const chosen = String(banks.length > 0 ? bank : 0);
  const cells = Array.from({ length: PAD_SLOTS }, (_, i) => pads[i] ?? EMPTY);
  const armed = cells.filter((pad) => !pad.empty && pad.state === 'armed').length;

  return (
    <section className="yh-padbank" aria-label="Pads" lang="en" data-armed={armed > ARMED_CHIPS ? 'many' : undefined}>
      <GroupHeader>
        <ChosenTabs
          size="header"
          look="underline"
          label="Pad bank"
          tabs={tabs}
          chosen={chosen}
          tipAction={tipAction}
          onChoose={(id) => onBank?.(Number(id))}
        />
      </GroupHeader>
      <div className="yh-padbank__room" data-columns={columns}>
        <div className="yh-padbank__pads" data-columns={columns}>
          {cells.map((pad, i) => (
            <div key={i} className="yh-padbank__cell" data-empty={pad.empty || undefined}>
              {pad.empty ? (
                <span className="yh-padbank__empty" role="img" aria-label={pad.name ?? `Pad ${i + 1}: empty`} />
              ) : (
                <Pad
                  label={pad.label}
                  index={String(i + 1)}
                  family={pad.family}
                  state={pad.state}
                  lit={lit}
                  name={pad.name}
                  tip={pad.tip}
                  tipAction={tipAction}
                  transport={pad.transport}
                  fillCell
                  onFace={bankOnFace(pad.family)}
                  onPress={() => onPress?.(i)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PadBank;

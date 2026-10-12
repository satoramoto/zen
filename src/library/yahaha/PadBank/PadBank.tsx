import { useId } from 'react';
import { ChosenTabs, type TabItem } from '../ChosenTabs/ChosenTabs';
import { GroupHeader } from '../GroupHeader/GroupHeader';
import { Pad, type PadFamily, type PadState, type TipAction } from '../Pad/Pad';
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
  /** `util` (neutral), `start`, or a part (`r1`, `r2`, `r3`, `l`) for a pad the engine lights in that part's hue. */
  family: PadFamily;
  /** The face: `playing` is on / loaded / chosen, `dark` is absent or an empty slot, `armed` / `next` wait. */
  state: PadState;
  /** Nothing is assigned to this pad on this bank: drawn as a quiet mark, not a key, and not pressable. */
  empty?: boolean;
  /** The accessible name. Default: "{label} (pad {n})", or "Pad {n}: empty". */
  name?: string;
  /** The tooltip key. */
  tip?: string;
}

/** Each bank tab's tooltip key, by the bank's name. Sections stays so a list that still has it keeps its tip. */
const BANK_TIP: Record<string, string> = {
  Sections: 'padpage.sections',
  'Quick Racks': 'padpage.racks',
  Chord: 'padpage.chord',
  'Multi Pads': 'padpage.multi_pads',
  Setup: 'padpage.setup',
};

export interface PadBankProps {
  /** The sixteen pads, row by row. */
  pads: PadItem[];
  /** Pads a row: 8 (two rows of eight, the Launchkey's layout) or 4 (a 4 × 4 grid: 1–4, 5–8, 9–12, 13–16). */
  columns?: 4 | 8;
  /** The pad bank names, one tab each, in order ("Quick Racks", "Chord", "Multi Pads", "Setup"). */
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
 * PadBank: the Stage's Pads region. A "Pads" header with the bank tabs, and the sixteen Launchkey
 * pads of the chosen bank: Quick Racks, Chord, Multi Pads or Setup.
 *
 * **Job.** Say which bank the pads are on and, at a glance across sixteen keys, which ones are on
 * (the loaded rack, the playing Multi Pad, the chosen fingering), which wait (Store armed), which
 * slots are empty, and what each one does; take a press by index.
 *
 * **Changed.** *One place per job* (STAGE.md): the Sections bank and its transport pads have left
 * for the SongForm region, and with them the section hue legend, which has nothing left to key: no
 * pad here is a section. The bank list is data, so the Stage passes the four banks (or any list),
 * and each tab finds its tooltip by name, not position, so dropping a bank can't shift the tips.
 * *Colour meaning* (`hues.ts`; `color.md`, "state changes: structure, not circus"): the four banks
 * are functions, not parts, so their pads are neutral: on is the one `--selected` fill, waiting is
 * the Pad's ring and chip, and a part hue appears only on a pad the engine lights for that part.
 * *Clutter and hierarchy*: a pad with nothing assigned (the Chord bank's top row, Setup's spare
 * pads) is no longer a dashed key labelled "—" that looks pressable; it is a quiet dot in its place,
 * out of the tab order, so the assigned pads read as the bank and its rows keep their hardware
 * positions. A dark pad is kept for what exists but is empty or absent (a Quick Rack slot with
 * nothing stored), since a press there still means something. *Fit*: the bank fills its region and
 * the pads fill their grid cells, stretching to the region's height when it has one, so the same
 * bank works as two rows of eight or a 4 × 4 block at a 1440 × 900 and a 1217 × 752 Stage.
 *
 * **Kept.** Holds no state: the bank comes in `bank` and the flash phase in `lit`; a tab choice
 * and a press go out by index. The header's one tab style (ChosenTabs, a tablist with arrow keys),
 * the `bankName` fallback tab, `bankTips`, the 8 / 4 `columns`, each pad's face from the Pad
 * primitive (a waiting pad's ARMED / NEXT chip and the room it keeps above the label are the Pad's
 * own; the bank sets only the inset), and the spoken names ("Rack 1 (pad 1)").
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
  const headingId = useId();
  const names = banks.length > 0 ? banks : [bankName];
  const tabs: TabItem[] = names.map((label, i) => ({ id: String(i), label, tip: bankTips[i] ?? BANK_TIP[label] }));
  const chosen = String(banks.length > 0 ? bank : 0);

  return (
    <section className="yh-padbank" aria-labelledby={headingId} lang="en">
      <GroupHeader title="Pads" id={headingId}>
        <ChosenTabs
          size="header"
          label="Pad bank"
          tabs={tabs}
          chosen={chosen}
          tipAction={tipAction}
          onChoose={(id) => onBank?.(Number(id))}
        />
      </GroupHeader>
      <div className="yh-padbank__pads" data-columns={columns}>
        {pads.map((pad, i) => (
          <div key={i} className="yh-padbank__cell" data-empty={pad.empty || undefined}>
            {pad.empty ? (
              <span className="yh-padbank__empty" role="img" aria-label={pad.name ?? `Pad ${i + 1}: empty`}>
                <span className="yh-padbank__dot" aria-hidden="true" />
              </span>
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
                fillCell
                onPress={() => onPress?.(i)}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default PadBank;

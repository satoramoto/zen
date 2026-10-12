import { ChosenTabs, type TabItem } from '../ChosenTabs/ChosenTabs';
import { GroupHeader } from '../GroupHeader/GroupHeader';
import { Knob, type TipAction } from '../Knob/Knob';
import { BOX, START, SWEEP, arc } from '../Knob/geometry';
import { PART_HUE_INDEX, type Part } from '../hues';
import './KnobBank.css';

export type { TipAction };

/** One of the eight band knobs. */
export interface KnobItem {
  /** The plain name ("Dynamics"); "---" when unused. */
  label: string;
  /** The Genos code ("DynCtrl"). */
  code: string;
  /** The value as shown ("127", "1/8", "Off", "0"). */
  value: string;
  /** A small unit after the value ("%"). */
  unit?: string;
  /** How far round the arc is, 0–1. */
  fraction: number;
  /** Nothing mapped. */
  unused?: boolean;
  /** The keyboard part this knob sets (Right 1's reverb send, Left's pan): its arc wears that part's hue. */
  part?: Part;
}

/** The Launchkey's knob count: the bank always draws this many slots. */
export const KNOB_SLOTS = 8;

/** A slot with nothing given for it. */
const UNUSED: KnobItem = { label: '', code: '', value: '', fraction: 0, unused: true };

/** The whole ring's track, as the Knob draws it. */
const TRACK = arc(START, START + SWEEP);

export interface KnobBankProps {
  /** The eight knobs, left to right. Fewer: the rest are unused slots; more: those past eight are ignored. */
  knobs: KnobItem[];
  /** The knob page names, one tab each ("Style", "Rack", "Pan", "Reverb", "Chorus", "Delay"). */
  pages?: string[];
  /** The chosen page's index in `pages`. */
  page?: number;
  /** The knob page's name ("Style", "Swap R1"): the one tab shown when `pages` is missing or empty. */
  pageLabel?: string;
  /** The app's tooltip hook, passed to every knob and to the page tabs. */
  tipAction?: TipAction;
  /** A page tab was chosen (its index in `pages`), by click or arrow key. */
  onPage?: (index: number) => void;
  /** A knob was clicked, or Space / Enter on it (its position, 0–7). Not for an unused knob. */
  onPress?: (index: number) => void;
  /** A knob asked for steps (its position, then +n clockwise or −n). Not for an unused knob. */
  onStep?: (index: number, delta: number) => void;
}

/** The spoken name of the knob at `index`, as the original's. */
export function knobName(knob: KnobItem, index: number): string {
  const what = knob.unused ? 'unused' : `${knob.label}${knob.code ? ` (${knob.code})` : ''} ${knob.value}${knob.unit ?? ''}`;
  return `Knob ${index + 1}: ${what}`;
}

/**
 * KnobBank: the Stage's Knobs region. The knob page tabs, and the eight Launchkey knobs across
 * the region, each in the slot of the hardware knob it mirrors.
 *
 * **Job.** Say what the eight knobs do on this page and where each one is, mid-song, from a metre
 * away: the page first (which of six maps the hardware is on), then each value, then each name.
 * A turn or a press on a knob is a callback with the knob's position.
 *
 * **Changed.** *Hierarchy*: the value sits inside each ring at numeral weight with tabular
 * figures, scaled with the ring (2.75 control heights, the value up to `--size-heading`), so
 * "127", "1/8" and "Off" are the first thing read and keep their width as they change
 * (`typography.md`, tabular numbers). The chosen page is ink with a 2px underline, not a solid
 * fill: on the Stage a solid fill means "sounding or running" only (the 2026-10 Stage review), and
 * there is no counter to cross-check. *Clutter*: the "Knobs" title is gone, since the page tabs
 * name the region themselves (the region keeps "Knobs" as its accessible name), and so is the
 * Genos code under each ring: the plain name a player needs gets two balanced lines instead of an
 * ellipsis ("Dynami…"), and the code stays only in the spoken name.
 * *Colour meaning* (`hues.ts`, `color.md` on colour by purpose): a knob that sets one part's value
 * (the parts' volumes on Rack, their pan, their sends on the effect pages) wears that part's hue on
 * its arc, so it agrees with the mixer strip and keyboard zone of the same part; every other knob
 * (Dynamics, Swing, the effect settings and returns, Tempo) is drawn in ink, so hue still means
 * "part" and nothing else. *Mapping*: the Launchkey always has eight knobs, so the bank always
 * draws eight slots, whatever `knobs` holds (missing ones are unused, extras ignored), and each
 * screen position maps one to one to a hardware knob. An unmapped slot is drawn at a real knob's
 * size and place, as its full ring in a faint track (`--text-1` at 10%) with no arc, pointer,
 * value or name, so the slot is plainly there but holds nothing; it is not a control (out of the
 * tab order, not pressable) and keeps its spoken name, and being quieter than an "Off" knob's
 * track it never competes with the mapped ones (`color.md`, state changes: structure, not circus).
 * It is the bank's share of one empty-slot rule across the three banks: the control's full
 * footprint, no edge, no label, in that one faint wash (FaderBank's parked faders, PadBank's
 * empty pads). *Fit*: each slot is
 * a size container and the ring takes the slot's width up to the density's size, so eight knobs
 * fit the region of a 1217 × 752 Stage as well as a 1440 × 900 one without clipping, and the value
 * shrinks with the ring rather than overflowing it. *Alignment*: the bank fills its region instead
 * of a fixed band width, and the slots are an even eight-column grid on the library's spacing.
 *
 * **Kept.** Holds no state: the page comes in `page`, a tab choice goes out by index, and every
 * knob change carries the knob's position. A region named "Knobs"; the header's one tab style
 * (ChosenTabs, a tablist with arrow keys), the `pageLabel` fallback tab, the tooltip keys (`knobs.page`, `knobs.knob`), each
 * knob's drag, wheel, keys and press, and the spoken names ("Knob 1: Dynamics (DynCtrl) 127",
 * "Knob 7: unused").
 */
export function KnobBank({ knobs, pages = [], page = 0, pageLabel = '', tipAction, onPage, onPress, onStep }: KnobBankProps) {
  const names = pages.length > 0 ? pages : [pageLabel];
  const tabs: TabItem[] = names.map((label, i) => ({ id: String(i), label, tip: 'knobs.page' }));
  const chosen = String(pages.length > 0 ? page : 0);
  const slots = Array.from({ length: KNOB_SLOTS }, (_, i) => knobs[i] ?? UNUSED);

  return (
    <section className="yh-knobbank" aria-label="Knobs" lang="en">
      <GroupHeader>
        <ChosenTabs
          size="header"
          look="underline"
          label="Knob page"
          tabs={tabs}
          chosen={chosen}
          tipAction={tipAction}
          onChoose={(id) => onPage?.(Number(id))}
        />
      </GroupHeader>
      <div className="yh-knobbank__knobs">
        {slots.map((knob, i) => (
          <div key={i} className="yh-knobbank__slot" data-unused={knob.unused || undefined}>
            {knob.unused ? (
              <span className="yh-knobbank__empty" role="img" aria-label={knobName(knob, i)} data-tip="knobs.knob">
                <span className="yh-knobbank__line" aria-hidden="true" />
                <svg className="yh-knobbank__ring" viewBox={`0 0 ${BOX} ${BOX}`} aria-hidden="true">
                  <path d={TRACK} />
                </svg>
              </span>
            ) : (
              <Knob
                label={knob.label}
                // The Genos code stays in the spoken name (knobName) but is not drawn on the Stage.
                code=""
                value={knob.value}
                unit={knob.unit}
                fraction={knob.fraction}
                hue={knob.part ? PART_HUE_INDEX[knob.part] : undefined}
                name={knobName(knob, i)}
                tip="knobs.knob"
                tipAction={tipAction}
                onpress={() => onPress?.(i)}
                onstep={(delta) => onStep?.(i, delta)}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default KnobBank;

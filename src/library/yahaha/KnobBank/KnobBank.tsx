import { useId } from 'react';
import { ChosenTabs, type TabItem } from '../ChosenTabs/ChosenTabs';
import { GroupHeader } from '../GroupHeader/GroupHeader';
import { Knob, type TipAction } from '../Knob/Knob';
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

export interface KnobBankProps {
  /** The eight knobs, left to right. */
  knobs: KnobItem[];
  /** The knob page names, one tab each ("Style", "Rack", "Pan", "Reverb", "Chorus", "Delay"). */
  pages?: string[];
  /** The chosen page's index in `pages`. */
  page?: number;
  /** The knob page's name ("Style", "Swap R1"): the one tab shown when `pages` is missing or empty. */
  pageLabel?: string;
  /** The app's tooltip hook, passed to every knob. */
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
 * KnobBank: the Stage's Knobs region. A "Knobs" header with the knob page tabs, and the eight
 * Launchkey knobs across the region, each in the slot of the hardware knob it mirrors.
 *
 * **Job.** Say what the eight knobs do on this page and where each one is, mid-song, from a metre
 * away: the page first (which of six maps the hardware is on), then each value, then each name.
 * A turn or a press on a knob is a callback with the knob's position.
 *
 * **Changed.** *Hierarchy*: the value sits inside each ring at numeral weight with tabular
 * figures, scaled with the ring, so "127", "1/8" and "Off" are the first thing read and keep their
 * width as they change (`typography.md`, tabular numbers); the page is the one `--selected` tab
 * in the header, so there is a single loud "where am I" mark and no counter to cross-check.
 * *Colour meaning* (`hues.ts`, `color.md` on colour by purpose): a knob that sets one part's value
 * (the parts' volumes on Rack, their pan, their sends on the effect pages) wears that part's hue on
 * its arc, so it agrees with the mixer strip and keyboard zone of the same part; every other knob
 * (Dynamics, Swing, the effect settings and returns, Tempo) is drawn in ink, so hue still means
 * "part" and nothing else. *Clutter*: an unmapped slot is no longer a dim knob with "---" and an
 * empty ring; it is a quiet dot in its place, out of the tab order, so the mapped knobs read as a
 * group and the slot still counts as one of eight (the hardware's positions). *Fit*: each slot is
 * a size container and the ring takes the slot's width up to the density's size, so eight knobs
 * fit the region of a 1217 × 752 Stage as well as a 1440 × 900 one without clipping, and the value
 * shrinks with the ring rather than overflowing it. *Alignment*: the bank fills its region instead
 * of a fixed band width, and the slots are an even eight-column grid on the library's spacing.
 *
 * **Kept.** Holds no state: the page comes in `page`, a tab choice goes out by index, and every
 * knob change carries the knob's position. The header's one tab style (ChosenTabs, a tablist with
 * arrow keys), the `pageLabel` fallback tab, the tooltip keys (`knobs.page`, `knobs.knob`), each
 * knob's drag, wheel, keys and press, and the spoken names ("Knob 1: Dynamics (DynCtrl) 127",
 * "Knob 7: unused").
 */
export function KnobBank({ knobs, pages = [], page = 0, pageLabel = '', tipAction, onPage, onPress, onStep }: KnobBankProps) {
  const headingId = useId();
  const names = pages.length > 0 ? pages : [pageLabel];
  const tabs: TabItem[] = names.map((label, i) => ({ id: String(i), label, tip: 'knobs.page' }));
  const chosen = String(pages.length > 0 ? page : 0);

  return (
    <section className="yh-knobbank" aria-labelledby={headingId}>
      <GroupHeader title="Knobs" id={headingId}>
        <ChosenTabs size="header" label="Knob page" tabs={tabs} chosen={chosen} onChoose={(id) => onPage?.(Number(id))} />
      </GroupHeader>
      <div className="yh-knobbank__knobs">
        {knobs.map((knob, i) => (
          <div key={i} className="yh-knobbank__slot" data-unused={knob.unused || undefined}>
            {knob.unused ? (
              <span className="yh-knobbank__empty" role="img" aria-label={knobName(knob, i)} data-tip="knobs.knob">
                <span className="yh-knobbank__dot" aria-hidden="true" />
              </span>
            ) : (
              <Knob
                label={knob.label}
                code={knob.code}
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

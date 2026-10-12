import { Region } from '../../layout/Region';
import { Knob, type TipAction } from '../../components/music/Knob/Knob';
import { BOX, START, SWEEP, arc } from '../../components/music/Knob/geometry';
import { PART_HUE_INDEX, type Part } from '../hues';
import { lengthMax, lengthSum, useForm, type Forms, type Length } from '../../layout/assembly';
import type { Step } from '../../primitives/step';
import './KnobBank.css';

export type { TipAction };

/* ---------- forms (docs/assembly.md): what the bank needs, in scale units ---------- */

/** The bank's forms: `labelled` (names whole, the full ring), then `compact` (names may break, ring down to a target). */
export type KnobBankForm = 'labelled' | 'compact';

/** The Genos knob pages, the Knobs region's tabs: their names size the head (see `TABS_W`). */
export const KNOB_PAGE_NAMES = ['Style', 'Rack', 'Pan', 'Reverb', 'Chorus', 'Delay'] as const;

const steps = (step: Step, n: number): Step[] => Array<Step>(n).fill(step);

/** The name block: two caption lines (Knob.css's `calc(var(--size-caption) * 2.6)`). */
const NAME_H: Length = { lines: { caption: 2 } };

/**
 * The page tabs in the region's head, at their widest material (hardware: 3px track padding, 2px
 * between tabs, `--space-3` either side of each label; linear is within a px of it). Every
 * material's head inset matches its plate inset across, so the tabs' width is also what the
 * body must be at least, or a tab label is cut to an ellipsis. Folded into each form's min width.
 */
const TABS_W: Length = {
  chars: { label: KNOB_PAGE_NAMES.join('').length },
  space: steps(3, KNOB_PAGE_NAMES.length * 2),
  px: (KNOB_PAGE_NAMES.length - 1) * 2 + 2 * 3,
};

/** Eight slots across with `--space-1` between them. */
const row = (slot: Length): Length => lengthSum(slot, slot, slot, slot, slot, slot, slot, slot, { space: steps(1, 7) });

/**
 * One slot's width: the wider of its name's longest line and the knob (its ring plus `--space-1`
 * either side). The name budgets are bold capitals in the widest face (Helvetica, elektron):
 * labelled keeps every word whole, so the longest ("Metronome") must fit; compact lets a word
 * break, so seven characters a line, which still keeps every two-word name on two lines.
 */
const slot = (nameChars: number, ring: Length): Length =>
  lengthMax({ chars: { caption: nameChars } }, lengthSum(ring, { space: [1, 1] }));

/**
 * `labelled`: the knob's padding `--space-1` all round, the name, `--space-1`, the ring (1.5
 * targets at least, 2.75 control heights as designed, up to 3.5 when the box has room both ways).
 * `compact`: no padding top or bottom, the name, `--space-1`, the ring (one target at least, two
 * control heights ideally, up to 2.75).
 */
export const KNOB_BANK_FORMS: Forms<KnobBankForm> = [
  {
    id: 'labelled',
    min: {
      w: lengthMax(TABS_W, row(slot(11, { target: 1.5 }))),
      h: lengthSum({ space: [1, 1, 1] }, NAME_H, { target: 1.5 }),
    },
    ideal: {
      w: lengthMax(TABS_W, row(slot(11, { control: 2.75 }))),
      h: lengthSum({ space: [1, 1, 1] }, NAME_H, { control: 2.75 }),
    },
    grow: { w: true, h: true },
    max: { h: lengthSum({ space: [1, 1, 1] }, NAME_H, { control: 3.5 }) },
  },
  {
    id: 'compact',
    min: {
      w: lengthMax(TABS_W, row(slot(7, { target: 1 }))),
      h: lengthSum({ space: 1 }, NAME_H, { target: 1 }),
    },
    ideal: {
      w: lengthMax(TABS_W, row(slot(7, { control: 2 }))),
      h: lengthSum({ space: 1 }, NAME_H, { control: 2 }),
    },
    grow: { w: true, h: true },
    max: { h: lengthSum({ space: 1 }, NAME_H, { control: 2.75 }) },
  },
];

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
  /** The knob page names, one view of the Knobs region each ("Style", "Rack", "Pan", "Reverb", "Chorus", "Delay"). */
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
  /** The form to draw (`KNOB_BANK_FORMS`); wins over the one an assembled screen chose. Default: the screen's, else `labelled`. */
  form?: KnobBankForm;
}

/** The spoken name of the knob at `index`, as the original's. */
export function knobName(knob: KnobItem, index: number): string {
  const what = knob.unused ? 'unused' : `${knob.label}${knob.code ? ` (${knob.code})` : ''} ${knob.value}${knob.unit ?? ''}`;
  return `Knob ${index + 1}: ${what}`;
}

/**
 * KnobBank: the body of the Stage's Knobs region: the eight Launchkey knobs of the chosen page
 * across the region, each in the slot of the hardware knob it mirrors. The pages are the
 * region's views (`KnobBankRegion`), so the bank draws no tab row of its own.
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
 * *Materials*: the bank paints no panel of its own; it sits inside a screen's `Region`, which the
 * theme's `plate` material draws, and each knob wears its own materials (Knob); parts are named with `data-part` (root, knobs, slot, empty).
 *
 * **Kept.** Holds no state: the page comes in `page`, a tab choice goes out by index, and every
 * knob change carries the knob's position. A region named "Knobs" (now the screen's `Region`,
 * whose tabs are the library `Tabs`), the `pageLabel` fallback tab, the tooltip keys (`knobs.page`, `knobs.knob`), each
 * knob's drag, wheel, keys and press, and the spoken names ("Knob 1: Dynamics (DynCtrl) 127",
 * "Knob 7: unused").
 *
 * **Forms** (`KNOB_BANK_FORMS`, `KnobBank.forms`; read with `useForm`, so a `form` prop wins over
 * the assembled screen's choice). Both keep all eight slots, every name and value, presses and
 * steps; only the bank's own shape changes (`data-form` on the root).
 * - `labelled`: each name whole on up to two caption lines (a slot is at least eleven caption
 *   characters wide), the knob's `--space-1` padding all round, the ring 1.5 targets at least,
 *   2.75 control heights as designed, and up to 3.5 when the box has room on both axes.
 * - `compact`: a long word may break across the two lines (seven caption characters a slot), no
 *   padding above or below the knob, the ring down to one target (the larger of a control height
 *   and the pack's `minTarget`), two control heights ideally.
 * Both grow on w and h: the ring takes what it can of the extra (up to its cap), and the rest of
 * the height is split above and below the row, which stays centred. Every form's min width
 * includes the six page tabs in the region's head, which are wider than the compact knob row
 * would otherwise need.
 *
 * **Tuning knobs.**
 * - `--yh-knob-ring`: the Knob's ring side, which the bank sets per slot from the slot's width,
 *   the bank's height and the form's cap; an empty slot's ring follows it too.
 * - `--yh-knobbank-h`: the bank's own height when nothing gives it one (the form's ideal); in a
 *   box with a height the bank grows or shrinks to fill it.
 */
export function KnobBank({ knobs, tipAction, onPress, onStep, form: given }: KnobBankProps) {
  const form = useForm(KNOB_BANK_FORMS, given);
  const slots = Array.from({ length: KNOB_SLOTS }, (_, i) => knobs[i] ?? UNUSED);

  return (
    <div className="yh-knobbank" data-part="root" data-form={form} lang="en">
      <div className="yh-knobbank__knobs" data-part="knobs">
        {slots.map((knob, i) => (
          <div key={i} className="yh-knobbank__slot" data-part="slot" data-unused={knob.unused || undefined}>
            {knob.unused ? (
              <span
                className="yh-knobbank__empty"
                data-part="empty"
                role="img"
                aria-label={knobName(knob, i)}
                data-tip="knobs.knob"
              >
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
    </div>
  );
}
KnobBank.forms = KNOB_BANK_FORMS;

export interface KnobBankRegionProps extends KnobBankProps {
  /** The region's name. Default "Knobs". */
  name?: string;
  /** The grid area the region fills in its screen. */
  area?: string;
  className?: string;
}

/**
 * The knobs as a screen region: a library `Region` whose views are the knob pages (or the one
 * `pageLabel` view), and the KnobBank for the chosen page as its body. The page stays the
 * caller's (`page`, `onPage`, by index). `form` goes to the bank; without it the bank reads the
 * form an assembled screen chose for this region. The region fills the box it is given and the
 * bank fills its body; with no height given, the bank is its form's ideal height.
 */
export function KnobBankRegion({ name = 'Knobs', area, className, ...bank }: KnobBankRegionProps) {
  const { pages = [], page = 0, pageLabel = '' } = bank;
  const names = pages.length > 0 ? pages : [pageLabel];
  const body = <KnobBank {...bank} />;
  return (
    <Region
      name={name}
      area={area}
      className={className}
      // The region fills its box and the bank its body: the bank sets its own height when the box
      // has none (`--yh-knobbank-h`), so an `auto` or `min-content` row still can't squeeze it.
      view={String(pages.length > 0 ? page : 0)}
      onView={(id) => bank.onPage?.(Number(id))}
      tipAction={bank.tipAction}
    >
      {names.map((label, i) => (
        <Region.View key={i} id={String(i)} label={label} tip="knobs.page">
          {body}
        </Region.View>
      ))}
    </Region>
  );
}

export default KnobBank;

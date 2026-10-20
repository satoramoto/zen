import { Region } from '../../layout/Region';
import { Knob } from '../../components/music/Knob/Knob';
import { useForm } from '../../layout/assembly';
import {
  KNOB_BANK_FORMS,
  knobBankRegionView,
  knobBankView,
  type KnobBankProps,
  type KnobBankRegionModelProps,
} from './KnobBank.model';
import './KnobBank.css';

export {
  KNOB_BANK_FORMS,
  KNOB_PAGE_NAMES,
  KNOB_SLOTS,
  knobName,
  knobBankView,
  knobBankRegionView,
  type KnobBankForm,
  type KnobItem,
  type KnobBankProps,
  type KnobBankRegionModelProps,
  type TipAction,
} from './KnobBank.model';

/**
 * KnobBank: the body of the Stage's Knobs region: the eight Launchkey knobs of the chosen page
 * across the region, each in the slot of the hardware knob it mirrors. The pages are the
 * region's views (`KnobBankRegion`), so the bank draws no tab row of its own. Its decisions are
 * `knobBankView` (KnobBank.model.ts, shared with KnobBank.svelte).
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
  const view = knobBankView({ knobs }, form);

  return (
    <div className={view.root.className} {...view.root.attrs}>
      <div className={view.knobs.className} {...view.knobs.attrs}>
        {view.slots.map((slot) => (
          <div key={slot.index} className={slot.className} {...slot.attrs}>
            {slot.empty ? (
              <span className={slot.empty.className} {...slot.empty.attrs}>
                <span className={slot.empty.line.className} {...slot.empty.line.attrs} />
                <svg className={slot.empty.ring.className} viewBox={slot.empty.ring.viewBox} aria-hidden="true">
                  <path d={slot.empty.ring.d} />
                </svg>
              </span>
            ) : slot.knob ? (
              <Knob
                {...slot.knob}
                tipAction={tipAction}
                onpress={() => onPress?.(slot.index)}
                onstep={(delta) => onStep?.(slot.index, delta)}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
KnobBank.forms = KNOB_BANK_FORMS;

export interface KnobBankRegionProps extends KnobBankRegionModelProps {
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
  const { views, view } = knobBankRegionView(bank);
  const body = <KnobBank {...bank} />;
  return (
    <Region
      name={name}
      area={area}
      className={className}
      // The region fills its box and the bank its body: the bank sets its own height when the box
      // has none (`--yh-knobbank-h`), so an `auto` or `min-content` row still can't squeeze it.
      view={view}
      onView={(id) => bank.onPage?.(Number(id))}
      tipAction={bank.tipAction}
    >
      {views.map((v) => (
        <Region.View key={v.id} id={v.id} label={v.label} tip={v.tip}>
          {body}
        </Region.View>
      ))}
    </Region>
  );
}

export default KnobBank;

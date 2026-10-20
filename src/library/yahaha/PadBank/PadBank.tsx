import { Region } from '../../layout/Region';
import { Pad } from '../../components/music/Pad/Pad';
import { useChosenForm, useForm } from '../../layout/assembly/forms';
import { PAD_BANK_FORMS, padBankRegionView, padBankView, type PadBankProps, type PadBankRegionProps } from './PadBank.model';
import './PadBank.css';

export {
  ARMED_CHIPS,
  PAD_BANK_FORMS,
  PAD_GAP,
  PAD_IDEAL_SIDE,
  PAD_MIN_SIDE,
  PAD_SLOTS,
  PAD_SMALL_IDEAL_SIDE,
  PAD_SMALL_SIDE,
  bankOnFace,
  padBankRegionView,
  padBankView,
} from './PadBank.model';
export type { BankPadFamily, PadBankForm, PadBankProps, PadBankRegionProps, PadItem, TipAction } from './PadBank.model';

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
 *
 * Renders `padBankView` (PadBank.model.ts); `PadBank.svelte` draws the same.
 */
export function PadBank(props: PadBankProps) {
  const form = useForm(PAD_BANK_FORMS, props.form);
  const chosen = useChosenForm();
  const view = padBankView(props, form, chosen);
  const { tipAction, onPress } = props;

  return (
    <div className={view.root.className} {...view.root.attrs}>
      <div className={view.room.className} {...view.room.attrs}>
        <div className={view.grid.className} {...view.grid.attrs}>
          {view.cells.map((cell) => (
            <div key={cell.index} className={cell.className} {...cell.attrs}>
              {cell.empty ? (
                <span className={cell.empty.className} {...cell.empty.attrs} />
              ) : (
                <Pad {...cell.pad!} tipAction={tipAction} onPress={() => onPress?.(cell.index)} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
PadBank.forms = PAD_BANK_FORMS;

/**
 * The pads as a screen region: a library `Region` whose views are the pad banks (or the one
 * `bankName` view), each tab with its tooltip key, and the PadBank for the chosen bank as its
 * body. The bank stays the caller's (`bank`, `onBank`, by index). `form` passes through to the
 * bank (or comes from the assembled screen); `PAD_BANK_FORMS` are the body's needs, so the
 * region's spec says `head: true` and the solver adds the tabs' row.
 */
export function PadBankRegion({ name = 'Pads', area, className, ...pads }: PadBankRegionProps) {
  const { views, view } = padBankRegionView(pads);
  const body = <PadBank {...pads} />;
  return (
    <Region
      name={name}
      area={area}
      className={className}
      view={view}
      onView={(id) => pads.onBank?.(Number(id))}
      tipAction={pads.tipAction}
    >
      {views.map((v) => (
        <Region.View key={v.id} id={v.id} label={v.label} tip={v.tip}>
          {body}
        </Region.View>
      ))}
    </Region>
  );
}

export default PadBank;

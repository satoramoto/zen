import type { ReactNode } from 'react';
import { useForm } from '../../layout/assembly';
import { Tree } from '../../view/Tree';
import type { Node } from '../../view/Tree.model';
import { withRegionViews } from '../regionViews';
import { FADER_BANK_FORMS } from './FaderBank.forms';
import {
  faderBankHandlers,
  faderBankRegionHandlers,
  faderBankRegionView,
  faderBankView,
  type FaderBankModelProps,
  type FaderBankRegionModelProps,
} from './FaderBank.model';
import '../../primitives/Stack.css';
import '../../primitives/Text.css';
import './FaderBank.css';

export { FADER_BANK_FORMS, type FaderBankForm } from './FaderBank.forms';
// The props and the tree are framework-free, in the model; this file and `FaderBank.svelte` only
// hand the model's tree to their `Tree`, with the form the assembled screen chose.
export type { TipAction, FaderStrip, BankLamp, FaderBankModelProps, FaderBankRegionModelProps } from './FaderBank.model';

/** FaderBank's props, with React tab labels (see `FaderBankModelProps`). */
export type FaderBankProps = FaderBankModelProps<ReactNode>;

/**
 * FaderBank: the Stage's mixer.
 *
 * **Job.** Show, from a metre away mid-song, how loud each of the four parts is, which are
 * sounding and which are off, what the Style, Multi Pad and Master faders are at, and whether a
 * hardware fader has to be moved through its level before it takes over again; and let a player
 * change any of it, switch the fader page (Panel, Style) and layer (Vol … Delay), and reach the
 * Launchkey's fader-button functions.
 *
 * **Changed.** *Colour meaning* (`hues.ts`, `color.md` §3): the four parts are the only hued
 * things in the bank, and each wears its hue three times in one column (fader fill, name,
 * On lamp) so the mixer agrees with the keyboard zones and sound row; Style, Multi Pad and Master
 * are neutral, and the function lamps light in neutral ink. *Grouping and hierarchy*
 * (`craft-details.md`, proximity): the strips fall into clusters with a hairline between them,
 * parts | Style and Multi Pad | Master, instead of nine equal columns; Master is set apart on its
 * own raised plate, a little wider, as the last word on loudness; the plate fills its column, so
 * its edge lines up with the bank's, and Master sits inset on it. *Mapping and one empty-slot
 * vocabulary*: the unused faders 7 and 8 are real strips in their hardware places, one to one as
 * KnobBank's eight knobs and PadBank's sixteen pads are, each the banks' one empty-slot face: a
 * faint wash (`--text-1` at 6%, `--radius-control`) over the strip's whole footprint, with no
 * groove, cap, value, name or edge and no hover or press give, exactly as an empty pad. A thin
 * groove there read as a stray hairline between Multi Pad and Master; a strip-wide wash reads as
 * a slot. They take three quarters of a live strip's width, so at a 1217 × 752 Stage the live
 * names and keys ("Multi Pad", "Off") keep the room they need whole. *Room to breathe*
 * (`craft-details.md`, proximity): a full step of air between the tab row and the strips, between
 * strips, around Master on its plate and above the Functions rule, so the clusters read as groups
 * by space as much as by hairline; no text got smaller for it. In a 1217 × 752 Stage's narrower
 * mixer the strips step back to the tighter gap, so "Multi Pad" keeps its name whole. *Numerals*: each level is the Fader's large
 * tabular numeral; under it the part's name in its hue and its sound in muted text, so a column
 * reads "72 · Right 2 · Silk Strings" top to bottom. The part's marks (edited, ⚠ missing, ✕
 * failed, "off") take their own line under the sound, so they never cut the sound's name; while
 * any strip has marks every strip keeps that line, so the faders end level. Each Fader fills its
 * strip's height (`fillHeight`). *Off reads as off*: the name fades in its
 * own hue with the word "off", the fader and meters dim, and the lamp below says Off unlit; three
 * cues, none of them colour alone. *Soft takeover* is a state, so it is `--warning`: the Fader
 * draws a dashed ghost cap where the hardware is with an arrow saying which way to move it, and
 * the strip is outlined, so the column itself says it twice in shape; the words ("Soft takeover
 * Right 2 move up to 72") are a status for assistive tech only, since a fourth visible cue at the
 * foot only repeated the column and was cut to "Soft take…" in narrow packs. *One key height*
 * (rhythm): the part On lamps, the page button under Master (like the Launchkey's master fader
 * button) and the four function lamps are all `cell` keys, so the region has one key height; the
 * function lamps keep their own row under a hairline, since they are not mixer controls, but lose
 * the "Functions" caption, which only named a row of keys that name themselves. Whether a lamp is
 * on is the LampButton's own face (outline in its hue and a lit LED; solid fills are kept for
 * what sounds or runs), so the fader fill stays the loudest "on" in the column. *Clutter*: the
 * "Faders" title and the "Layer" word are gone: the page tabs (Panel, Style) and the layer tabs
 * (Vol … Delay) name themselves. A non-Vol layer shows as its chosen tab and turns the
 * part strips to the neutral layer look, with the layer word over each number ("Rev 40").
 * *Tabs in the region* (2026-10, layout primitives): the bank draws no tab row of its own. Its
 * pages are the views of the screen's mixer `Region` and its layers the `Tabs` in that region's
 * `aside` (`FaderBankRegion` builds both); the bank renders the chosen page's strips.
 *
 * **Kept.** Holds no state: every change is a callback with the strip's or lamp's id. The
 * "Functions" group (a library `Group`) and the takeover status. Each
 * strip is a Fader (a vertical slider with keys, wheel and drag) over a name button that opens
 * the part's page; the parked faders stay disabled sliders named "Fader 7 unused". The part
 * lamps' long press (swap mode), the Sound and Looper holds, and the page button's tap to flip
 * and hold for the fader picker. Every accessible name and tooltip key of the original; tooltips
 * come only from `tipAction` (each control applies it once; the region's tabs carry their keys as
 * `data-tip`), never a native `title`, so no control shows two.
 *
 * **Headless** (2026-10): the bank paints no panel of its own (it sits inside a screen's
 * `Region`, on the theme's `plate` material); Master's plate (`data-part="plate"`) is that
 * material again, raised inside it, and each strip's look comes from the Fader's own materials, so a material set restyles the
 * mixer without touching it.
 *
 * **Forms** (2026-10, assembly): `tall → short` (`FADER_BANK_FORMS`, `FaderBank.forms`), read with
 * `useForm` (a `form` prop wins; `FaderBankRegion` passes it through) and carried as `data-form`.
 * They declare the body only, in scale units, and the CSS keeps to the same steps. `short` keeps
 * every strip, key and mark and takes every step tighter: the Fader's gap a `--space-1`, no foot
 * under its travel, no padding round the name, Master's plate inset a `--space-1`, a tighter
 * column, row and foot gap. Both fill the box they are given; the travel takes what is left. Each
 * strip track is at least its content (`minmax(min-content, …)`), and the sound line has no
 * inline size of its own (it ellipsizes to the strip), so the least width is the names' and keys'.
 *
 * **Model** (2026-10, Svelte bindings): what it draws is the tree `faderBankView` returns
 * (`FaderBank.model.ts`), drawn by React's and Svelte's `Tree`; the name button's tooltip is the
 * kernel's `tip` store.
 */
export function FaderBank(props: FaderBankProps) {
  const form = useForm(FADER_BANK_FORMS, props.form);
  return <Tree tree={faderBankView(props, form)} handlers={faderBankHandlers(props)} />;
}

export interface FaderBankRegionProps extends FaderBankRegionModelProps<ReactNode> {
  className?: string;
}

/**
 * The mixer as a screen region: a library `Region` whose views are the fader pages (Panel,
 * Style), with the layer `Tabs` (Vol … Delay) in its `aside`, and the FaderBank for the chosen
 * page as its body. The page and layer stay the caller's (`page`, `onChoosePage`, `layer`,
 * `onChooseLayer`), so the master fader button can flip the page too.
 */
export function FaderBankRegion({ className, ...props }: FaderBankRegionProps) {
  // The tree's root is a component node: React's `Tree` draws any child, but types `tree` as an element.
  return (
    <Tree tree={faderBankRegionView({ ...props, className }) as unknown as Node} handlers={faderBankRegionHandlers(props)} components={withRegionViews} />
  );
}

/** The forms, for a region to add up (`docs/assembly.md`). */
FaderBank.forms = FADER_BANK_FORMS;

export default FaderBank;

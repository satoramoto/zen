import type { ReactNode } from 'react';
import { Tree } from '../../view/Tree';
import { appBarHandlers, appBarView, type AppBarModelProps } from './AppBar.model';
import type { Forms } from '../../layout/assembly/types';
import '../../primitives/Text.css';
import '../../primitives/Stack.css';
import './AppBar.css';

/**
 * The bar's one form, for an assembled screen's header: one row, a control height between
 * `--space-2` above and the tabs' room below (AppBar.css's row). Full width; it never steps.
 */
export const APP_BAR_FORMS: Forms<'bar'> = [
  { id: 'bar', min: { w: 0, h: { control: 1, space: [2, 2] } }, ideal: { w: 0, h: { control: 1, space: [2, 2] } }, grow: { w: true } },
];

export type { HealthTarget } from '../HealthSlot/HealthSlot';
export type { TabItem } from '../../layout/Tabs';

// The props, the bar and its handlers are framework-free, in the model and the `focusReturn` store;
// this file and `AppBar.svelte` only hand the model's tree to their `Tree`, with `end` as a slot.
export type { AppBarModelProps } from './AppBar.model';

export interface AppBarProps extends AppBarModelProps<ReactNode> {
  /** Extra controls after the page nav, before the switches, behind a hairline of their own. */
  end?: ReactNode;
}

/**
 * AppBar: the bar on top of every page.
 *
 * **Job.** Say which page this is and go to another in one click; hold the few switches that act
 * on the whole instrument (Metronome and its settings, Unison, Help, Panic); and say, without
 * being asked, whether the Launchkey and the audio are fine. Mid-song a player only glances at it
 * for Panic or a failed sound; everything else must stay quiet.
 *
 * **Changed.** *One place per job:* the original split the bar's job across two rows, the page
 * nav up here and Metronome, Unison, Help and Panic at the end of the transport row; the global
 * switches now live here, so the transport row holds only transport. *Order and alignment:* the
 * page nav starts right after the name and keeps its x on every page; the style and tempo shown
 * off the Stage sit in the flexible middle and give way (ellipsis) before anything else does, so
 * the tabs never jump. The bar reads left to right as where you are → what you can switch → how
 * things are → the emergency stop. *Colour has one meaning* (`hues.ts`): the switches belong to no
 * part, so none wears a part hue; Unison is a neutral lamp, and the metronome, a control that moves
 * time, wears the contract's `transport` role hue only while it is on, like every transport key
 * (`hues.ts`): at rest it is a neutral lamp, so the bar holds no saturated colour while nothing is
 * running. Its ▾ stays neutral because it only opens settings. A solid fill means "sounding or
 * running" on the Stage, so the bar holds none: the chosen page is drawn by the layout `Tabs`, the
 * same mark (from the theme's materials) a chosen tab wears everywhere, and the lamps' on
 * face is the lamp's own (outline and lit LED). Launchkey uses `--success` only when connected,
 * and the health slot's calm mark is the same `StatusDot`, so the two connections say "fine" with
 * one mark; only Panic and trouble in the health slot wear `--danger`. *Affordance:* the ▾ is a
 * drawn chevron in `--text-2` on a `--control-h`-wide key, not a glyph smaller than the LED beside
 * it. *Rhythm:* the switches sit a `--space-3` apart while Metronome and its ▾ stay joined, so
 * the bar reads Metronome▾ | Unison | ?, not one run of four. *Affordance without noise:* Panic takes the far right
 * corner, the one place a hand finds without looking, set apart by a hairline; at rest it is an
 * outlined key with the danger outline and its label in primary text, and only a hover or press
 * fills it, so it is found at once and never shouts while nothing is wrong
 * (`references/color.md`, "State changes: structure, not circus"). The health slot has a fixed
 * width, so trouble appearing never moves Panic. The heavy 2px header rule is now the chrome's own
 * hairline, which the chosen tab stands on (`references/craft-details.md`, borders). *Rhythm:*
 * heights follow `--control-h` and gaps `--space-*`, so every density pack scales the bar as one.
 * The bar is a size container: as it narrows towards 1217 px the name steps aside, the gaps and
 * tab padding tighten and the Launchkey word gives way to its dot (its spoken name and title
 * stay); no control or label is ever dropped.
 *
 * **Kept.** Controlled throughout: `chosen` names the page and a click only calls `onChoose`;
 * every switch only asks for its next state. The two tab runs split by a hairline inside a "Pages"
 * nav (now two tablists, "Display pages" and "Full pages", with arrow keys), the Launchkey status with its spoken name,
 * the health slot and where it sends you, the metronome's ▾ with `aria-haspopup`,
 * `aria-expanded` and `aria-controls`, the popover's Esc and press-outside, every tooltip key,
 * `nowPlaying` off the Stage, the fixed `width` and the `end` slot.
 *
 * **Tuning knobs.** `--yh-appbar-gap` (the gap between the bar's groups, and inside the end,
 * connections and Panic groups; the bar's container queries tighten it), `--yh-appbar-inner` (the
 * gap between the global switches, a step wider than Metronome▾'s 0 join; tightened at the
 * narrowest widths).
 */
export function AppBar({ end, ...props }: AppBarProps) {
  return <Tree tree={appBarView(props, { end: end !== undefined })} slots={{ end }} handlers={appBarHandlers(props)} />;
}

export default AppBar;

import { useState, useSyncExternalStore } from 'react';
import { useChosenForm, useForm } from '../../layout/assembly/forms';
import { Tree } from '../../view/Tree';
import { DISPLAY_FORMS } from './Display.forms';
import { displayHandlers, displayView, type DisplayModelProps, type TipAction } from './Display.model';
import { wideState } from './wide';
import '../../primitives/Stack.css';
import '../../primitives/Text.css';
import './Display.css';

// The props and the tree are framework-free, in the model; this file and `Display.svelte` only
// read the assembled screen's form and the measured width, and hand the tree to their `Tree`.
export type { TipAction };
export { DISPLAY_FORMS, DISPLAY_CAPS, DISPLAY_GROWTH, DISPLAY_CHROME, DISPLAY_CONTENT, displayLengthCss, type DisplayForm } from './Display.forms';
export {
  AUTO_FULL_WIDTH,
  DISPLAY_SIZES,
  type DisplayDensity,
  type DisplayModelProps,
  type DisplayNowPlaying,
  type DisplayPart,
  type DisplayStyle,
} from './Display.model';

export type DisplayProps = DisplayModelProps;

/**
 * Display: the Stage's hero, what the band is doing right now.
 *
 * **Job.** Answer, from a metre away and mid-song, three questions in order: which section is
 * playing (and what comes next), which chord the band hears, and how fast. Then, quieter, which
 * style is loaded and its One Touch, and where the bar is. Every control the hero owns sits next
 * to what it changes: ‹ › and the name step and browse styles, One Touch applies, the tempo's
 * − + Tap and Style tempo set the tempo. This is the Stage's only Tap.
 *
 * **Changed.** *Hierarchy:* the original set chord, section and tempo in three competing hues in
 * three equal thirds. Here they share neutral ink and are ranked by size and place: the section
 * largest (up to three numeral sizes at `full`, 96 at numeral 32), the only thing on a solid fill,
 * the `--selected` block (a solid fill means "sounding", `hues.ts`); the tempo next (up to 2.625),
 * the loudest number; the chord a step behind (up to 2.25). Each starts at the pack's numeral size
 * and takes a share of the room past its form's least, on both axes, up to its own cap per form
 * (`DISPLAY_CAPS`, `DISPLAY_GROWTH`), so the ranking holds at every size and no box at least the
 * form's least is overflowed (typography.md, "Type Scale"). A long section name steps all three
 * down together (by tenths, to 0.6) until they fit the row, so the section is never cut, the
 * chord keeps its cell and the ranking holds.
 * *Hierarchy, one place per job:* what's next is said once, a "then" tab hanging flush under the
 * section block: `--text-1` on `--surface-2`, an arrow in the next role (`--accent`,
 * `SECTION_STATE_COLOUR.next`) and the next section's name at 35% of the section's size (never
 * below heading size, so about 34px under a 96px block rather than a 14px footnote), with when
 * ("fill after bar 4") under them at label size, so the tab is never wider than the block needs.
 * Where the bar is is drawn, not written: four beat cells under the tempo (the lit beat in
 * `--text-1`, beat 1 marked), where the old full-width beat bar made a 300px slab louder than the
 * chord; at `full` the cells are `--space-2` thick, enough to read from a metre. *Rhythm, room to
 * breathe:* the groups (header, readouts, the beat and the
 * tempo keys) stand a step further apart on the `--space-*` scale than the controls inside them,
 * so each reads as one group; spacing makes the room, never smaller or fainter text (color.md).
 * *Hierarchy, quiet chrome:* the "Section / Chord / Tempo" captions are gone (a block, a chord
 * symbol and a number with BPM name themselves), so that row goes to the readouts; the style
 * header and One Touch keep one control-height line above them, the applied One Touch underlined
 * rather than a second solid block, the style name without a chevron between ‹ and ›. Where the
 * header is short the genre · metre drops whole before the style's name would end in an ellipsis
 * (measured, like the section's fit). *Colour meaning:* sections take no hue; the tempo's ± keys
 * are neutral at rest (transport wears its hue only while active); the only hues left are the four
 * part dots, which mean the same part as the mixer and keyboard (color.md, "Semantic colours").
 * *Forms* (`DISPLAY_FORMS`, docs/assembly.md): `full` (the roomy chrome, the large caps),
 * `compact` (tight padding, a short rule, thinner beat cells, caps 1.875 / 1.625 / 1.375 numeral
 * sizes) and `minimal` (Tap and Style tempo move into the header beside One Touch, whose caption
 * goes; no rule; a hairline beat; caps 1.25 / 1.125 / 1). Each form's needs are in scale units,
 * from the same steps and Text roles as Display.css, and the hero never draws below its form's
 * least (`min-width`, `min-height`). Which form: the `form` prop wins; then the form the assembled
 * screen chose for the hero's region; then `density` (`auto`, the default, is compact below a
 * 1200 CSS pixel wide hero). The fingering keeps one line with an ellipsis past sixteen
 * characters; the notes stand over it. The parts (standalone only) are a fourth column from a
 * 900px hero, outside `minimal`; the forms leave them out.
 * *Affordance:* Tap is a real key, and the style's tempo, once a hidden double-click, is a visible
 * quiet "Style tempo" key beside it (the double-click still works). It says which tempo it goes
 * back to, so it is never mistaken for the transport's section reset; when the tempo already is
 * the style's (`styleTempo`), it takes the unavailable face (`--text-3`, `aria-disabled`, still
 * focusable), since there is nothing to reset.
 * *Materials:* every part is named (`data-part`), and the hero is the display window, made of the
 * theme's `screen` (`data-material="screen"`), so the readouts on it (tempo, chord, beat) drop
 * windows of their own; a part's dot is lit (`--lit` in its hue, `--mat-lit-glow`) unless the part
 * is off. The `--selected` block, the "then" tab and the part hues still say what they say,
 * whatever the material.
 *
 * **Kept.** The data and every callback of the original (prev/next/browse, One Touch, a part's
 * sound list, tempo up/down holds, drag/scroll/keys on the number, back to the style's tempo); the
 * button names ("Next style (Track right)", "Sunday Drive Pop: open the Browser", "Left sound: 33
 * Finger Bass…", "Apply One Touch 3…", "Tempo up (Scene Launch)", "Back to the style's tempo");
 * "Stopped" and "Sync Start armed" under the section; the beat's states; the chord stepping down
 * to fit; the sizes reaching each primitive through its own `size` option (and BarBeat's
 * `thickness`), never by overriding its CSS; the app's `tipAction` on every control, applied once
 * each (the primitives apply it to their own).
 *
 * **Tuning knobs.** `--yh-display-min-w`, `--yh-display-min-h` (the form's least, set inline
 * from `DISPLAY_FORMS`), `--yh-display-room-w`, `--yh-display-room-h` (the room past it),
 * `--yh-display-cap-*` (each readout's cap: section, tempo, chord; set per form),
 * `--yh-display-fit` (the row's fit step, from `data-fit`), `--yh-display-section`,
 * `--yh-display-tempo`, `--yh-display-chord` (the readouts' sizes, from the room, cap and fit;
 * `DISPLAY_SIZES` hands them to the primitives), `--yh-display-chord-w` (the chord column's
 * least), `--yh-display-beat-line` (the beat cells' thickness, per form), `--yh-display-then-hue`
 * (the "then" arrow's colour, the next role from `hues.ts`), `--yh-display-part-hue` (a part's
 * dot, its hue from `hues.ts`).
 */
export function Display(props: DisplayProps) {
  // The form: the `form` prop, then the assembled screen's choice, then `density` (auto: the width).
  const form = { fromScreen: useForm(DISPLAY_FORMS, props.form), chosen: useChosenForm() };
  const [wide] = useState(wideState);
  return <Tree tree={displayView(props, form, useSyncExternalStore(wide.subscribe, wide.get))} handlers={displayHandlers(props, wide)} />;
}

/** The forms, for a region to add up (`Display.forms`). */
Display.forms = DISPLAY_FORMS;

export default Display;

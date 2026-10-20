// The Stage's intent (docs/assembly.md, STAGE.md › Assembly): what it holds and what matters.
// No grid, no ratios, no sizes: each region's forms are its component's own, and `assemble()`
// decides forms, sizes and zoom under the pack's principles.
import type { Forms, RegionSpec, ScreenSpec } from '../../layout/assembly/types';
// Every form from a framework-free file, never a `.tsx`: Svelte reaches this spec too.
import { APP_BAR_FORMS } from '../AppBar/AppBar.model';
import { DISPLAY_FORMS } from '../Display/Display.forms';
import { FADER_BANK_FORMS } from '../FaderBank/FaderBank.forms';
import { KNOB_BANK_FORMS } from '../KnobBank/KnobBank.model';
import { PAD_BANK_FORMS } from '../PadBank/PadBank.model';
import { TRANSPORT_FORMS } from '../SongForm/SongForm.forms';
import { STATUS_LINE_FORMS } from '../StatusLine/StatusLine.model';

/**
 * The keyboard's one form: just the keys (`ruler={false}`, no zone readout above them), a strip
 * of 1.75 control heights (`--yh-keys-strip-h`), across whatever width it is given.
 */
export const KEYS_FORMS: Forms<'keys'> = [{ id: 'keys', min: { w: 0, h: { control: 1.75 } }, ideal: { w: 0, h: { control: 1.75 } }, grow: { w: true } }];

/** The fixed parts: the app bar on top; the keys, then the status line, at the foot. */
const header: RegionSpec[] = [{ id: 'bar', priority: 'chrome', plate: false, forms: APP_BAR_FORMS }];
const footer: RegionSpec[] = [
  { id: 'keys', priority: 'chrome', forms: KEYS_FORMS },
  { id: 'status', priority: 'chrome', plate: false, forms: STATUS_LINE_FORMS },
];

/**
 * The room round the body and the keys (the bar runs edge to edge): `--space-2`, the step the
 * 900 × 700 screen needs to keep the mixer beside two rows of pads above the zoom floor.
 */
const EDGE = { space: 2 } as const;

/**
 * Yahaha targets 16:9 (a stage monitor, a TV, a laptop in full screen): the screen is laid out
 * in the largest 16:9 room inside the window, centred, and the rest is ground (letterbox). So
 * one window shape is designed for, and a 16:10 laptop or an ultrawide adds bands, not layouts.
 */
const ASPECT = { ratio: 16 / 9, fit: 'contain' } as const;

const hero: RegionSpec = { id: 'hero', priority: 'now', forms: DISPLAY_FORMS };
const mixer: RegionSpec = { id: 'mixer', priority: 'controls', head: true, forms: FADER_BANK_FORMS };
const knobs: RegionSpec = { id: 'knobs', priority: 'controls', head: true, forms: KNOB_BANK_FORMS };
const pads: RegionSpec = { id: 'pads', priority: 'controls', head: true, forms: PAD_BANK_FORMS };

const transport: RegionSpec = { id: 'transport', priority: 'controls', forms: TRANSPORT_FORMS };
const controls = { id: 'controls', rows: [[knobs], [pads]] };

/**
 * Stacked (the default): what's playing with the transport beside it, so the tempo and Start /
 * Stop share a line; then the mixer beside the knobs over the pads. The sections are the Pads
 * region's Sections bank (its default view), so there is no song form strip. The hero and the
 * mixer are a pair: one column seam from the bar to the keys.
 */
export const STAGE_SPEC: ScreenSpec = {
  header,
  footer,
  rows: [
    [hero, transport],
    [mixer, controls],
  ],
  pairs: [['hero', 'mixer']],
  edge: EDGE,
  aspect: ASPECT,
};

/**
 * Split: the hero one band across the top; under it the mixer, the knobs over the pads, and the
 * transport down the right-hand side beside the pads, so Start / Stop sits by the Sections bank.
 * No pair: the hero has its row to itself, so there is no seam to keep.
 */
export const STAGE_SPLIT_SPEC: ScreenSpec = {
  header,
  footer,
  rows: [[hero], [mixer, controls, transport]],
  edge: EDGE,
  aspect: ASPECT,
};

/** The room the Stage is designed in: the 16:9 board. */
export const STAGE_DESIGN = { w: 1920, h: 1080 } as const;

/**
 * The two specs drawn scaled (`fit: 'scale'`): laid out once at the 1920 × 1080 board and drawn
 * smaller to the largest 16:9 box in the frame, so a story shows the whole board at any size.
 * The app uses `contain` (the specs above), where a smaller window steps forms down.
 */
export const STAGE_SCALED_SPEC: ScreenSpec = { ...STAGE_SPEC, aspect: { ratio: 16 / 9, fit: 'scale', design: STAGE_DESIGN } };
export const STAGE_SPLIT_SCALED_SPEC: ScreenSpec = { ...STAGE_SPLIT_SPEC, aspect: { ratio: 16 / 9, fit: 'scale', design: STAGE_DESIGN } };

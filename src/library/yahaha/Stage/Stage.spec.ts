// The Stage's intent (docs/assembly.md, STAGE.md › Assembly): what it holds and what matters.
// No grid, no ratios, no sizes: each region's forms are its component's own, and `assemble()`
// decides forms, sizes and zoom under the pack's principles.
import type { Forms, RegionSpec, ScreenSpec } from '../../layout/assembly/types';
import { APP_BAR_FORMS } from '../AppBar/AppBar';
import { DISPLAY_FORMS } from '../Display/Display.forms';
import { FADER_BANK_FORMS } from '../FaderBank/FaderBank.forms';
import { KNOB_BANK_FORMS } from '../KnobBank/KnobBank';
import { PAD_BANK_FORMS } from '../PadBank/PadBank';
import { FORM_FORMS, SONG_FORM_FORMS, TRANSPORT_FORMS } from '../SongForm/SongForm.forms';
import { STATUS_LINE_FORMS } from '../StatusLine/StatusLine';

/**
 * The keyboard's one form: Keys draws a ruler of one control height over a strip of 1.75 (its
 * `--yh-keys-ruler-h` and `--yh-keys-strip-h`), across whatever width it is given.
 */
export const KEYS_FORMS: Forms<'keys'> = [{ id: 'keys', min: { w: 0, h: { control: 2.75 } }, ideal: { w: 0, h: { control: 2.75 } }, grow: { w: true } }];

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

const hero: RegionSpec = { id: 'hero', priority: 'now', forms: DISPLAY_FORMS };
const mixer: RegionSpec = { id: 'mixer', priority: 'controls', head: true, forms: FADER_BANK_FORMS };
const knobs: RegionSpec = { id: 'knobs', priority: 'controls', head: true, forms: KNOB_BANK_FORMS };
const pads: RegionSpec = { id: 'pads', priority: 'controls', head: true, forms: PAD_BANK_FORMS };

/**
 * Stacked (the default): what's playing with the transport beside it, so the tempo and Start /
 * Stop share a line; the song form one strip across; then the mixer beside the knobs over the
 * pads. The hero and the mixer are a pair: one column seam from the bar to the keys.
 */
export const STAGE_SPEC: ScreenSpec = {
  header,
  footer,
  rows: [
    [hero, { id: 'transport', priority: 'controls', forms: TRANSPORT_FORMS }],
    [{ id: 'form', priority: 'next', forms: FORM_FORMS }],
    [mixer, { id: 'controls', rows: [[knobs], [pads]] }],
  ],
  pairs: [['hero', 'mixer']],
  edge: EDGE,
};

/** Split: the hero, and beside it the song form over the transport in one region (`Form.parts`). */
export const STAGE_SPLIT_SPEC: ScreenSpec = {
  header,
  footer,
  rows: [
    [hero, { id: 'form', priority: 'next', forms: SONG_FORM_FORMS }],
    [mixer, { id: 'controls', rows: [[knobs], [pads]] }],
  ],
  pairs: [['hero', 'mixer']],
  edge: EDGE,
};

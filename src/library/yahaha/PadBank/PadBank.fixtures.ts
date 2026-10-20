import { defineFixtures } from '../../fixtures';
import { PAD_BANK_FORMS, type PadBankRegionProps, type PadItem } from './PadBank.model';

// Ported from the baseline's `sectionPads` (yahaha/src/ui/PadBank/PadBank.fixtures.ts) and the
// Stage Playground's `stagePadBanks` (yahaha/src/ui/Stage/Stage.fixtures.ts). The baseline's "—"
// pads (nothing assigned) are `empty` here; its dark pads (an empty Quick Rack, a section absent
// from this style) stay `dark`.

const NB = ' ';
const util = (label: string, state: PadItem['state'] = 'idle'): PadItem => ({ label, family: 'util', state });
const empty = (): PadItem => ({ label: '', family: 'util', state: 'idle', empty: true });

/**
 * The board's Sections bank, as the Launchkey lays it out: Main B playing, Main C next, Start /
 * Stop running; Intro III and Ending III absent from this style. Sync Start, Auto Fill, Tap, Sync
 * Stop and Start / Stop are transport pads.
 */
export const sectionPads: PadItem[] = [
  { label: `Intro${NB}I`, family: 'intro', state: 'idle', tip: 'section.intro1' },
  { label: `Intro${NB}II`, family: 'intro', state: 'idle', tip: 'section.intro2' },
  { label: `Intro${NB}III`, family: 'intro', state: 'dark', tip: 'section.intro3', name: 'Intro III (not in this style)' },
  { label: 'Sync Start', family: 'util', state: 'idle', tip: 'transport.sync_start', transport: true },
  { label: `Ending${NB}I`, family: 'ending', state: 'idle', tip: 'section.ending1' },
  { label: `Ending${NB}II`, family: 'ending', state: 'idle', tip: 'section.ending2' },
  { label: `Ending${NB}III`, family: 'ending', state: 'dark', tip: 'section.ending3', name: 'Ending III (not in this style)' },
  { label: 'Auto Fill', family: 'util', state: 'idle', tip: 'transport.auto_fill', transport: true },
  { label: `Main${NB}A`, family: 'main', state: 'idle', tip: 'section.main_a' },
  { label: `Main${NB}B`, family: 'main', state: 'playing', tip: 'section.main_b', name: 'Main B, playing' },
  { label: `Main${NB}C`, family: 'main', state: 'next', tip: 'section.main_c', name: 'Main C, queued after bar 4 (flashing)' },
  { label: `Main${NB}D`, family: 'main', state: 'idle', tip: 'section.main_d' },
  { label: 'Break', family: 'brk', state: 'idle', tip: 'section.break' },
  { label: 'Tap', family: 'util', state: 'idle', tip: 'tempo.tap', transport: true },
  { label: 'Sync Stop', family: 'util', state: 'idle', tip: 'transport.sync_stop', transport: true },
  {
    label: 'Start / Stop',
    family: 'start',
    state: 'running',
    name: 'Start / Stop, running (pad 16; the transport Start / Stop is the same control)',
    tip: 'transport.start_stop',
    transport: true,
  },
];

/**
 * The four banks after Sections: what the Stage passes today (its fixtures index these), kept so
 * adding Sections can't shift the Stage's banks. `allPadBanks` is the whole list.
 */
export const padBanks = ['Quick Racks', 'Chord', 'Multi Pads', 'Setup'];

/** Every pad bank, one header tab each, as the Launchkey pages them: Sections first. */
export const allPadBanks = ['Sections', ...padBanks];

/** Quick Racks: racks 1–8 of the bank on view (1 loaded, 2–5 stored, 6–8 empty slots), then OTS 1–4, Bank −/+ and Store. */
export const quickRackPads: PadItem[] = [
  ...Array.from({ length: 8 }, (_, i) =>
    util(`Rack${NB}${i + 1}`, i === 0 ? 'playing' : i < 5 ? 'idle' : 'dark'),
  ),
  util(`OTS${NB}1`, 'playing'),
  util(`OTS${NB}2`),
  util(`OTS${NB}3`),
  util(`OTS${NB}4`),
  util('Bank −'),
  util('Bank +'),
  util('Store'),
  empty(),
];

/** Quick Racks with Store armed: every rack slot and Store flash, waiting for the slot to store into. */
export const quickRackStorePads: PadItem[] = quickRackPads.map((pad, i) =>
  i < 8 || pad.label === 'Store' ? { ...pad, state: 'armed' } : pad,
);

/** Chord: the top row has nothing; the mid-song chord switches on the bottom row. */
export const chordPads: PadItem[] = [
  ...Array.from({ length: 8 }, empty),
  util('Manual Bass'),
  util('Stop ACMP'),
  util('Split −'),
  util('Split +'),
  util('Transp −'),
  util('Transp +'),
  util('Transp 0'),
  // A soft hyphen: in a caps pack at eight a row the word is wider than its pad.
  { ...util('Retrig­ger'), name: 'Retrigger (pad 16)' },
];

/** Multi Pads: pads 1–4 (1 playing) and Stop; Synchro Start 1–4 and Stop 1–4 below. */
export const multiPadPads: PadItem[] = [
  util(`Pad${NB}1`, 'playing'),
  util(`Pad${NB}2`),
  util(`Pad${NB}3`),
  util(`Pad${NB}4`),
  util('Stop'),
  empty(),
  empty(),
  empty(),
  util(`Sync${NB}1`),
  util(`Sync${NB}2`),
  util(`Sync${NB}3`),
  util(`Sync${NB}4`),
  util(`Stop${NB}1`),
  util(`Stop${NB}2`),
  util(`Stop${NB}3`),
  util(`Stop${NB}4`),
];

/** Setup: the fingering types (Single chosen) and Upper; OTS Link and the Stop ACMP mode (Style). */
export const setupPads: PadItem[] = [
  util('Single', 'playing'),
  util('Fingered'),
  util('On Bass'),
  util('Multi'),
  util('AI Full'),
  util('Upper'),
  empty(),
  empty(),
  util('OTS Link'),
  util('Stop Style', 'playing'),
  util('Stop Fixed'),
  empty(),
  empty(),
  empty(),
  empty(),
  empty(),
];

/** Every bank's sixteen pads, in `padBanks` order. */
export const padsByBank: PadItem[][] = [quickRackPads, chordPads, multiPadPads, setupPads];

/** Every bank's sixteen pads, in `allPadBanks` order (Sections first). */
export const allPadsByBank: PadItem[][] = [sectionPads, ...padsByBank];

/** The board's bank name and its old counter (PadBank no longer draws the counter). */
export const quickRackBank = { name: 'Quick Racks', count: '1/4' };

/* ---------- stories: PadBank.stories.tsx and PadBank.stories.svelte.ts draw these ---------- */

/** The bank indexes in `allPadBanks`. */
export const BANK = { Sections: 0, QuickRacks: 1, Chord: 2, MultiPads: 3, Setup: 4 } as const;

/** The controls, the same in both Storybooks. */
export const padBankArgTypes = {
  pads: { control: 'object' },
  banks: { control: 'object' },
  bank: { control: { type: 'number', min: 0, max: allPadBanks.length - 1, step: 1 } },
  lit: { control: 'boolean' },
  form: { control: { type: 'inline-radio' }, options: PAD_BANK_FORMS.map((f) => f.id) },
  columns: { control: { type: 'inline-radio' }, options: [8, 4] },
  bankName: { control: 'text' },
} as const;

/** Every story's frame width: a 1440 Stage's pads, unless `padBankFrameWidths` names its own. */
export const PAD_BANK_FRAME_WIDTH = 552;

/** The stories whose frame is wider than `PAD_BANK_FRAME_WIDTH`, by name. */
export const padBankFrameWidths: Partial<Record<string, number>> = { Forms: 1100 };

/** A box inside the frame: its width, and a height (a grid, so the region fills it) when it names one. */
export interface PadBankBox {
  width: number;
  height?: number;
}

/** The stories that draw the region in a box inside the frame, by name. */
export const padBankBoxes: Partial<Record<string, PadBankBox>> = {
  FourByFour: { width: 464, height: 232 },
  At1217: { width: 464 },
  ShortRegion: { width: 552, height: 120 },
};

/** Every story's args over: the board, the Quick Racks bank. */
const board: Partial<PadBankRegionProps> = { pads: quickRackPads, banks: allPadBanks, bank: BANK.QuickRacks, lit: true };

/** Every story's args (and the Forms story's three regions, one per form). */
export const padBankStories = defineFixtures<PadBankRegionProps>()({
  Board: { args: board },
  Sections: { args: { ...board, pads: sectionPads, bank: BANK.Sections } },
  FourByFour: { args: { ...board, columns: 4 } },
  FlashOff: { args: { ...board, pads: quickRackStorePads, lit: false } },
  StoreArmed: { args: { ...board, pads: quickRackStorePads } },
  ChordBank: { args: { ...board, bank: BANK.Chord, pads: chordPads } },
  FewerPads: { args: { ...board, pads: quickRackPads.slice(0, 5) } },
  FewerPadsFourByFour: { args: { ...board, pads: quickRackPads.slice(0, 5), columns: 4 } },
  MultiPadsBank: { args: { ...board, bank: BANK.MultiPads, pads: multiPadPads } },
  SetupBank: { args: { ...board, bank: BANK.Setup, pads: setupPads } },
  PartLit: {
    args: {
      ...board,
      bank: BANK.MultiPads,
      pads: multiPadPads.map((pad, i): PadItem => (i === 1 ? { ...pad, family: 'r2', state: 'playing' } : pad)),
    },
  },
  At1440: { args: board },
  At1217: { args: { ...board, bank: BANK.Chord, pads: chordPads } },
  ShortRegion: { args: { ...board, pads: sectionPads, bank: BANK.Sections } },
  Forms: {
    args: { ...board, pads: sectionPads, bank: BANK.Sections },
    items: PAD_BANK_FORMS.map((f) => ({ form: f.id, name: `Pads (${f.id})` })),
  },
  Playground: { args: board },
});

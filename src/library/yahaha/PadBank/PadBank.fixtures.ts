import type { PadItem } from './PadBank';

// Ported from the baseline Stage Playground's `stagePadBanks` (yahaha/src/ui/Stage/Stage.fixtures.ts),
// minus Sections, which moved to the SongForm region. The baseline's "—" pads (nothing assigned)
// are `empty` here; its dark pads (an empty Quick Rack, absent from this bank) stay `dark`.

const NB = ' ';
const util = (label: string, state: PadItem['state'] = 'idle'): PadItem => ({ label, family: 'util', state });
const empty = (): PadItem => ({ label: '', family: 'util', state: 'idle', empty: true });

/** The pad banks, one header tab each. Sections is gone: it is the SongForm region's. */
export const padBanks = ['Quick Racks', 'Chord', 'Multi Pads', 'Setup'];

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

/** The board's bank name and its old counter (PadBank no longer draws the counter). */
export const quickRackBank = { name: 'Quick Racks', count: '1/4' };

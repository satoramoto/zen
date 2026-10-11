import type { LaunchkeyPageData, PadPageRow } from '../Settings/types'

const RACKS: PadPageRow = {
  id: 'racks',
  label: 'Racks',
  pads: 'Quick Racks 1–8, OTS 1–4, Bank −, Bank +, Store',
  shown: true,
}
const CHORD: PadPageRow = {
  id: 'chord',
  label: 'Chord',
  pads: 'Manual Bass, Stop ACMP, Split −/+, Kbd Tr −/+, Tr Reset, Retrigger',
  shown: true,
}
const SETUP: PadPageRow = {
  id: 'setup',
  label: 'Setup',
  pads: 'The 7 fingerings, Upper, OTS Link, ACMP Style, ACMP Fixed',
  shown: true,
}
const MULTI_PADS: PadPageRow = {
  id: 'multiPads',
  label: 'Multi Pads',
  pads: 'Pad 1–4, Stop; Select 1–4, Stop 1–4',
  shown: true,
}
const SECTIONS_PADS = 'Intro, Main, Ending, Fill, Break, Sync, Tap, Start/Stop'

/** The board: all five pages shown, Setup moved up ahead of Multi Pads (so not the default order). */
export const launchkeyBoard: LaunchkeyPageData = {
  pages: [RACKS, CHORD, SETUP, MULTI_PADS],
  sectionsPads: SECTIONS_PADS,
  isDefault: false,
}

/** The default order (Sections, Racks, Chord, Multi Pads, Setup): Default order is shown, not pressable. */
export const launchkeyDefault: LaunchkeyPageData = {
  pages: [RACKS, CHORD, MULTI_PADS, SETUP],
  sectionsPads: SECTIONS_PADS,
  isDefault: true,
}

/** Multi Pads left out: listed last, unnumbered, ▲ ▼ not pressable; Pad Bank steps through four pages. */
export const launchkeyPageLeftOut: LaunchkeyPageData = {
  pages: [RACKS, CHORD, SETUP, { ...MULTI_PADS, shown: false }],
  sectionsPads: SECTIONS_PADS,
  isDefault: false,
}

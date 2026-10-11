import type { ListRow } from '../ListTable/types'
import type { ChosenRack, LoadedRack, MissingPart, StyleRacks } from './types'

/** The live rack: Sunday drive, modified, Right 3's plugin missing, on A1. */
export const racksLoaded: LoadedRack = { name: 'Sunday drive', modified: true, missing: true, slot: 'A1', canSave: true }

/** Right 3 plays Orchestra Deluxe, which isn't installed. */
export const racksMissing: MissingPart[] = [{ part: 'Right 3', plugin: 'Orchestra Deluxe' }]

/** Your nine racks, as the list shows them; three need attention. */
export const racksRows: ListRow[] = [
  { id: 'sunday', cells: ['Sunday drive', 'Stage Grand · Silk Strings · Orchestra Deluxe · Fingered Bass', 'A1'], warn: true },
  { id: 'ballad', cells: ['Ballad', 'Stage Grand · Warm Pad · Sampler Deluxe Choir', 'A2'], warn: true },
  { id: 'evening', cells: ['Evening', 'Tine EP · Silk Strings · Fretless', 'A3'] },
  { id: 'organ', cells: ['Organ', 'Drawbar Jazz · Rotary Full · Upright', 'A4'] },
  { id: 'film', cells: ['Film score', 'Wide Strings · Horn Section · Sampler Deluxe Choir', ''], warn: true },
  { id: 'bossa', cells: ['Bossa lounge', 'Nylon Guitar · Soft Flute · Upright', 'A5'] },
  { id: 'gospel', cells: ['Gospel', 'Drawbar Gospel · Stage Grand · Fingered Bass', 'A6'] },
  { id: 'synth', cells: ['Synth lead', 'Saw Lead · Analog Pad · Synth Bass', ''] },
  { id: 'brass', cells: ['Big brass', 'Brass Section · Trumpet · Fingered Bass', 'A7'] },
]

/** The chosen rack: Organ, on Quick Rack A4. */
export const racksChosen: ChosenRack = {
  id: 'organ',
  name: 'Organ',
  loaded: false,
  subtitle: 'Quick Rack A4',
  parts: [
    { tag: 'R1', name: 'Drawbar Jazz', on: true },
    { tag: 'R2', name: 'Rotary Full', on: true },
    { tag: 'R3', name: 'Silk Strings', on: false },
    { tag: 'L', name: 'Upright', on: true },
  ],
  deleteNote: 'Quick Rack A4 will be empty.',
}

/** Sunday Drive Pop's One Touch settings: One Touch 2 (applied) loads Ballad. */
export const racksStyle: StyleRacks = {
  style: 'Sunday Drive Pop',
  slots: [
    { rack: null, missing: false },
    { rack: 'ballad', missing: false },
    { rack: null, missing: false },
    { rack: null, missing: false },
  ],
  racks: racksRows.map((r) => ({ id: r.id, name: r.cells[0] })),
  applied: 2,
  link: false,
  timing: 'mainChange',
  readOnly: false,
}

/** The page as the board draws it, with the delete confirm open for Organ. */
export const racksBoard = {
  count: 9,
  query: '',
  attention: false,
  attentionCount: 3,
  loaded: racksLoaded,
  missing: racksMissing,
  saveAsName: null as string | null,
  rows: racksRows,
  selected: 'organ' as string | null,
  emptyText: 'No racks yet.',
  chosen: racksChosen as ChosenRack | null,
  confirming: true,
  styleRacks: racksStyle,
  width: 1010,
  height: 560,
}

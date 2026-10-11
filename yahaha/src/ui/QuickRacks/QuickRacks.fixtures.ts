import { stageBoard } from '../Stage/Stage.fixtures'
import type { OneTouchRow, QuickRackSlot, StoreUndo, StoreWait } from './types'

const tip = (i: number) => `quick.${i + 1}`

/** The board's bank A (QuickRacks-Dark): Sunday drive loaded and modified, three stored, four empty. */
export const boardSlots: QuickRackSlot[] = [
  { code: 'A1', name: 'Sunday drive', state: 'loaded', modified: true, tip: tip(0) },
  { code: 'A2', name: 'Warm keys', state: 'stored', tip: tip(1) },
  { code: 'A3', name: 'Lead synth', state: 'stored', tip: tip(2) },
  { code: 'A4', name: 'Organ', state: 'stored', tip: tip(3) },
  { code: 'A5', name: '', state: 'empty', tip: tip(4) },
  { code: 'A6', name: '', state: 'empty', tip: tip(5) },
  { code: 'A7', name: '', state: 'empty', tip: tip(6) },
  { code: 'A8', name: '', state: 'empty', tip: tip(7) },
]

/** Bank C: one rack stored, one whose rack is gone, the rest empty, none loaded. */
export const bankCSlots: QuickRackSlot[] = Array.from({ length: 8 }, (_, i) => ({
  code: `C${i + 1}`,
  name: i === 0 ? 'Ballad strings' : i === 2 ? 'Old organ' : '',
  state: i === 0 ? 'stored' : i === 2 ? 'missing' : 'empty',
  tip: tip(i),
}))

/** The board's One Touch row: Sunday Drive Pop's four, OTS 2 applied, OTS 4 loading your Organ rack. */
export const boardOneTouch: OneTouchRow = {
  items: [
    { name: 'Piano solo', rack: '', rackName: '', missing: false },
    { name: 'Strings up', rack: '', rackName: '', missing: false },
    { name: 'Brass hits', rack: '', rackName: '', missing: false },
    { name: 'Organ', rack: 'r-organ', rackName: 'Organ', missing: false },
  ],
  applied: 2,
  racks: [
    { id: 'r-sunday', name: 'Sunday drive' },
    { id: 'r-warm', name: 'Warm keys' },
    { id: 'r-lead', name: 'Lead synth' },
    { id: 'r-organ', name: 'Organ' },
    { id: 'r-ballad', name: 'Ballad strings' },
  ],
  link: false,
  timing: 'mainChange',
  readOnly: false,
}

/** The board's waiting Store: A5 tapped while armed, Sunday drive modified. */
export const boardWaiting: StoreWait = { code: 'A5', rack: 'Sunday drive', needsName: false, name: 'Sunday drive' }

/** A waiting Store of a rack never saved: it asks for a name. */
export const newRackWaiting: StoreWait = { code: 'A5', rack: 'New rack', needsName: true, name: 'New rack' }

/** A store just saved Sunday drive over Lead synth on A3: Undo puts Lead synth back. */
export const storeUndo: StoreUndo = { code: 'A3', name: 'Lead synth', previous: null }

/** A store saved over the lit A1: the old Sunday drive kept as "Previous: Sunday drive". */
export const litStoreUndo: StoreUndo = { code: 'A1', name: 'Sunday drive', previous: 'Previous: Sunday drive' }

/** The Stage around the page: the board's, with Quick Racks the chosen page tab. */
export const quickRacksStage = {
  ...stageBoard,
  appBar: { ...stageBoard.appBar, chosen: 'quickRacks' },
}

/** The board (QuickRacks-Dark): bank A, Store armed, A5 waiting for Save. */
export const quickRacksBoard = {
  stage: quickRacksStage,
  bank: 0,
  bankCount: 8,
  slots: boardSlots.map((s) => (s.code === 'A5' ? { ...s, waiting: true } : s)),
  lit: 'A1',
  store: true,
  readOnly: false,
  waiting: boardWaiting,
  undo: null as StoreUndo | null,
  oneTouch: boardOneTouch,
}

/** At rest: bank A, nothing armed, nothing waiting. */
export const quickRacksRest = {
  ...quickRacksBoard,
  slots: boardSlots,
  store: false,
  waiting: null,
}

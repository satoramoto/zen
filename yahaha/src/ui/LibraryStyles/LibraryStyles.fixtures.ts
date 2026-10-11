import type { FolderItem } from '../FolderList/types'
import type { ListRow } from '../ListTable/types'
import type { StyleLoad, StyleViewTab } from './types'

/** The style folders (fake names), Pop & Rock first. */
export const styleFolders: FolderItem[] = [
  ['Pop & Rock', '212'],
  ['Ballad', '98'],
  ['Dance', '164'],
  ['Swing & Jazz', '141'],
  ['R&B', '87'],
  ['Country', '76'],
  ['Latin', '118'],
  ['Ballroom', '102'],
  ['Entertainment', '90'],
  ['Movie & Show', '64'],
  ['World', '132'],
].map(([label, count]) => ({ id: label, label, count, tip: 'browser.folder' }))

/** The view tabs with their counts. */
export const styleViews: StyleViewTab[] = [
  { id: 'all', label: 'All', count: '1,284' },
  { id: 'favourites', label: 'Favourites', count: '36' },
  { id: 'recents', label: 'Recent', count: '12' },
]

type Def = [id: number, name: string, folder: string, bpm: string, time: string, file: string, star: boolean, extra?: Partial<ListRow>]

const defs: Def[] = [
  [101, 'Unplugged Ballad Pop', '8Beat', '76', '4/4', 'SFF2', false],
  [102, 'Brit Pop Anthem', 'Pop', '128', '4/4', 'SFF2', true],
  [103, 'Coastal Highway', 'Pop', '112', '4/4', 'SFF2', true, { badge: 'next bar' }],
  [104, 'Pop Shuffle', 'Pop', '108', '12/8', 'SFF2', false, { mark: '◀' }],
  [105, 'Sunday Drive Pop', 'Pop', '104', '4/4', 'SFF2', true, { mark: '●' }],
  [106, 'Waltz Pop', 'Pop', '84', '3/4', 'SFF2', false, { mark: '▶' }],
  [107, 'Garage Summer', 'Rock', '138', '4/4', 'SFF1', false],
  [108, 'Soft Rock Radio', 'Rock', '92', '4/4', 'SFF2', false],
  [109, 'Motown Pop Soul', 'Soul', '116', '4/4', 'SFF2', false],
  [110, 'Broken Tape Groove', 'unreadable: not a style file', '', '', '', false, { warn: true, dim: true }],
  [111, 'Late Night Lounge', 'Soul', '…', '', '…', false, { dim: true }],
]

/** The Pop & Rock rows in Track order: Sunday Drive Pop loaded, Coastal Highway queued for the next bar. */
export const styleRows: ListRow[] = defs.map(([id, name, folder, bpm, time, file, star, extra], k) => ({
  id: String(id),
  cells: [String(k + 1), name, folder, bpm, time, file],
  name: [name, folder, /^\d+$/.test(bpm) ? `${bpm} BPM` : '', time].filter(Boolean).join(', '),
  star,
  ...extra,
}))

/** The rows the filter "pop" leaves. */
export const popRows: ListRow[] = styleRows.filter((row) => row.cells[1].toLowerCase().includes('pop'))

/** The Load button on the queued style while the band runs. */
export const loadQueued: StyleLoad = {
  label: 'Load Coastal Highway · next bar',
  name: 'Coastal Highway loads at the next bar (queued)',
  face: 'waiting',
  disabled: false,
  queues: true,
}

/** The Load button on a style while the band is stopped. */
export const loadStopped: StyleLoad = {
  label: 'Load Waltz Pop',
  name: 'Load Waltz Pop',
  face: 'rest',
  disabled: false,
  queues: false,
}

/** The Load button with nothing to load. */
export const loadNothing: StyleLoad = { label: 'Load', name: 'Load: nothing to load', face: 'rest', disabled: true, queues: false }

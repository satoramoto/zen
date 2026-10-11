import type { ComponentProps } from 'svelte'
import { boardAppBar } from '../AppBar/AppBar.fixtures'
import type { TabItem } from '../ChosenTabs/types'
import { boardKeys } from '../Keys/Keys.fixtures'
import { instrumentRows, instrumentsBoard, samplerDetail } from '../LibraryInstruments/LibraryInstruments.fixtures'
import { racksBoard } from '../LibraryRacks/LibraryRacks.fixtures'
import { soundsBoard } from '../LibrarySounds/LibrarySounds.fixtures'
import { loadQueued, styleFolders, styleRows, styleViews } from '../LibraryStyles/LibraryStyles.fixtures'
import { quickSlotsBoard } from '../QuickRacksBar/QuickRacksBar.fixtures'
import type Library from './Library.svelte'

type Props = ComponentProps<typeof Library>

/** Drops a page fixture's story size: in the screen, a page fills its column. */
function fill<T extends { width?: number; height?: number }>(page: T): Omit<T, 'width' | 'height'> {
  const { width: _w, height: _h, ...rest } = page
  void _w
  void _h
  return rest
}

/** The Library pages, with their counts as the boards write them. */
export const libraryPages: TabItem[] = [
  { id: 'styles', label: 'Styles 1,284', name: 'Styles, 1,284', tip: 'library.tab_styles' },
  { id: 'sounds', label: 'Sounds 886', name: 'Sounds, 886', tip: 'library.tab_sounds' },
  { id: 'instruments', label: 'Instruments 4', name: 'Instruments, 4', tip: 'library.tab_instruments' },
  { id: 'racks', label: 'Racks 9', name: 'Racks, 9', tip: 'library.tab_racks' },
  { id: 'map', label: 'Style map', tip: 'library.tab_map' },
]

/** Library › Styles as Browser-Dark draws it: Pop & Rock, Coastal Highway queued for the next bar. */
export const stylesPage = {
  viewName: 'Pop & Rock',
  count: '212',
  views: styleViews,
  view: null,
  folders: styleFolders,
  folder: 'Pop & Rock',
  rows: styleRows,
  cursor: '103',
  query: '',
  emptyText: 'No styles match the filter.',
  autoPreview: true,
  running: true,
  note: '',
  queued: true,
  canCancel: false,
  load: loadQueued,
  canOpenFile: true,
} satisfies Props['styles']

/** Library › Sounds as LibrarySounds-Dark draws it. */
export const soundsPage = fill(soundsBoard) satisfies Props['sounds']

/** Library › Instruments as LibraryInstruments-Dark draws it: Sampler Deluxe chosen. */
export const instrumentsPage = {
  ...instrumentsBoard,
  show: 'all',
  rows: instrumentRows,
  selected: samplerDetail.id,
  detail: samplerDetail,
  canRescan: true,
  scanning: false,
} satisfies Props['instruments']

/** Library › Racks as LibraryRacks-Dark draws it, without the delete confirm open. */
export const racksPage = { ...fill(racksBoard), confirming: false } satisfies Props['racks']

/** The board's frame: Library chosen in the app bar, running in Main B, Quick Rack A1 loaded. */
export const libraryBoard = {
  appBar: { ...boardAppBar, chosen: 'library' },
  help: false,
  pages: libraryPages,
  page: 'sounds',
  quickRacks: { bank: 'A', bankCount: 8, slots: quickSlotsBoard, store: false, clear: false, readOnly: false },
  styles: stylesPage,
  sounds: soundsPage,
  instruments: instrumentsPage,
  racks: racksPage,
  status: { text: null },
  keys: boardKeys,
} satisfies Props

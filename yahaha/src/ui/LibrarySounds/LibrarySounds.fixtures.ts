import type { ComponentProps } from 'svelte'
import type LibrarySounds from './LibrarySounds.svelte'
import type LibrarySoundsSave from './LibrarySoundsSave.svelte'
import type { SoundCategoryItem } from './types'

/** The page's props plus its header actions' (LibrarySoundsSave), as the Library passes them. */
type SoundsProps = ComponentProps<typeof LibrarySounds> & ComponentProps<typeof LibrarySoundsSave>

const PARTS = ['Right 1', 'Right 2', 'Right 3', 'Left']

/** The 13 categories in the Genos order, with counts. */
export const soundCategories: SoundCategoryItem[] = [
  { id: 'piano', label: 'Piano', count: 12 },
  { id: 'ePiano', label: 'E.Piano', count: 9 },
  { id: 'organ', label: 'Organ', count: 11 },
  { id: 'guitar', label: 'Guitar', count: 14 },
  { id: 'bass', label: 'Bass', count: 10 },
  { id: 'strings', label: 'Strings', count: 7 },
  { id: 'brass', label: 'Brass', count: 6 },
  { id: 'saxWoodwind', label: 'Sax/Woodwind', count: 5 },
  { id: 'synthLead', label: 'Synth Lead', count: 9 },
  { id: 'pad', label: 'Pad', count: 8 },
  { id: 'choir', label: 'Choir', count: 3 },
  { id: 'drumsPerc', label: 'Drums/Perc', count: 4 },
  { id: 'sfx', label: 'SFX', count: 2 },
]

/** Library › Sounds as the board draws it: Strings, Right 2 the target, playing 41 Silk Strings (edited); the band runs. */
export const soundsBoard = {
  partNames: PARTS,
  part: 1,
  edited: true,
  saveAs: null,
  canPreset: true,
  query: '',
  source: 'all',
  instrument: null,
  categories: soundCategories,
  category: 'strings',
  rows: [
    { id: 'saved:p41', cells: ['41', 'Silk Strings', 'Sampler Deluxe', 'Mine'], badge: 'R2 L', badgeHue: 'r2', star: true },
    { id: 'saved:p42', cells: ['42', 'Warm Section', 'Sampler Deluxe', 'Mine'], star: false },
    { id: 'au:sampler#f:3', cells: ['—', 'Ensemble Legato', 'Sampler Deluxe', 'Factory'], star: false },
    { id: 'au:sampler#f:4', cells: ['—', 'Pizzicato Hall', 'Sampler Deluxe', 'Factory'], star: false, warn: true },
    { id: 'sf:demo.sf2:0:48', cells: ['—', 'Strings', 'Demo Font', 'SoundFont'], star: true },
    { id: 'sf:demo.sf2:0:49', cells: ['—', 'Slow Strings', 'Demo Font', 'SoundFont'], star: false },
    { id: 'sf:demo.sf2:0:44', cells: ['—', 'Tremolo Strings', 'Demo Font', 'SoundFont'], star: false },
  ],
  selected: 'saved:p41',
  emptyText: 'No sounds match. Clear a filter, or make one from Instruments.',
  detail: {
    id: 'saved:p41',
    number: '41',
    name: 'Silk Strings',
    badge: 'mine',
    instrument: 'Sampler Deluxe · preset Ensemble Legato',
    category: 'strings',
    categoryEditable: true,
    playingOn: [1, 3],
    inMySounds: true,
    canAudition: true,
    canMoveUp: true,
    canMoveDown: true,
  },
  running: true,
  confirmDelete: false,
  width: 1010,
  height: 560,
} satisfies SoundsProps

/** The band stopped and a SoundFont preset selected that no part plays: Audition and Use on Right 2 are on. */
export const soundsStopped = {
  ...soundsBoard,
  running: false,
  edited: false,
  selected: 'sf:demo.sf2:0:49',
  detail: {
    id: 'sf:demo.sf2:0:49',
    name: 'Slow Strings',
    badge: 'soundFont',
    instrument: 'Demo Font · bank 0, program 50',
    category: 'strings',
    categoryEditable: false,
    playingOn: [],
    inMySounds: false,
    canAudition: true,
    canMoveUp: false,
    canMoveDown: false,
  },
} satisfies SoundsProps

/** Instruments › Browse sounds on Sampler Deluxe, searching for a word nothing matches. */
export const soundsEmpty = {
  ...soundsBoard,
  query: 'zither',
  source: 'factory',
  instrument: 'Sampler Deluxe',
  category: null,
  categories: soundCategories.map((c) => ({ ...c, count: 0 })),
  rows: [],
  selected: null,
  detail: null,
} satisfies SoundsProps

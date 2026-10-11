import type { MultiPadBankItem, MultiPadsData } from './types'

/** A pad bank list: two folders, as the style folders are scanned. */
export const multiPadBanks: MultiPadBankItem[] = [
  { id: '0', name: 'Pop Grooves 1', folder: 'Pads' },
  { id: '1', name: 'Pop Grooves 2', folder: 'Pads' },
  { id: '2', name: 'Funk Hits', folder: 'Pads' },
  { id: '3', name: 'Ballad Arps', folder: 'Pads' },
  { id: '4', name: 'Latin Perc', folder: 'Pads/Latin' },
  { id: '5', name: 'Salsa Brass', folder: 'Pads/Latin' },
  { id: '6', name: 'Bossa Guitar', folder: 'Pads/Latin' },
  { id: '7', name: 'Gospel Organ', folder: 'Pads/Church' },
  { id: '8', name: 'Choir Swells', folder: 'Pads/Church' },
]

/**
 * The board (MultiPads-Dark.dc.html): Pop Grooves 2 loaded while the band plays; pad 1 playing,
 * pad 2 waiting for the bar line, pad 3 armed for Synchro Start, pad 4 ready.
 */
export const multiPadsBoard: MultiPadsData = {
  banks: multiPadBanks,
  bank: '1',
  bankName: 'Pop Grooves 2',
  loading: false,
  pads: [
    { name: 'Clav Riff', lamp: 'playing', repeat: true, chordMatch: true, channel: 5 },
    { name: 'Brass Stabs', lamp: 'queued', repeat: false, chordMatch: true, channel: 6 },
    { name: 'Guitar Strum', lamp: 'armed', repeat: true, chordMatch: true, channel: 7 },
    { name: 'Tambourine', lamp: 'ready', repeat: true, chordMatch: false, channel: 8 },
  ],
  lit: true,
  running: true,
  volume: 90,
  volumeWaiting: false,
  synchroStop: { styleStop: true, ending: false },
}

/** No bank loaded, the band stopped: the four pads dark and their controls absent. */
export const multiPadsEmpty: MultiPadsData = {
  ...multiPadsBoard,
  bank: null,
  bankName: '',
  pads: multiPadsBoard.pads.map((p) => ({ ...p, name: '', lamp: 'empty', repeat: false, chordMatch: false })),
  running: false,
  volume: 100,
}

/** A bank with three pads, loading the next one; fader 6 not yet picked up; both Synchro Stops on. */
export const multiPadsLoading: MultiPadsData = {
  ...multiPadsBoard,
  bank: '4',
  bankName: 'Latin Perc',
  loading: true,
  pads: [
    { name: 'Conga Loop', lamp: 'ready', repeat: true, chordMatch: false, channel: 5 },
    { name: 'Timbales Fill', lamp: 'ready', repeat: false, chordMatch: false, channel: 6 },
    { name: 'Shaker', lamp: 'ready', repeat: true, chordMatch: false, channel: 7 },
    { name: '', lamp: 'empty', repeat: false, chordMatch: false, channel: 8 },
  ],
  running: false,
  volume: 64,
  volumeWaiting: true,
  synchroStop: { styleStop: true, ending: true },
}

/** No bank, and Load… failed: the file picker didn't open. */
export const multiPadsLoadFailed: MultiPadsData = { ...multiPadsEmpty, error: "The file picker didn't open: dialog.open not allowed" }

/** No .pad files found. */
export const multiPadsNoBanks: MultiPadsData = { ...multiPadsEmpty, banks: [] }

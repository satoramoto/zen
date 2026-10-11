import type { ListColumn, ListRow } from './types'

/** The style list's columns. */
export const styleColumns: ListColumn[] = [
  { key: 'track', label: 'Track', width: 56, align: 'end' },
  { key: 'name', label: 'Name' },
  { key: 'folder', label: 'Folder', width: 140 },
  { key: 'bpm', label: 'BPM', width: 56, align: 'end' },
  { key: 'time', label: 'Time', width: 56, align: 'end' },
  { key: 'file', label: 'File', width: 200 },
]

/** Fake styles (no real style data): one playing, one queued for the next bar, one unreadable. */
export const styleRows: ListRow[] = [
  { id: 's1', cells: ['1', 'Sunday Drive Pop', 'Pop & Rock', '112', '4/4', 'SundayDrivePop.sty'], mark: '●', star: true },
  {
    id: 's2',
    cells: ['2', 'Coastal Highway', 'Pop & Rock', '124', '4/4', 'CoastalHighway.sty'],
    mark: '▶',
    badge: 'next bar',
    star: false,
  },
  { id: 's3', cells: ['3', 'Midnight Lantern Ballad', 'Ballad', '68', '4/4', 'MidnightLantern.sty'], star: true },
  { id: 's4', cells: ['4', 'Velvet Room Swing', 'Swing & Jazz', '138', '4/4', 'VelvetRoomSwing.sty'], star: false },
  {
    id: 's5',
    cells: ['5', 'Paper Boat Waltz', 'Ballad', '96', '3/4', 'PaperBoatWaltz.sty'],
    badge: 'New',
    badgeHue: 'ok',
    star: false,
  },
  { id: 's6', cells: ['6', 'Neon Harbour Dance', 'Dance', '126', '4/4', 'NeonHarbourDance.sty'], star: false },
  {
    id: 's7',
    cells: ['7', 'Broken Compass Groove', 'R&B', '—', '—', 'BrokenCompass.sty'],
    name: 'Broken Compass Groove, unreadable',
    warn: true,
    dim: true,
    star: false,
  },
  {
    id: 's8',
    cells: ['8', 'Porch Light Country Shuffle With A Very Long Name', 'Country', '104', '4/4', 'PorchLightShuffle.sty'],
    badge: 'edited',
    badgeHue: 'r2',
    star: false,
  },
  { id: 's9', cells: ['9', 'Sand Dollar Bossa', 'Latin', '132', '4/4', 'SandDollarBossa.sty'], star: true },
  { id: 's10', cells: ['10', 'Lighthouse Six-Eight', 'World', '84', '6/8', 'Lighthouse68.sty'], star: false },
]

/** The sound list's columns. */
export const soundColumns: ListColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category', width: 120 },
  { key: 'source', label: 'Source', width: 150 },
  { key: 'program', label: 'Program', width: 72, align: 'end' },
]

/** Fake sounds: General MIDI ones and the fake "Sampler Deluxe" plugin, one of them missing. */
export const soundRows: ListRow[] = [
  { id: 'gm-1', cells: ['Grand Piano', 'Piano', 'GM', '1'] },
  { id: 'gm-5', cells: ['Electric Piano', 'Piano', 'GM', '5'] },
  { id: 'gm-17', cells: ['Drawbar Organ', 'Organ', 'GM', '17'] },
  { id: 'gm-26', cells: ['Steel Guitar', 'Guitar', 'GM', '26'] },
  { id: 'gm-34', cells: ['Fingered Bass', 'Bass', 'GM', '34'] },
  { id: 'gm-49', cells: ['String Ensemble', 'Strings', 'GM', '49'] },
  { id: 'sd-1', cells: ['Warm Tape Keys', 'Piano', 'Sampler Deluxe', '—'], badge: 'edited', badgeHue: 'a' },
  {
    id: 'sd-2',
    cells: ['Glass Choir Pad', 'Synth', 'Sampler Deluxe', '—'],
    name: 'Glass Choir Pad, plugin missing',
    warn: true,
    dim: true,
  },
  { id: 'gm-62', cells: ['Brass Section', 'Brass', 'GM', '62'] },
  { id: 'gm-82', cells: ['Saw Lead', 'Synth', 'GM', '82'] },
]

const ADJECTIVES = ['Sunday', 'Coastal', 'Velvet', 'Neon', 'Paper', 'Midnight', 'Golden', 'Silver', 'Copper', 'Harbour']
const NOUNS = ['Drive', 'Highway', 'Lantern', 'Compass', 'Boat', 'Garden', 'Avenue', 'Skyline', 'River', 'Porch']
const GENRES = ['Pop', 'Ballad', 'Swing', 'Dance', 'Bossa', 'Shuffle', 'Waltz', 'Groove']
const FOLDERS = ['Pop & Rock', 'Ballad', 'Swing & Jazz', 'Dance', 'Latin', 'Country', 'R&B', 'World']

/** `count` generated fake styles, for showing the virtualisation. Deterministic. */
export function manyStyles(count: number): ListRow[] {
  const rows: ListRow[] = []
  for (let i = 0; i < count; i++) {
    const name = `${ADJECTIVES[i % 10]} ${NOUNS[Math.floor(i / 10) % 10]} ${GENRES[Math.floor(i / 100) % 8]} ${i + 1}`
    const waltz = i % 17 === 0
    rows.push({
      id: `g${i}`,
      cells: [
        String(i + 1),
        name,
        FOLDERS[i % 8],
        String(60 + ((i * 7) % 120)),
        waltz ? '3/4' : '4/4',
        `${name.replaceAll(' ', '')}.sty`,
      ],
      star: i % 11 === 0,
    })
  }
  return rows
}

/** 5,000 generated styles. */
export const largeStyleRows = manyStyles(5000)

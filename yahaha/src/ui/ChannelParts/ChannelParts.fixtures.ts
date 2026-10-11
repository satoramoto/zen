import type { PartEntry } from '../Channel/types'

const STYLE_TAGS = ['Rhythm 1', 'Rhythm 2', 'Bass', 'Chord 1', 'Chord 2', 'Pad', 'Phrase 1', 'Phrase 2']

/** The board's twelve parts: R1–L with their sounds (R3 off), then the eight Style parts, all on. */
export const partsBoard: PartEntry[] = [
  { tag: 'R1', name: 'Stage Grand', hue: 'r1', off: false },
  { tag: 'R2', name: 'Silk Strings', hue: 'r2', off: false },
  { tag: 'R3', name: 'Brass Section', hue: 'r3', off: true },
  { tag: 'L', name: 'Silk Strings', hue: 'l', off: false },
  ...STYLE_TAGS.map((tag): PartEntry => ({ tag, name: '', hue: null, off: false })),
]

/** The board with R2 playing a sound whose name doesn't fit its cell (the ellipsis). */
export const partsLongName: PartEntry[] = partsBoard.map((part, i) =>
  i === 1 ? { ...part, name: 'A Very Long Sound Name For Testing' } : part,
)

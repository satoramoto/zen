import type { ComponentProps } from 'svelte'
import type StyleLine from './StyleLine.svelte'

/** The board's style line: Sunday Drive Pop, Pop & Rock · 4/4. */
export const styleLineBoard = {
  styleName: 'Sunday Drive Pop',
  category: 'Pop & Rock',
  timeSignature: '4/4',
  queued: '',
} satisfies ComponentProps<typeof StyleLine>

/** The board with a style waiting for the bar line. */
export const styleLineQueued = {
  ...styleLineBoard,
  queued: 'Coastal Highway',
} satisfies ComponentProps<typeof StyleLine>

/** A style name far longer than the third: it ends in an ellipsis, the metre keeps its place. */
export const styleLineLong = {
  ...styleLineBoard,
  styleName: 'Saturday Night Seventies Disco Funk Extended Mix',
  category: 'Dance',
} satisfies ComponentProps<typeof StyleLine>

/** A waltz: Moonlight Waltz, Ballroom · 3/4. */
export const styleLineWaltz = {
  styleName: 'Moonlight Waltz',
  category: 'Ballroom',
  timeSignature: '3/4',
  queued: '',
} satisfies ComponentProps<typeof StyleLine>

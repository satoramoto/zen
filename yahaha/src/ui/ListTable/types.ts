/** A hue a ListTable badge can take. */
export type ListHue = 'a' | 'warn' | 'ok' | 'r1' | 'r2' | 'r3' | 'l' | 'm'

/** One column of a ListTable. */
export type ListColumn = {
  /** Unique within the table. */
  key: string
  /** The header label ("Name", "BPM"). */
  label: string
  /** A fixed width in px; omitted = flex 1, min 0. */
  width?: number
  /** Where the column's text sits: `end` for numbers. Default `start`. */
  align?: 'start' | 'end'
}

/** One row of a ListTable. */
export type ListRow = {
  /** What `onselect` carries and what `selected` names. Unique within the table. */
  id: string
  /** One text per column, in column order. */
  cells: string[]
  /** The option's accessible name; default: the cells joined with ", ". */
  name?: string
  /** A short mark in the narrow lead column before the cells ("●", "◀", "▶"), in --a. */
  mark?: string
  /** A word after the first flex column's text ("next bar", "New", "edited"), in its hue (default 'a'). */
  badge?: string
  /** The badge's hue. Default `a`. */
  badgeHue?: ListHue
  /** A ⚠ glyph (SVG triangle) after the first flex column's text, in --warn. */
  warn?: boolean
  /** Starred: a filled star in the star column; false: a hollow one. Undefined: no star button on this row. */
  star?: boolean
  /** Unavailable (an unreadable style, a missing plugin's sound): text in --absent. Still selectable. */
  dim?: boolean
}

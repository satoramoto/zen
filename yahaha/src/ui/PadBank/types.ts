/** One of the sixteen band pads. */
export type PadItem = {
  /** The caption ("Main B"). Tie a numeral to its word with a no-break space (U+00A0), so only whole words wrap. */
  label: string
  /** A section family (the pad's hue), `util` (neutral), `start` (Start / Stop, `--ok` when running),
   * or a part hue (`r1`, `r2`, `r3`, `l`) for a pad the engine lights in that colour. */
  family: 'intro' | 'main' | 'ending' | 'brk' | 'fill' | 'util' | 'start' | 'r1' | 'r2' | 'r3' | 'l'
  /** The face. */
  state: 'idle' | 'dark' | 'playing' | 'next' | 'armed' | 'running'
  /** The accessible name. Default: "{label} (pad {n})". */
  name?: string
  /** The tooltip key. */
  tip?: string
}

/** One entry of the header's hue legend. */
export type LegendItem = { label: string; hue: string }

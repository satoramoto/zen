/** One Quick Rack slot of the bar's current bank. */
export type QuickSlot = {
  /** The slot's index as shown ("1".."8"). */
  label: string
  /** The stored rack's name ("Sunday drive"); empty for an empty slot. */
  name: string
  /** `loaded` the live rack, `stored` a rack not loaded, `empty` nothing stored, `missing` a stored rack that can't be found. */
  state: 'loaded' | 'stored' | 'empty' | 'missing'
  /** The slot's tooltip key (`quick.1`..`quick.8`). */
  tip?: string
}

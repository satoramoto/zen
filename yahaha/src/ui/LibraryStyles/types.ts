/** A view of the style list in the zone header's tabs. */
export type StyleView = 'all' | 'favourites' | 'recents'

/** One view tab: "All 1,284". */
export type StyleViewTab = {
  /** What `onview` carries and what `view` names. */
  id: StyleView
  /** The tab's word ("All", "Favourites", "Recent"). */
  label: string
  /** Its count, formatted ("1,284"); never changes with the filter. */
  count: string
}

/** The Load button: what it reads and which face it shows. */
export type StyleLoad = {
  /** The face's text ("Load Coastal Highway", "Load Coastal Highway · next bar", "Load"). */
  label: string
  /** The accessible name ("Load Coastal Highway at the next bar", "Sunday Drive Pop is loaded"). */
  name: string
  /** `rest`: the outline face; `waiting`: the 2px ring while that style is queued for the next bar. */
  face: 'rest' | 'waiting'
  /** Shown, not pressable: the loaded style, an unreadable one, the queued one, an empty list. */
  disabled: boolean
  /** The band is running, so a press queues for the next bar (the tooltip says so). */
  queues: boolean
}

/** One Quick Rack slot of the bank on view, as the Quick Racks page draws it. */
export type QuickRackSlot = {
  /** The slot's code: the bank letter and its number ("A1"). */
  code: string
  /** The stored rack's name ("Sunday drive"); empty for an empty slot. A missing rack may keep its name. */
  name: string
  /** `loaded` the live rack's, `stored` a rack not loaded, `empty` nothing stored, `missing` a stored rack that can't be found. */
  state: 'loaded' | 'stored' | 'empty' | 'missing'
  /** Loaded and changed since: the modified dot after the name. */
  modified?: boolean
  /** This slot waits for the live rack to be saved before it's stored here (Store armed, then tapped). */
  waiting?: boolean
  /** The slot's tooltip key (`quick.1`..`quick.8`). */
  tip?: string
}

/** One One Touch button of the loaded style. */
export type OneTouchItem = {
  /** The style's name for it ("Piano solo"); empty: "OTS n". */
  name: string
  /** The user's rack it loads instead of the style's own (its id); empty: the style's own. */
  rack: string
  /** That rack's name; empty for the style's own. */
  rackName: string
  /** The rack chosen is gone: the style's own plays. */
  missing: boolean
}

/** One of the user's racks, as an OTS rack choice. */
export type RackChoice = { id: string; name: string }

/** When OTS Link swaps the setting while the band plays. */
export type LinkTiming = 'immediate' | 'mainChange'

/** The One Touch row: OTS 1–4 with their rack choice, Link and its timing. */
export type OneTouchRow = {
  /** The style's One Touch settings, up to four; the numbers past them are disabled. */
  items: OneTouchItem[]
  /** The applied one, 1–4; 0 = none since the style loaded. */
  applied: number
  /** The racks an OTS can load instead of the style's own. */
  racks: RackChoice[]
  /** OTS Link: Main A–D recall OTS 1–4. */
  link: boolean
  /** When Link recalls during playback. */
  timing: LinkTiming
  /** The OTS rack choices can't be changed (style-racks.json is a newer yahaha's, or there's no data folder). */
  readOnly: boolean
}

/** The last store over a Quick Rack, which Undo takes back. */
export type StoreUndo = {
  /** The button stored on ("A3"). */
  code: string
  /** The rack Undo puts back on it; empty when the button was empty. */
  name: string
  /** The "Previous: <name>" rack kept when the store saved over the lit rack; null when none. */
  previous: string | null
}

/** A Store waiting for the live rack's save, asked in the page's foot. */
export type StoreWait = {
  /** The waiting slot's code ("A5"). */
  code: string
  /** The live rack's name ("Sunday drive", "New rack"). */
  rack: string
  /** The live rack was never saved: it asks for a name (and `name` is the field's text). */
  needsName: boolean
  /** The name field's text when `needsName`. */
  name: string
}

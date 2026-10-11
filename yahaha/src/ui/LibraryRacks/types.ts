/** Short part tag, as the rack writes it; each draws in its part hue. */
export type RackPartTag = 'R1' | 'R2' | 'R3' | 'L'

/** The live rack, on the "Loaded now" line. */
export type LoadedRack = {
  /** Its name ("Sunday drive", "Untitled rack"). */
  name: string
  /** Changed since it was loaded or saved: the modified dot and word. */
  modified: boolean
  /** A part plays a plugin that isn't installed: the ⚠. */
  missing: boolean
  /** The Quick Rack buttons of the bank on view holding it ("A1"); empty: none. */
  slot: string
  /** Save has something to save (modified, or never saved). */
  canSave: boolean
}

/** A part of the live rack whose plugin is missing (the part is silent). */
export type MissingPart = {
  /** The part's name ("Right 3"). */
  part: string
  /** The missing plugin's name ("Orchestra Deluxe"). */
  plugin: string
}

/** One part of the chosen rack. */
export type RackPart = {
  tag: RackPartTag
  /** The sound it plays, by name. */
  name: string
  on: boolean
}

/** The rack the details column shows. */
export type ChosenRack = {
  id: string
  name: string
  /** It's the live rack's: Load and Delete are off. */
  loaded: boolean
  /** The line under its name ("Quick Rack A4", "Not on a Quick Rack in bank A"). */
  subtitle: string
  /** Right 1, Right 2, Right 3, Left. */
  parts: RackPart[]
  /** The inline delete confirm's second line ("Quick Rack A4 will be empty."). */
  deleteNote: string
}

/** One of the loaded style's One Touch settings 1-4. */
export type StyleRackSlot = {
  /** The id of your rack it loads instead; null: the style's own. */
  rack: string | null
  /** The rack chosen is gone: the style's own plays. */
  missing: boolean
}

/** When One Touch Link recalls during playback. */
export type LinkTiming = 'immediate' | 'mainChange'

/** The "Style racks" column: what the loaded style's One Touch buttons load. */
export type StyleRacks = {
  /** The loaded style's name. */
  style: string
  /** One per One Touch setting the style has (0-4). */
  slots: StyleRackSlot[]
  /** Your racks, to pick from. */
  racks: { id: string; name: string }[]
  /** The One Touch setting recalled last, 1-based; 0: none. */
  applied: number
  /** One Touch Link is on. */
  link: boolean
  timing: LinkTiming
  /** The choices can't be changed (a newer yahaha's file, or no data folder): the pickers are off. */
  readOnly: boolean
}

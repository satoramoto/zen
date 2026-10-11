/** The Source tabs: every sound, one kind, or the starred ones. */
export type SoundSourceTab = 'all' | 'mine' | 'factory' | 'soundFont' | 'starred'

/** A part hue, by part index: Right 1, Right 2, Right 3, Left. */
export type PartHue = 'r1' | 'r2' | 'r3' | 'l'

/** One category in the category column, with how many sounds it would show. */
export type SoundCategoryItem = {
  /** The category's id (`strings`), what `oncategory` carries. */
  id: string
  /** Its name ("Strings"). */
  label: string
  /** How many sounds it would show with the other filters. */
  count: number
}

/** The Save as… form, open in the header. */
export type SoundSaveAs = {
  /** The new sound's name. */
  name: string
  /** Also keep it as an .aupreset of the part's plugin (Logic reads it too). */
  aupreset: boolean
  /** The .aupreset's category id. */
  category: string
  /** A user preset of that name exists: ask before replacing it. */
  replace: boolean
}

/** The selected sound, in the details column. */
export type SoundDetail = {
  /** Its catalog id, what the actions carry. */
  id: string
  /** Its sound number (My Sounds only). */
  number?: string
  name: string
  /** Mine, Factory or SoundFont. */
  badge: 'mine' | 'factory' | 'soundFont'
  /** The instrument line under the head ("Sampler Deluxe · preset Ensemble Legato"). */
  instrument: string
  /** Its category id. */
  category: string
  /** Its category can be changed here (a My Sounds sound or a plugin's). */
  categoryEditable: boolean
  /** The parts playing it (0-3). */
  playingOn: number[]
  /** It is in My Sounds already (a Mine sound, or a preset copied there). */
  inMySounds: boolean
  /** Audition can play it (a My Sounds sound or a SoundFont preset; a plugin's preset can't). */
  canAudition: boolean
  /** Its place in My Sounds can move up (Mine only). */
  canMoveUp: boolean
  /** Its place in My Sounds can move down (Mine only). */
  canMoveDown: boolean
  /** Why it can't play (a failed or missing plugin), drawn in --warn. */
  warn?: string
}

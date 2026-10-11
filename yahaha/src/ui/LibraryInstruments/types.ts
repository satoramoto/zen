import type { DetailField } from '../DetailPanel/types'

/** Which instruments the list shows (the header's Show tabs). */
export type InstrumentShow = 'all' | 'plugins' | 'fonts' | 'attention'

/** One instrument row: a plugin (AU), a SoundFont (SF) or a missing plugin. */
export type InstrumentRow = {
  /** What `onchoose` carries and `selected` names: `au:<component>`, `font:<file>` or `missing:<component>`. */
  id: string
  /** The Kind column: `AU` or `SF`. */
  kind: 'AU' | 'SF'
  /** The Name column. */
  name: string
  /** The Status column: "Missing", "In use on R1 R2", "failed: timed out", "260 presets". */
  status: string
  /** The Sounds column: how many of the user's sounds play it. */
  sounds: string
  /** The Racks column: how many racks play it, or "—" when unknown. */
  racks: string
  /** Found by a scan and not opened yet: the "New" badge in the accent. */
  fresh?: boolean
  /** Not installed: the ⚠ mark and the absent text. */
  missing?: boolean
  /** It failed to load last time: the ⚠ mark. */
  failed?: boolean
}

/** The details column for the chosen instrument. */
export type InstrumentDetail = {
  /** The chosen row's id (passed to the action callbacks). */
  id: string
  /** The instrument's name. */
  title: string
  /** `AU` for a plugin, `SoundFont` for a font. */
  badge: string
  /** Maker · version, or the font's presets line. */
  subtitle?: string
  /** The fields: My Sounds, In racks, Playing on (in part hues), the scan's word. */
  fields: DetailField[]
  /** In process (plugins only): on, or null when the plugin can't run in process / not a plugin. */
  inProcess: boolean | null
  /** Browse sounds can open this instrument's sounds. */
  canBrowse: boolean
  /** + New sound is offered (a plugin that's installed); the label says the target part. */
  newSound: { part: string } | null
  /** Edit… is offered (plugins); enabled when a part plays it now with a window. */
  edit: { enabled: boolean } | null
  /** Replace… (a missing plugin): enabled when a part plays it now. */
  replace: { enabled: boolean } | null
  /** Show racks (a missing plugin): opens Racks with Needs attention on. */
  showRacks: boolean
}

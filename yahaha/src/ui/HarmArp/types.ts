/**
 * The Harm/Arp page's data and changes (docs/specs/push/Harmony.md and its Harmony-Arp variant).
 * The library's HarmArp component takes `HarmArpData` and reports each change as a
 * `HarmArpChange`; the app's wiring (panels/harmony) builds the data from the engine's state and
 * turns each change into a command. No API types here: the library imports nothing from the app.
 */

/** Which list a category belongs to: the Keyboard Harmony types or the arpeggio patterns. */
export type HarmArpGroup = 'harmony' | 'arpeggio'

/** The settings the selected type has (Harmony.md › Settings column). */
export type HarmArpKind = 'harmony' | 'echo' | 'multi' | 'arpeggio'

/** Echo, Tremolo and Trill's repeat rate. */
export type HarmArpSpeed = '1/4' | '1/6' | '1/8' | '1/12' | '1/16' | '1/32'

/** Which Right parts sound the effect. */
export type HarmArpAssign = 'auto' | 'multi' | 'right1' | 'right2' | 'right3'

/** Where an arpeggio starts: at once, or on the nearest eighth or sixteenth. */
export type HarmArpQuantize = 'off' | 'eighth' | 'sixteenth'

/** Where the arpeggio's loudness comes from: the pattern, the keys as played, or one value. */
export type HarmArpVelocity = 'original' | 'thru' | 'fixed'

/** A category tab: what the grid shows. Browsing one sends nothing (HA-D1). */
export interface HarmArpCategory {
  group: HarmArpGroup
  /** "Harmony", "Echo", "Multi Assign", "Up & Down", … */
  name: string
}

/** One category tab with its size. */
export interface HarmArpCategoryTab extends HarmArpCategory {
  /** How many types or patterns it lists. */
  count: number
  /** The selected type is in it. */
  holdsSelected: boolean
}

/** One type or pattern in the grid. */
export interface HarmArpItem {
  /** Its index in its list (`harmonyTypes` or `arpPatterns`): what a pick carries. */
  index: number
  name: string
}

/** Everything the page shows. */
export interface HarmArpData {
  /** The HARMONY/ARPEGGIO switch. */
  on: boolean
  /** The selected type's name; empty: none yet (drawn "—"). */
  typeName: string
  /** The header's caption after the name: "Echo", "Arpeggio · Up & Down", or empty. */
  caption: string
  /** Which settings the selected type has. */
  kind: HarmArpKind
  /** The three Harmony tabs (Harmony, Echo, Multi Assign). */
  harmonyTabs: HarmArpCategoryTab[]
  /** One tab per arpeggio category, in list order; empty while the library is loading. */
  arpTabs: HarmArpCategoryTab[]
  /** The category the grid shows; null: none (an arpeggio with no pattern list yet). */
  viewed: HarmArpCategory | null
  /** The grid: the viewed category's types or patterns. */
  items: HarmArpItem[]
  /** The selected item's `index` when it is in the viewed category, else null. */
  selected: number | null
  assign: HarmArpAssign
  /** 0-127. */
  volume: number
  /** The Rack knob page's knob (1-8) mapped to the Harmony volume; null: none. */
  volumeKnob: number | null
  speed: HarmArpSpeed
  chordNoteOnly: boolean
  /** Minimum velocity, 1-127. */
  touchLimit: number
  arp: {
    quantize: HarmArpQuantize
    hold: boolean
    /** The Arpeggio Hold pedal's switch. */
    pedalHold: boolean
    velocity: HarmArpVelocity
    /** 1-127, used when `velocity` is `fixed`. */
    fixedVelocity: number
    keepKeyOn: boolean
  }
}

/** A change the page asks for; the wiring turns each into one command. */
export type HarmArpChange =
  | { type: 'on'; on: boolean }
  /** A type (`harmony`) or pattern (`arpeggio`), by its index in its list. */
  | { type: 'pick'; group: HarmArpGroup; index: number }
  | { type: 'assign'; assign: HarmArpAssign }
  | { type: 'volume'; volume: number }
  | { type: 'touchLimit'; velocity: number }
  | { type: 'speed'; speed: HarmArpSpeed }
  | { type: 'chordNoteOnly'; on: boolean }
  | { type: 'quantize'; quantize: HarmArpQuantize }
  | { type: 'hold'; on: boolean }
  | { type: 'pedalHold'; on: boolean }
  /** `velocity` (1-127) is the fixed value, sent with every mode. */
  | { type: 'velocity'; mode: HarmArpVelocity; velocity: number }
  | { type: 'keepKeyOn'; on: boolean }

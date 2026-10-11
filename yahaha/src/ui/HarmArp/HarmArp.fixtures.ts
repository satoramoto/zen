import type { HarmArpCategory, HarmArpCategoryTab, HarmArpData, HarmArpGroup, HarmArpItem } from './types'

/** The Keyboard Harmony types, Data List order (as the dev mock's `HARMONY_TYPES`). */
export const harmonyTypes: { name: string; category: string }[] = [
  ...[
    'Standard Duet 1', 'Standard Duet 2', 'Standard Trio', 'Full Chord', 'Rock Duet', 'Country Duet 1',
    'Country Duet 2', 'Country Trio', 'Block', '4-Way Close 1', '4-Way Close 2', '4-Way Close 3',
    '4-Way Close 4', '4-Way Open 1', '4-Way Open 2', '4-Way Open 3', '1+5', 'Octave', 'Strum', 'Multi Assign',
  ].map((name) => ({ name, category: 'Harmony' })),
  ...['Echo', 'Tremolo', 'Trill'].map((name) => ({ name, category: 'Echo' })),
]

/** yahaha's own arpeggio patterns, by category (as the dev mock's `ARP_PATTERNS`). */
export const arpPatterns: { name: string; category: string }[] = Object.entries({
  'Up & Down': ['Climb 16', 'Fall 16', 'Peak 8', 'Valley Triplet', 'Sky Ladder 32'],
  Random: ['Dice 16', 'Scatter Octaves'],
  'As Played': ['Echo Order 8', 'Shuffle Order 16'],
  'Chord Stab': ['Four Stabs', 'Offbeat Pump', 'Syncopated Hits', 'Gated Pad 16'],
  'Broken Chord': ['Alberti 16', 'Waltz Broken', 'Rolling Eights', 'Thumb Pick'],
  Guitar: ['Strum Quarters', 'Campfire Strum', 'Muted Sixteens'],
  Sequence: ['Octave Pulse', 'Root Fifth Seq', 'Pluck Line'],
}).flatMap(([category, names]) => names.map((name) => ({ name, category })))

/** What is selected, for building a fixture: the list and the index in it. */
export interface HarmArpPick {
  group: HarmArpGroup
  index: number
}

const harmonyCategoryOf = (t: { name: string; category: string }) =>
  t.name === 'Multi Assign' ? 'Multi Assign' : t.category === 'Echo' ? 'Echo' : 'Harmony'

/** The grid of one category, from the fixture lists (the app's wiring has the real rules). */
export function itemsIn(category: HarmArpCategory, loaded = true): HarmArpItem[] {
  if (!loaded) return []
  const list = category.group === 'harmony' ? harmonyTypes : arpPatterns
  const of = category.group === 'harmony' ? harmonyCategoryOf : (t: { category: string }) => t.category
  return list.flatMap((t, index) => (of(t) === category.name ? [{ index, name: t.name }] : []))
}

/** The category the picked type is in. */
export function categoryOf(pick: HarmArpPick): HarmArpCategory {
  if (pick.group === 'arpeggio') return { group: 'arpeggio', name: arpPatterns[pick.index].category }
  return { group: 'harmony', name: harmonyCategoryOf(harmonyTypes[pick.index]) }
}

/**
 * A page's data from a pick and the category viewed (null: the pick's), with the board's settings
 * unless `settings` replaces them. `loaded: false` is the moment before the library's lists arrive.
 */
export function harmArpFixture(
  pick: HarmArpPick,
  viewed: HarmArpCategory | null = null,
  settings: Partial<HarmArpData> = {},
  loaded = true,
): HarmArpData {
  const type = pick.group === 'harmony' ? harmonyTypes[pick.index] : arpPatterns[pick.index]
  const own = categoryOf(pick)
  const shown = viewed ?? own
  const kind =
    pick.group === 'arpeggio' ? 'arpeggio' : own.name === 'Multi Assign' ? 'multi' : own.name === 'Echo' ? 'echo' : 'harmony'
  const tab = (group: HarmArpGroup, name: string): HarmArpCategoryTab => ({
    group,
    name,
    count: itemsIn({ group, name }).length,
    holdsSelected: own.group === group && own.name === name,
  })
  const arpNames = loaded ? [...new Set(arpPatterns.map((p) => p.category))] : []
  const items = itemsIn(shown, loaded)
  const selected = shown.group === pick.group && items.some((i) => i.index === pick.index) ? pick.index : null
  return {
    on: true,
    typeName: type.name,
    caption: kind === 'echo' ? 'Echo' : kind === 'arpeggio' ? `Arpeggio · ${type.category}` : '',
    kind,
    harmonyTabs: ['Harmony', 'Echo', 'Multi Assign'].map((n) => tab('harmony', n)),
    arpTabs: arpNames.map((n) => tab('arpeggio', n)),
    viewed: shown.group === 'arpeggio' && !arpNames.includes(shown.name) ? null : shown,
    items,
    selected,
    assign: 'auto',
    volume: 100,
    volumeKnob: 5,
    speed: '1/8',
    chordNoteOnly: false,
    touchLimit: 1,
    arp: { quantize: 'off', hold: false, pedalHold: false, velocity: 'original', fixedVelocity: 100, keepKeyOn: false },
    ...settings,
  }
}

/** The board (Harmony-Dark): Standard Duet 1, on; Assign Auto, Volume 100 on knob 5, Touch limit 1. */
export const harmArpBoard = harmArpFixture({ group: 'harmony', index: 0 })

/** Echo selected: the Echo tab, a grid of three, Speed 1/8. */
export const harmArpEcho = harmArpFixture({ group: 'harmony', index: 20 }, null, { assign: 'right2' })

/** Multi Assign selected: no settings, a note says so. */
export const harmArpMulti = harmArpFixture({ group: 'harmony', index: 19 })

/** The Harmony-Arp board: Climb 16 (Up & Down), Hold on, Quantize 1/16, a fixed velocity of 96. */
export const harmArpArpeggio = harmArpFixture({ group: 'arpeggio', index: 0 }, null, {
  arp: { quantize: 'sixteenth', hold: true, pedalHold: false, velocity: 'fixed', fixedVelocity: 96, keepKeyOn: false },
})

/** Browsing: Standard Duet 1 is selected, the Chord Stab patterns are shown (no block in the grid). */
export const harmArpBrowsing = harmArpFixture({ group: 'harmony', index: 0 }, { group: 'arpeggio', name: 'Chord Stab' })

/** Switched off, before the library's lists arrive, with a rack map that has no Harmony volume knob. */
export const harmArpLoading = harmArpFixture({ group: 'harmony', index: 0 }, null, { on: false, volumeKnob: null }, false)

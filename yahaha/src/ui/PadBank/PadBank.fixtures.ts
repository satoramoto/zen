import type { LegendItem, PadItem } from './types'

const NB = ' '

/** The board's Sections bank (1 of 5): Main B playing, Main C next, Start / Stop running. */
export const sectionPads: PadItem[] = [
  { label: `Intro${NB}I`, family: 'intro', state: 'idle', tip: 'section.intro1' },
  { label: `Intro${NB}II`, family: 'intro', state: 'idle', tip: 'section.intro2' },
  { label: `Intro${NB}III`, family: 'intro', state: 'dark', tip: 'section.intro3', name: 'Intro III (not in this style)' },
  { label: 'Sync Start', family: 'util', state: 'idle', tip: 'transport.sync_start' },
  { label: `Ending${NB}I`, family: 'ending', state: 'idle', tip: 'section.ending1' },
  { label: `Ending${NB}II`, family: 'ending', state: 'idle', tip: 'section.ending2' },
  { label: `Ending${NB}III`, family: 'ending', state: 'dark', tip: 'section.ending3', name: 'Ending III (not in this style)' },
  { label: 'Auto Fill', family: 'util', state: 'idle', tip: 'transport.auto_fill' },
  { label: `Main${NB}A`, family: 'main', state: 'idle', tip: 'section.main_a' },
  { label: `Main${NB}B`, family: 'main', state: 'playing', tip: 'section.main_b', name: 'Main B, playing' },
  { label: `Main${NB}C`, family: 'main', state: 'next', tip: 'section.main_c', name: 'Main C, queued after bar 4 (flashing)' },
  { label: `Main${NB}D`, family: 'main', state: 'idle', tip: 'section.main_d' },
  { label: 'Break', family: 'brk', state: 'idle', tip: 'section.break' },
  { label: 'Tap', family: 'util', state: 'idle', tip: 'tempo.tap' },
  { label: 'Sync Stop', family: 'util', state: 'idle', tip: 'transport.sync_stop' },
  {
    label: 'Start / Stop',
    family: 'start',
    state: 'running',
    name: 'Start / Stop, running (pad 16; the transport Start / Stop is the same control)',
    tip: 'transport.start_stop',
  },
]

/** The Sections bank's legend. */
export const sectionLegend: LegendItem[] = [
  { label: 'Intro', hue: 'intro' },
  { label: 'Main', hue: 'main' },
  { label: 'Ending', hue: 'ending' },
  { label: 'Break', hue: 'brk' },
  { label: 'Fill', hue: 'fill' },
]

/** The pad banks, one header tab each. */
export const padBanks = ['Sections', 'Quick Racks', 'Chord', 'Multi Pads', 'Setup']

/** The board's bank name and its old counter (PadBank no longer draws the counter). */
export const sectionBank = { name: 'Sections', count: '1/5' }

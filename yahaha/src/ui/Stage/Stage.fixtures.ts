import type { ComponentProps } from 'svelte'
import { boardAppBar } from '../AppBar/AppBar.fixtures'
import { faderPageTabs, layerTabs } from '../ChosenTabs/ChosenTabs.fixtures'
import { displayBoard, displayStopped } from '../Display/Display.fixtures'
import { functionLamps, panelStrips, partLamps, reverbStrips } from '../FaderBank/FaderBank.fixtures'
import { boardKeys } from '../Keys/Keys.fixtures'
import { knobPages, styleKnobs } from '../KnobBank/KnobBank.fixtures'
import type { KnobItem } from '../KnobBank/types'
import { padBanks, sectionPads } from '../PadBank/PadBank.fixtures'
import type { LegendItem, PadItem } from '../PadBank/types'
import { sectionRowBoard } from '../SectionRow/SectionRow.fixtures'
import type Stage from './Stage.svelte'

/** The dark board (Stage-Dark.dc.html): Sunday Drive Pop, Am7 in Main B → Main C, running at 104. */
export const stageBoard = {
  appBar: boardAppBar,
  sectionRow: { ...sectionRowBoard, running: true },
  display: displayBoard,
  faders: {
    strips: panelStrips,
    pageTabs: faderPageTabs,
    page: 'panel',
    layerTabs,
    layer: 'volume',
    partLamps,
    functionLamps,
  },
  knobs: { knobs: styleKnobs, pages: knobPages, page: 0 },
  pads: {
    pads: sectionPads,
    banks: padBanks,
    bank: 0,
    // No hue legend: at two fifths the Pads header has no room beside the bank tabs, and every
    // section pad names its section.
    legend: [],
    lit: true,
  },
  status: { text: null },
  keys: boardKeys,
} satisfies ComponentProps<typeof Stage>

/** Stopped with a style queued, the faders on the Reverb layer, a message on the status line, nothing held. */
export const stageStopped = {
  ...stageBoard,
  sectionRow: { ...sectionRowBoard, running: false },
  display: displayStopped,
  // Main A picked, nothing queued, Start / Stop idle (Stage.md › States, Stopped).
  pads: {
    ...stageBoard.pads,
    pads: sectionPads.map((pad, i): PadItem => {
      if (pad.family === 'start') return { ...pad, state: 'idle', name: undefined }
      if (pad.family !== 'main') return pad
      return { ...pad, state: i === 8 ? 'playing' : 'idle', name: i === 8 ? 'Main A, playing' : undefined }
    }),
  },
  faders: { ...stageBoard.faders, layer: 'reverb', strips: reverbStrips },
  status: { text: 'Style queued: it starts at the next Start', seq: 1 },
  keys: { ...boardKeys, heldLeft: [], heldRight: [] },
} satisfies ComponentProps<typeof Stage>


/**
 * The Playground's fader values per layer: Vol has all nine strips, the other layers strips 1–4
 * (the parts). Pan is 0–127 with 64 centre.
 */
export const stageLayerValues: Record<string, number[]> = {
  volume: panelStrips.map((strip) => strip.level),
  pan: [64, 40, 88, 64],
  reverb: reverbStrips.slice(0, 4).map((strip) => strip.level),
  chorus: [12, 0, 0, 8],
  delay: [0, 0, 0, 0],
}

const level = (label: string, code: string, value: number): KnobItem => ({
  label,
  code,
  value: `${value}`,
  fraction: value / 127,
})
const tempo: KnobItem = { label: 'Tempo', code: 'Tempo', value: '104', fraction: 0.27 }
const unused: KnobItem = { label: '---', code: '', value: '', fraction: 0, unused: true }
/** One effect page: the four parts' sends to it on knobs 1–4, its settings, its return on knob 8. */
const sends = (fx: string, code: string, settings: KnobItem[], ret: number): KnobItem[] => [
  level('Right 1', `R1${code}`, 40),
  level('Right 2', `R2${code}`, 20),
  level('Right 3', `R3${code}`, 0),
  level('Left', `L${code}`, 12),
  ...settings,
  ...Array.from({ length: 3 - settings.length }, () => unused),
  level(`${fx} rtn`, `${code}Rtn`, ret),
]

/** The Playground's eight knobs on each knob page, in `knobPages` order (knobs.page tooltip). */
export const stageKnobPages: KnobItem[][] = [
  styleKnobs,
  [
    level('Right 1', 'R1Vol', 100),
    level('Right 2', 'R2Vol', 90),
    level('Right 3', 'R3Vol', 80),
    level('Left', 'LVol', 96),
    level('Harmony', 'HarmVol', 70),
    level('Metronome', 'MetVol', 64),
    unused,
    tempo,
  ],
  [
    { label: 'Right 1', code: 'R1Pan', value: 'C', fraction: 0.5 },
    { label: 'Right 2', code: 'R2Pan', value: 'L24', fraction: 0.31 },
    { label: 'Right 3', code: 'R3Pan', value: 'R24', fraction: 0.69 },
    { label: 'Left', code: 'LPan', value: 'C', fraction: 0.5 },
    level('Reverb rtn', 'RevRtn', 64),
    level('Chorus rtn', 'ChoRtn', 64),
    level('Delay rtn', 'DlyRtn', 64),
    tempo,
  ],
  sends('Reverb', 'Rev', [level('Time', 'RevTime', 70), level('Pre-delay', 'RevPre', 20), level('Tone', 'RevTone', 64)], 64),
  sends('Chorus', 'Cho', [level('Rate', 'ChoRate', 40), level('Depth', 'ChoDep', 60)], 64),
  sends('Delay', 'Dly', [level('Time', 'DlyTime', 50), level('Feedback', 'DlyFb', 30), level('Tone', 'DlyTone', 64)], 64),
]

const NB = ' '
const util = (label: string, state: PadItem['state'] = 'idle'): PadItem => ({ label, family: 'util', state })
const dark = (label: string): PadItem => ({ label, family: 'util', state: 'dark' })

/**
 * The Playground's sixteen pads on each pad bank, in `padBanks` order, with each bank's legend.
 * Sections is the board's; the others are sketches of the pad pages (padpage.* tooltips), drawn
 * neutral since they have no section hue.
 */
export const stagePadBanks: { pads: PadItem[]; legend: LegendItem[] }[] = [
  { pads: sectionPads, legend: [] },
  {
    pads: [
      ...Array.from({ length: 8 }, (_, i) => util(`Rack${NB}${i + 1}`, i === 0 ? 'playing' : i < 5 ? 'idle' : 'dark')),
      util(`OTS${NB}1`, 'playing'),
      util(`OTS${NB}2`),
      util(`OTS${NB}3`),
      util(`OTS${NB}4`),
      util('Bank −'),
      util('Bank +'),
      util('Store'),
      dark('—'),
    ],
    legend: [],
  },
  {
    pads: [
      ...Array.from({ length: 8 }, () => dark('—')),
      util('Manual Bass'),
      util('Stop ACMP'),
      util('Split −'),
      util('Split +'),
      util('Transp −'),
      util('Transp +'),
      util('Transp 0'),
      util('Retrigger'),
    ],
    legend: [],
  },
  {
    pads: [
      util(`Pad${NB}1`, 'playing'),
      util(`Pad${NB}2`),
      util(`Pad${NB}3`),
      util(`Pad${NB}4`),
      util('Stop'),
      dark('—'),
      dark('—'),
      dark('—'),
      util(`Sync${NB}1`),
      util(`Sync${NB}2`),
      util(`Sync${NB}3`),
      util(`Sync${NB}4`),
      util(`Stop${NB}1`),
      util(`Stop${NB}2`),
      util(`Stop${NB}3`),
      util(`Stop${NB}4`),
    ],
    legend: [],
  },
  {
    pads: [
      util('Single', 'playing'),
      util('Fingered'),
      util('On Bass'),
      util('Multi'),
      util('AI Full'),
      util('Upper'),
      dark('—'),
      dark('—'),
      util('OTS Link'),
      util('Stop Style', 'playing'),
      util('Stop Fixed'),
      dark('—'),
      dark('—'),
      dark('—'),
      dark('—'),
      dark('—'),
    ],
    legend: [],
  },
]

/** The styles the Playground's ‹ › step through (the waltz shows three beat segments). */
export const stageStyles = [
  { styleName: 'Sunday Drive Pop', category: 'Pop & Rock', timeSignature: '4/4' },
  { styleName: 'Coastal Highway', category: 'Rock', timeSignature: '4/4' },
  { styleName: 'Ballad Night', category: 'Ballad', timeSignature: '4/4' },
  { styleName: 'Waltz for Two', category: 'Ballroom', timeSignature: '3/4' },
]

/** The sounds a part's row steps through in the Playground. */
export const stageSounds = ['Stage Grand', 'Warm Rhodes', 'Silk Strings', 'Brass Section', 'Soft Pad', 'Finger Bass']

/** The style's own tempo, which Style tempo goes back to. */
export const stageStyleTempo = 104

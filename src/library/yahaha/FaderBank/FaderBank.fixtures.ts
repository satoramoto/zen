// Ported from yahaha/src/ui/FaderBank/FaderBank.fixtures.ts. Added: each live strip's `sound`.
// Changed: Left plays Finger Bass, as the board shows (the original's fixture repeated Silk Strings).
// The stories as plain props (`faderBankStories`): FaderBank.stories.tsx draws them with React's or
// Svelte's renderer, and the tree snapshot draws every instance; the Forms story is a view tree
// (`faderBankFormsSample`).
import { defineFixtures, instances, type FixtureProps } from '../../fixtures'
import type { TabItemModel } from '../../layout/Tabs.model'
import { component, h, styleText, type Node } from '../../view/Tree.model'
import type { BankLamp, FaderBankRegionModelProps, FaderStrip } from './FaderBank.model'

type TabItem = TabItemModel<string>

/** The band header's fader page tabs (the master button). */
export const faderPageTabs: TabItem[] = [
  { id: 'panel', label: 'Panel', tip: 'mixer.page' },
  { id: 'style', label: 'Style', tip: 'mixer.page' },
]

/** The band header's fader layer tabs. */
export const layerTabs: TabItem[] = [
  { id: 'volume', label: 'Vol', name: 'Volume', tip: 'mixer.layer' },
  { id: 'pan', label: 'Pan', tip: 'mixer.layer' },
  { id: 'reverb', label: 'Reverb', name: 'Reverb send', tip: 'mixer.layer' },
  { id: 'chorus', label: 'Chorus', name: 'Chorus send', tip: 'mixer.layer' },
  { id: 'delay', label: 'Delay', name: 'Delay send', tip: 'mixer.layer' },
]

/** The board's nine strips on the Panel page, Vol layer (Stage-Dark.dc.html). */
export const panelStrips: FaderStrip[] = [
  {
    id: 'right1',
    tag: 'Right 1',
    hue: 'r1',
    kind: 'part',
    value: '90',
    level: 90,
    meter: 0.62,
    meter2: 0.58,
    peak: 0.7,
    sound: 'Stage Grand',
    faderName: 'Right 1 · Stage Grand, level 90',
    openName: 'Right 1, Stage Grand: open Channel',
    tip: 'mixer.panel.right1',
    openTip: 'mixer.strip.select',
    soundName: 'Right 1 sound: Stage Grand, choose a sound',
    soundTip: 'mixer.strip.sound',
  },
  {
    id: 'right2',
    tag: 'Right 2',
    hue: 'r2',
    kind: 'part',
    value: '72',
    level: 72,
    meter: 0.45,
    meter2: 0.42,
    peak: 0.55,
    away: 50,
    edited: true,
    sound: 'Silk Strings',
    faderName: 'Right 2 · Silk Strings, level 72, hardware fader away (soft takeover)',
    openName: 'Right 2, Silk Strings, edited: open Channel',
    tip: 'mixer.panel.right2',
    openTip: 'mixer.strip.select',
    soundTip: 'mixer.strip.sound',
  },
  {
    id: 'right3',
    tag: 'Right 3',
    hue: 'r3',
    kind: 'off',
    value: '64',
    level: 64,
    meter: 0,
    meter2: 0,
    peak: 0,
    missing: true,
    sound: 'Brass Section',
    faderName: 'Right 3 · Brass Section, level 64, off',
    openName: 'Right 3, Brass Section, plugin missing: open Channel',
    tip: 'mixer.panel.right3',
    openTip: 'mixer.strip.select',
    soundTip: 'mixer.strip.sound',
  },
  {
    id: 'left',
    tag: 'Left',
    hue: 'l',
    kind: 'part',
    value: '80',
    level: 80,
    meter: 0.5,
    meter2: 0.47,
    peak: 0.6,
    sound: 'Finger Bass',
    faderName: 'Left · Finger Bass, level 80',
    openName: 'Left, Finger Bass: open Channel',
    tip: 'mixer.panel.left',
    openTip: 'mixer.strip.select',
    soundTip: 'mixer.strip.sound',
  },
  {
    id: 'style',
    tag: 'Style',
    hue: 'a',
    kind: 'group',
    value: '100',
    level: 100,
    meter: 0.7,
    meter2: 0.65,
    peak: 0.78,
    faderName: 'Style volume, level 100',
    openName: 'Style volume: open the Style fader page',
    tip: 'mixer.style_level',
    openTip: 'mixer.page',
  },
  {
    id: 'multiPad',
    tag: 'Multi Pad',
    hue: 't2',
    kind: 'group',
    value: '90',
    level: 90,
    meter: 0,
    meter2: 0,
    peak: 0.12,
    faderName: 'Multi Pad volume, level 90',
    openName: 'Multi Pad volume: open Multi Pads',
    tip: 'mixer.pad_level',
    openTip: 'nav.multipad',
  },
  {
    id: 'fader7',
    tag: '—',
    hue: 't',
    kind: 'parked',
    value: '',
    level: 0,
    meter: 0,
    meter2: 0,
    peak: 0,
    faderName: 'Fader 7 unused',
    tip: 'launchkey.fader_unused',
  },
  {
    id: 'fader8',
    tag: '—',
    hue: 't',
    kind: 'parked',
    value: '',
    level: 0,
    meter: 0,
    meter2: 0,
    peak: 0,
    faderName: 'Fader 8 unused',
    tip: 'launchkey.fader_unused',
  },
  {
    id: 'master',
    tag: 'Master',
    hue: 't',
    kind: 'master',
    value: '100',
    level: 100,
    meter: 0.72,
    meter2: 0.67,
    peak: 0.8,
    faderName: 'Master, level 100',
    openName: 'Master: open Effects, master compressor and EQ',
    tip: 'mixer.master',
    openTip: 'fx.master_edit',
  },
]

/** The board's note for other layers: strips 1–4 carry the layer word and its value ("Rev 40"). */
const REVERB = [40, 12, 0, 20]

/** The same strips on the Reverb layer. */
export const reverbStrips: FaderStrip[] = panelStrips.map((strip, i) =>
  i < 4
    ? {
        ...strip,
        value: `Rev ${REVERB[i]}`,
        level: REVERB[i],
        away: undefined,
        faderName: `${strip.faderName.split(',')[0]}, Reverb ${REVERB[i]}`,
        tip: 'mixer.part.reverb',
      }
    : strip,
)

/** The part lamps under faders 1–4 on the board: Right 3 off, the rest on. */
export const partLamps: BankLamp[] = [
  { id: 'right1', label: 'On', on: true, hue: 'r1', long: true, tip: 'part.right1.on', name: 'Right 1 on. Long press: swap mode (knobs edit this part). Shift: open Channel' },
  { id: 'right2', label: 'On', on: true, hue: 'r2', long: true, tip: 'part.right2.on', name: 'Right 2 on. Long press: swap mode (knobs edit this part). Shift: open Channel' },
  { id: 'right3', label: 'Off', on: false, hue: 'r3', long: true, tip: 'part.right3.on', name: 'Right 3 off. Long press: swap mode (knobs edit this part). Shift: open Channel' },
  { id: 'left', label: 'On', on: true, hue: 'l', long: true, tip: 'part.left.on', name: 'Left on. Long press: swap mode (knobs edit this part). Shift: open Channel' },
]

/** The Launchkey function lamps under faders 5–8 on the board (Round 2): Sound latched, the rest off. */
export const functionLamps: BankLamp[] = [
  { id: 'harmArp', label: 'Harm/Arp', on: false, hue: 't', tip: 'harmony.switch', name: 'Harmony/Arpeggio on/off' },
  {
    id: 'sound',
    label: 'Sound',
    on: true,
    hue: 't',
    long: true,
    tip: 'launchkey.sound',
    name: 'Sound: hold and the pads become Quick Racks. A click latches it until the next pad tap; click again or press fader button 6 to close',
  },
  { id: 'leftHold', label: 'L Hold', on: false, hue: 't', tip: 'detection.left_hold', name: 'Left Hold on/off' },
  { id: 'looper', label: 'Looper', on: false, hue: 't', long: true, tip: 'looper.rec', name: 'Chord Looper on/off. Long press: Loop rec' },
]

/** Added: the Style page, where faders 1–8 are the style's eight parts (neutral: they are not keyboard parts) and 9 stays Master. */
const STYLE_PARTS: [string, string, number][] = [
  ['rhythm1', 'Rhythm 1', 100],
  ['rhythm2', 'Rhythm 2', 92],
  ['bass', 'Bass', 96],
  ['chord1', 'Chord 1', 80],
  ['chord2', 'Chord 2', 74],
  ['pad', 'Pad', 64],
  ['phrase1', 'Phrase 1', 70],
  ['phrase2', 'Phrase 2', 0],
]

export const styleStrips: FaderStrip[] = [
  ...STYLE_PARTS.map(([id, tag, level], i): FaderStrip => ({
    id,
    tag,
    hue: 'a',
    kind: 'group',
    value: String(level),
    level,
    meter: level === 0 ? 0 : 0.3 + (i % 3) * 0.12,
    meter2: level === 0 ? 0 : 0.28 + (i % 3) * 0.12,
    peak: level === 0 ? 0 : 0.5 + (i % 3) * 0.1,
    faderName: `Style ${tag}, level ${level}`,
    openName: `Style ${tag}: open Channel`,
    openTip: 'mixer.strip.select',
  })),
  panelStrips[panelStrips.length - 1],
]

/** The mixer's region on a 1440×900 Stage (the board's band: 702×368). */
export const BOARD_REGION = { width: 702, height: 368 }
/** The same region on a 1217×752 Stage. */
export const SMALL_REGION = { width: 593, height: 311 }
/** The Forms story's boxes, each the size of its form's least at the compact scale (the body plus a 12 px plate inset and a 36 px head). */
export const FORM_BOXES = { tall: { width: 565, height: 354 }, short: { width: 549, height: 266 } } as const

/** The controls, the same in both Storybooks. */
export const faderBankArgTypes = {
  strips: { control: 'object' },
  pageTabs: { control: 'object' },
  page: { control: 'select', options: faderPageTabs.map((tab) => tab.id) },
  layerTabs: { control: 'object' },
  layer: { control: 'select', options: layerTabs.map((tab) => tab.id) },
  partLamps: { control: 'object' },
  functionLamps: { control: 'object' },
} as const

/** Every story's base: the board, Panel page, Vol layer. */
export const boardArgs: FixtureProps<FaderBankRegionModelProps> = {
  strips: panelStrips,
  pageTabs: faderPageTabs,
  page: 'panel',
  layerTabs,
  layer: 'volume',
  partLamps,
  functionLamps,
}

export const faderBankStories = defineFixtures<FaderBankRegionModelProps>()({
  Board: { args: boardArgs },
  PageButtonHold: { args: boardArgs },
  ReverbLayer: { args: { ...boardArgs, layer: 'reverb', strips: reverbStrips } },
  SmallStage: { args: boardArgs },
  Forms: {
    args: boardArgs,
    items: [
      { name: 'Mixer, tall', form: 'tall' },
      { name: 'Mixer, short', form: 'short' },
    ],
  },
  StylePage: { args: { ...boardArgs, page: 'style', strips: styleStrips } },
  TakeoverBothWays: {
    args: {
      ...boardArgs,
      strips: panelStrips.map((strip) =>
        strip.id === 'right2' ? { ...strip, away: 110 } : strip.id === 'left' ? { ...strip, away: 20 } : strip,
      ),
    },
  },
  AllPartsOff: {
    args: {
      ...boardArgs,
      strips: panelStrips.map((strip): FaderStrip =>
        strip.kind === 'part' || strip.kind === 'off' ? { ...strip, kind: 'off', away: undefined, meter: 0, meter2: 0, peak: 0 } : strip,
      ),
      partLamps: partLamps.map((lamp): BankLamp => ({ ...lamp, on: false, label: 'Off' })),
    },
  },
  // A function lamp in the `ok` hue (running / success): Harm/Arp lit in `--success`.
  LampOk: {
    args: {
      ...boardArgs,
      functionLamps: functionLamps.map((lamp): BankLamp => (lamp.id === 'harmArp' ? { ...lamp, on: true, hue: 'ok', name: 'Harmony/Arpeggio on (running)' } : lamp)),
    },
  },
  Live: { args: boardArgs },
})

/** The region's callbacks, each passed as the story arg of the same name (`handlers` = the args). */
const REGION_CALLBACKS = [
  'onChoosePage',
  'onChooseLayer',
  'onLevel',
  'onOpen',
  'onLamp',
  'onLampLong',
  'onLampRelease',
  'onPageButton',
  'onPageLong',
  'onPageRelease',
  'tipAction',
] as const

/**
 * The Forms story as a view tree: one FaderBankRegion per form (the Forms items), each in a box the
 * size of its form's least (`FORM_BOXES`), in a wrapping row. Its callbacks are the story's args by
 * name.
 */
export const faderBankFormsSample = <L>({ strips, pageTabs, page, layerTabs, layer, partLamps, functionLamps }: FaderBankRegionModelProps<L>): Node =>
  h(
    'div',
    { style: styleText({ display: 'flex', 'flex-wrap': 'wrap', gap: 'var(--space-5)', 'align-items': 'flex-start' }) },
    instances(faderBankStories.Forms).map(({ name, form = 'tall' }) =>
      h(
        'div',
        { style: styleText({ display: 'grid', width: `${FORM_BOXES[form].width}px`, height: `${FORM_BOXES[form].height}px` }) },
        component(
          'FaderBankRegion',
          { strips, pageTabs, page, layerTabs, layer, partLamps, functionLamps, name, form },
          { on: Object.fromEntries(REGION_CALLBACKS.map((key) => [key, key])) },
        ),
      ),
    ),
  )

// Ported from yahaha/src/ui/FaderBank/FaderBank.fixtures.ts. Added: each live strip's `sound`.
// Changed: Left plays Finger Bass, as the board shows (the original's fixture repeated Silk Strings).
import type { BankLamp, FaderStrip } from './FaderBank'

/** The band header's tabs: the fader page (Panel, Style) and the layer (Vol … Delay). */
export { faderPageTabs, layerTabs } from '../ChosenTabs/ChosenTabs.fixtures'

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

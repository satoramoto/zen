/**
 * The Pedals page's data: the board's three pedals and four parts, and the assignable functions as
 * the picker groups them. The ids, names and kinds are the engine's table
 * (`app/src/lib/api/assignable-functions.json`, the functions it offers), written out here because
 * the UI library imports nothing from the app.
 */
import type { PedalFunction, PedalRow, PedalsPageData, PartReach } from '../Settings/types'

type Kind = 'switch' | 'trigger' | 'continuous'

/** A group of functions from `[id, name, kind]` rows: a switch takes a Control type, Pitch Bend a Range. */
function group(name: string, rows: [string, string, Kind][]): { group: string; items: PedalFunction[] } {
  return {
    group: name,
    items: rows.map(([id, label, kind]) => ({ id, label, switchKind: kind === 'switch', bend: id === 'pitchBend' })),
  }
}

/** The functions a pedal can run, grouped and ordered as the engine's table lists them. */
export const pedalFunctions: PedalsPageData['functions'] = [
  group('Overall', [
    ['none', 'No Assign', 'trigger'],
    ['tempoUp', 'Tempo +', 'trigger'],
    ['tempoDown', 'Tempo −', 'trigger'],
    ['tapTempo', 'Tap Tempo', 'trigger'],
    ['transposeUp', 'Transpose +', 'trigger'],
    ['transposeDown', 'Transpose −', 'trigger'],
    ['right1OnOff', 'Right 1 On/Off', 'trigger'],
    ['right2OnOff', 'Right 2 On/Off', 'trigger'],
    ['right3OnOff', 'Right 3 On/Off', 'trigger'],
    ['leftOnOff', 'Left On/Off', 'trigger'],
  ]),
  group('Voice', [
    ['sustain', 'Sustain', 'switch'],
    ['sostenuto', 'Sostenuto', 'switch'],
    ['soft', 'Soft', 'switch'],
    ['modulation', 'Modulation', 'continuous'],
    ['pitchBend', 'Pitch Bend', 'continuous'],
    ['kbdHarmonyArp', 'Kbd Harmony/Arpeggio On/Off', 'switch'],
    ['arpHold', 'Arpeggio Hold', 'switch'],
    ['leftHold', 'Left Hold On/Off', 'switch'],
    ['rotaryFast', 'Organ Rotary Slow/Fast', 'switch'],
  ]),
  group('Style', [
    ['startStop', 'Style Start/Stop', 'trigger'],
    ['syncStart', 'Synchro Start On/Off', 'trigger'],
    ['syncStop', 'Synchro Stop On/Off', 'trigger'],
    ['intro1', 'Intro 1', 'trigger'],
    ['intro2', 'Intro 2', 'trigger'],
    ['intro3', 'Intro 3', 'trigger'],
    ['mainA', 'Main A', 'trigger'],
    ['mainB', 'Main B', 'trigger'],
    ['mainC', 'Main C', 'trigger'],
    ['mainD', 'Main D', 'trigger'],
    ['fillDown', 'Fill Down', 'trigger'],
    ['fillSelf', 'Fill Self', 'trigger'],
    ['fillBreak', 'Fill Break', 'trigger'],
    ['fillUp', 'Fill Up', 'trigger'],
    ['ending1', 'Ending 1', 'trigger'],
    ['ending2', 'Ending 2', 'trigger'],
    ['ending3', 'Ending 3', 'trigger'],
    ['autoFill', 'Auto Fill In On/Off', 'trigger'],
    ['stopAcmp', 'Stop Acmp On/Off', 'trigger'],
    ['fingeredOnBass', 'Fingered/Fingered On Bass', 'trigger'],
    ['fadeInOut', 'Fade In/Out', 'trigger'],
    ['sectionReset', 'Style Section Reset', 'trigger'],
    ['dynamicsControl', 'Dynamics Control', 'continuous'],
    ['acmp', 'ACMP On/Off', 'trigger'],
    ['unison', 'Unison', 'switch'],
  ]),
  group('One Touch Setting', [
    ['otsLink', 'OTS Link On/Off', 'trigger'],
    ['ots1', 'One Touch Setting 1', 'trigger'],
    ['ots2', 'One Touch Setting 2', 'trigger'],
    ['ots3', 'One Touch Setting 3', 'trigger'],
    ['ots4', 'One Touch Setting 4', 'trigger'],
    ['otsNext', 'One Touch Setting +', 'trigger'],
    ['otsPrev', 'One Touch Setting −', 'trigger'],
  ]),
  group('Quick Racks', [
    ['registNext', 'Next Quick Rack', 'trigger'],
    ['registPrev', 'Previous Quick Rack', 'trigger'],
    ['regist1', 'Quick Rack 1', 'trigger'],
    ['regist2', 'Quick Rack 2', 'trigger'],
    ['regist3', 'Quick Rack 3', 'trigger'],
    ['regist4', 'Quick Rack 4', 'trigger'],
    ['regist5', 'Quick Rack 5', 'trigger'],
    ['regist6', 'Quick Rack 6', 'trigger'],
    ['regist7', 'Quick Rack 7', 'trigger'],
    ['regist8', 'Quick Rack 8', 'trigger'],
    ['regist9', 'Quick Rack 1 of the next bank', 'trigger'],
    ['regist10', 'Quick Rack 2 of the next bank', 'trigger'],
    ['registMemory', 'Quick Racks Store', 'trigger'],
    ['snapshotBankNext', 'Quick Racks Bank +', 'trigger'],
    ['snapshotBankPrev', 'Quick Racks Bank −', 'trigger'],
  ]),
  group('Chord Looper', [
    ['chordLooperOnOff', 'Chord Looper On/Off', 'trigger'],
    ['chordLooperRec', 'Chord Looper Rec/Stop', 'trigger'],
  ]),
]

function pedal(cc: number | null, fn: string, more: Partial<PedalRow> = {}): PedalRow {
  return { cc, fn, controlType: 'holdA', reverse: false, range: 'full', learning: false, down: false, ...more }
}

const boardParts: PartReach[] = [
  { name: 'Right 1', hue: 'r1', sustain: true, pitchBend: true, modulation: false, bendRange: 2 },
  { name: 'Right 2', hue: 'r2', sustain: true, pitchBend: true, modulation: true, bendRange: 2 },
  { name: 'Right 3', hue: 'r3', sustain: true, pitchBend: true, modulation: true, bendRange: 12 },
  { name: 'Left', hue: 'l', sustain: false, pitchBend: false, modulation: false, bendRange: 2 },
]

/** The board: P1 CC 64 Sustain, P2 CC 66 Sostenuto, P3 CC 67 Fill Up; Right 3's bend range at its 12 maximum. */
export const pedalsBoard: PedalsPageData = {
  pedals: [pedal(64, 'sustain'), pedal(66, 'sostenuto'), pedal(67, 'fillUp')],
  functions: pedalFunctions,
  parts: boardParts,
}

/** P3 on Pitch Bend (its Range shows, Lower) and reversed; Left's bend range at 0. */
export const pedalsPitchBend: PedalsPageData = {
  ...pedalsBoard,
  pedals: [pedal(64, 'sustain'), pedal(66, 'sostenuto'), pedal(4, 'pitchBend', { range: 'lower', reverse: true })],
  parts: boardParts.map((p) => (p.hue === 'l' ? { ...p, bendRange: 0 } : p)),
}

/** Pedal 2 waiting for a press to learn its CC (its CC cleared). */
export const pedalsLearning: PedalsPageData = {
  ...pedalsBoard,
  pedals: [pedal(64, 'sustain'), pedal(null, 'sostenuto', { learning: true }), pedal(67, 'fillUp')],
}

/** Pedal 1 held down, set to Toggle. */
export const pedalsHeld: PedalsPageData = {
  ...pedalsBoard,
  pedals: [pedal(64, 'sustain', { down: true, controlType: 'toggle' }), pedal(66, 'sostenuto'), pedal(67, 'fillUp')],
}

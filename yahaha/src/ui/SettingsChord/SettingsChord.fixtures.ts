import type { ChordPageData, FingeringItem, SplitZone } from '../Settings/types'

/** The seven fingering types, in the board's order. */
export const fingerings: FingeringItem[] = [
  { id: 'single', label: 'Single', line: 'One key; add keys for m, 7, m7', tip: 'fingering.single_finger' },
  { id: 'fingered', label: 'Fingered', line: 'Play every note of the chord', tip: 'fingering.fingered' },
  {
    id: 'fingeredOnBass',
    label: 'Fingered On Bass',
    line: 'Your lowest note is the bass',
    tip: 'fingering.fingered_on_bass',
  },
  { id: 'multiFinger', label: 'Multi Finger', line: 'Single or Fingered, told apart', tip: 'fingering.multi_finger' },
  { id: 'aiFingered', label: 'AI Fingered', line: 'Fewer notes; the rest is inferred', tip: 'fingering.ai_fingered' },
  {
    id: 'fullKeyboard',
    label: 'Full Keyboard',
    line: 'Chords from anywhere on the keys',
    tip: 'fingering.full_keyboard',
  },
  {
    id: 'aiFullKeyboard',
    label: 'AI Full Keyboard',
    line: 'Whole keyboard, fewer notes',
    tip: 'fingering.ai_full_keyboard',
  },
]

/** Who plays where on the board: Left below with the chord, Right 1 and 2 above, Right 3 off. */
export const zones: SplitZone[] = [
  { side: 'Below', part: 'L', hue: 'l', program: 41, sound: 'Silk Strings', state: '+ the chord', on: true },
  { side: 'Above', part: 'R1', hue: 'r1', program: 1, sound: 'Stage Grand', state: 'on', on: true },
  { side: null, part: 'R2', hue: 'r2', program: 41, sound: 'Silk Strings', state: 'on', on: true },
  { side: null, part: 'R3', hue: 'r3', program: 57, sound: 'Brass Section', state: 'off', on: false },
]

/** The board: Fingered, Upper off (so Manual Bass is shown, not pressable), split at the default F#2, locked by a rack. */
export const chordBoard: ChordPageData = {
  fingerings,
  fingering: 'fingered',
  upper: false,
  manualBass: false,
  leftHold: false,
  settleMs: 10,
  settleMax: 30,
  split: 54,
  splitName: 'F#2',
  splitDefault: 54,
  splitDefaultName: 'F#2',
  splitMin: 36,
  splitMax: 95,
  splitLocked: true,
  zones,
  picking: false,
}

/** Upper on: chords from the right hand, so Manual Bass is pressable; the split isn't locked. */
export const chordUpper: ChordPageData = {
  ...chordBoard,
  upper: true,
  manualBass: true,
  splitLocked: false,
  zones: [
    { side: 'Below', part: 'L', hue: 'l', program: 41, sound: 'Silk Strings', state: 'on', on: true },
    { side: 'Above', part: 'R1', hue: 'r1', program: 1, sound: 'Stage Grand', state: '+ the chord', on: true },
    { side: null, part: 'R2', hue: 'r2', program: 41, sound: 'Silk Strings', state: '+ the chord', on: true },
    { side: null, part: 'R3', hue: 'r3', program: 57, sound: 'Brass Section', state: 'off', on: false },
  ],
}

/** Single chosen, Left Hold on and a quicker settle. */
export const chordSingle: ChordPageData = {
  ...chordBoard,
  fingering: 'single',
  leftHold: true,
  settleMs: 4,
  splitLocked: false,
}

/** "Set on the keys" pressed: the pick on the main keyboard is armed (the waiting face). */
export const chordPicking: ChordPageData = {
  ...chordBoard,
  splitLocked: false,
  picking: true,
}

/** The split moved up to C3: Reset is pressable. */
export const chordSplitMoved: ChordPageData = {
  ...chordBoard,
  split: 60,
  splitName: 'C3',
  splitLocked: false,
}

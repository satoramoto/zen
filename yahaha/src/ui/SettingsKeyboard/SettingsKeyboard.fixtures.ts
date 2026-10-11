import type { KeyboardPageData } from '../Settings/types'

/** The board: no transpose (Reset both is shown, not pressable), the split point locked at F#2, fingering not locked. */
export const keyboardBoard: KeyboardPageData = {
  transposeKeyboard: 0,
  transposeMaster: 0,
  youPlay: 'C',
  youHear: 'C',
  lockSplit: true,
  lockFingering: false,
  splitName: 'F#2',
}

/** Keyboard transpose up two: you play C, you hear D, and Reset both is pressable. */
export const keyboardTransposed: KeyboardPageData = {
  ...keyboardBoard,
  transposeKeyboard: 2,
  youHear: 'D',
}

/** Both at the ends of their range: Keyboard at +12 (+ not pressable), Master at −12 (− not pressable). */
export const keyboardAtLimits: KeyboardPageData = {
  ...keyboardBoard,
  transposeKeyboard: 12,
  transposeMaster: -12,
  youHear: 'C',
}

/** Nothing locked: a rack recall loads the split point too. */
export const keyboardUnlocked: KeyboardPageData = {
  ...keyboardBoard,
  lockSplit: false,
}

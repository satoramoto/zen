import type { QuickSlot } from './types'

const tip = (i: number) => `quick.${i + 1}`

/** Bank A: A1 the live rack, four stored (one missing), three empty. */
export const quickSlotsBoard: QuickSlot[] = [
  { label: '1', name: 'Sunday drive', state: 'loaded', tip: tip(0) },
  { label: '2', name: 'Organ', state: 'stored', tip: tip(1) },
  { label: '3', name: 'Ballad night', state: 'stored', tip: tip(2) },
  { label: '4', name: 'Sampler Deluxe pad', state: 'stored', tip: tip(3) },
  { label: '5', name: 'Old brass', state: 'missing', tip: tip(4) },
  { label: '6', name: '', state: 'empty', tip: tip(5) },
  { label: '7', name: '', state: 'empty', tip: tip(6) },
  { label: '8', name: '', state: 'empty', tip: tip(7) },
]

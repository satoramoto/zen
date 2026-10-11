import type { CompPresetId } from '../Channel/types'

/** One strip compressor type and its parameters (threshold dB, ratio in tenths, attack and release ms, make-up dB). */
export interface StripCompPreset {
  id: CompPresetId
  /** "Natural". */
  name: string
  threshold: number
  ratio: number
  attack: number
  release: number
  makeup: number
}

/**
 * The strip compressor's types, in order, at the engine's own parameters (`preset_params` in
 * `crates/yahaha-fx/src/fx/part_comp.rs`): unity make-up on every type.
 */
export const STRIP_COMP_PRESETS: StripCompPreset[] = [
  { id: 'natural', name: 'Natural', threshold: -18, ratio: 25, attack: 10, release: 200, makeup: 0 },
  { id: 'rich', name: 'Rich', threshold: -20, ratio: 20, attack: 30, release: 400, makeup: 0 },
  { id: 'punchy', name: 'Punchy', threshold: -24, ratio: 60, attack: 5, release: 120, makeup: 0 },
  { id: 'electronic', name: 'Electronic', threshold: -22, ratio: 40, attack: 3, release: 100, makeup: 0 },
  { id: 'loud', name: 'Loud', threshold: -30, ratio: 80, attack: 2, release: 150, makeup: 0 },
]

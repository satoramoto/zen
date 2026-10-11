import type { ComponentProps } from 'svelte'
import type SectionRow from './SectionRow.svelte'

/** The dark board's section row: stopped, Accomp on; Sync Start, Fade, Metronome, Unison and help off. */
export const sectionRowBoard = {
  running: false,
  accomp: true,
  syncStart: false,
  fading: false,
  metronome: false,
  metronomeOpen: false,
  unison: false,
  help: false,
} satisfies ComponentProps<typeof SectionRow>

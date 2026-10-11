import type { StylePageData } from '../Settings/types'

/** The board's Style page: Next bar timing, Stop Accomp on Style, Dynamics on with Touch and Accent. */
export const styleBoard: StylePageData = {
  mainTiming: 'nextBar',
  introEndingTiming: 'nextBar',
  otsLinkTiming: 'mainChange',
  stopAcmp: 'style',
  tempoChange: 'hold',
  partsChange: 'reset',
  sectionSet: null,
  sectionReset: true,
  syncStopWindowMs: 300,
  fadeInMs: 5000,
  fadeOutMs: 5000,
  fadeHoldMs: 1000,
  retrigger: false,
  retriggerRate: 8,
  swing: 0,
  swingGrid: 8,
  sectionTempo: false,
  syncStop: false,
  syncStopAvailable: true,
  autoFill: true,
  halfBarFill: false,
  unison: false,
  unisonType: 'root',
  dynamicsControl: true,
  dynamicsLevel: 127,
  touch: true,
  accent: true,
  accentThreshold: 100,
  accentMode: 'hits',
  accentSource: 'left',
}

/** Dynamics Control off: Level is shown faded, not movable. */
export const styleDynamicsOff: StylePageData = { ...styleBoard, dynamicsControl: false, dynamicsLevel: 90 }

/** Full Keyboard fingering in Lower: Sync Stop is shown, not pressable; Sync Stop window Off. */
export const styleSyncStopUnavailable: StylePageData = {
  ...styleBoard,
  syncStopAvailable: false,
  syncStopWindowMs: 0,
}

/** A busier page: Main B set for new styles, Retrigger on at 1/16, some swing on a 1/16 grid. */
export const styleBusy: StylePageData = {
  ...styleBoard,
  mainTiming: 'immediate',
  sectionSet: 1,
  retrigger: true,
  retriggerRate: 16,
  swing: 35,
  swingGrid: 16,
  sectionTempo: true,
  unison: true,
  unisonType: 'melody',
  accentMode: 'fill',
  accentSource: 'both',
}

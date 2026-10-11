import type { SongFormProps } from './SongForm';

/*
 * Fixtures ported from the three originals this region replaces, each kept as its own state so a
 * story can be compared with the baseline one to one:
 *
 * - PadBank's `sectionPads` (the board's Sections bank): Main B playing, Main C next "after bar
 *   4", Intro III and Ending III not in the style, Start / Stop running.
 * - SectionRow's `sectionRowBoard`: stopped, Accomp on, Sync Start and Fade off (its Metronome,
 *   Unison, Panic and help belong to the AppBar region).
 * - TransportColumn's `transportBoard`: running, no fade (its Tempo ± and Style tempo belong to
 *   the Display region).
 */

/** PadBank's board: running in Main B, Main C queued after bar 4; the style lacks Intro III and Ending III. */
export const songFormBoard = {
  running: true,
  playing: 'mainB',
  next: 'mainC',
  nextAt: 'after bar 4',
  absent: ['intro3', 'ending3'],
  accomp: true,
  syncStart: false,
  syncStop: false,
  autoFill: false,
  fading: false,
} satisfies SongFormProps;

/** SectionRow's board: stopped with Main A chosen to start, Accomp on, every other switch off. */
export const songFormStopped = {
  running: false,
  playing: 'mainA',
  absent: ['intro3', 'ending3'],
  accomp: true,
  syncStart: false,
  syncStop: false,
  autoFill: false,
  fading: false,
} satisfies SongFormProps;

/** TransportColumn's board (running, no fade), with a Fill ▲ queued: a fill, then Main C, after bar 4. */
export const songFormFillPending = {
  ...songFormBoard,
  fillPending: 'up',
} satisfies SongFormProps;

/** Stopped, Sync Start armed on Intro I: the band starts with the first chord played. */
export const songFormSyncArmed = {
  ...songFormStopped,
  playing: 'intro1',
  syncStart: true,
} satisfies SongFormProps;

/** A sparse style: one Intro, two Mains, one Ending and no Break. */
export const songFormSparse = {
  running: true,
  playing: 'mainA',
  next: 'mainB',
  nextAt: 'after bar 2',
  absent: ['intro2', 'intro3', 'mainC', 'mainD', 'ending2', 'ending3', 'break'],
  accomp: true,
  autoFill: true,
} satisfies SongFormProps;

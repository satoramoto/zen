// SongForm's stories as plain props: SongForm.stories.tsx (React) and SongForm.stories.svelte.ts
// (Svelte) both draw them, and the parity test renders every instance in both.
import { defineFixtures } from '../../fixtures';
import type { SongFormProps } from './SongForm.model';

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

/** The stories' common args (the board, flashing on): every story's args below are drawn over it. */
export const songFormArgs = { ...songFormBoard, lit: true } satisfies SongFormProps;

/** The controls, the same in both Storybooks. */
export const songFormArgTypes = {
  running: { control: 'boolean' },
  fillPending: { control: 'inline-radio', options: [undefined, 'up', 'down'] },
  lit: { control: 'boolean' },
  nextAt: { control: 'text' },
} as const;

/**
 * The region's box per story: its width (default 1392, the 1440 × 900 board inside its padding)
 * and, where the Stage's strip gives one, its height.
 */
export const songFormBoxes: Partial<Record<keyof typeof songFormStories, { width?: number; height?: number }>> = {
  At1217: { width: 1169 },
  Narrow: { width: 720 },
  FormPart: { width: 1392, height: 72 },
  FormPartSmall: { width: 1169, height: 67 },
  TransportPart: { width: 520 },
  TransportPartTall: { width: 720, height: 210 },
  TransportPartStopped: { width: 520 },
};

/** The default region width. */
export const SONG_FORM_WIDTH = 1392;

const stopped = { ...songFormArgs, ...songFormStopped, next: undefined, nextAt: undefined };

export const songFormStories = defineFixtures<SongFormProps>()({
  Stopped: { args: stopped },
  Board: { args: songFormArgs },
  FlashOff: { args: { ...songFormArgs, lit: false } },
  FillPending: { args: { ...songFormArgs, ...songFormFillPending } },
  SyncStartArmed: { args: { ...songFormArgs, ...songFormSyncArmed, next: undefined, nextAt: undefined } },
  MissingSections: { args: { ...songFormArgs, ...songFormSparse } },
  Fading: { args: { ...songFormArgs, fading: true } },
  At1217: { args: songFormArgs },
  Narrow: { args: songFormArgs },
  FormPart: { args: { ...songFormArgs, part: 'form' } },
  FormPartSmall: { args: { ...songFormArgs, part: 'form' } },
  FormPartAuto: { args: { ...songFormArgs, part: 'form' } },
  TransportPart: { args: { ...songFormArgs, part: 'transport' } },
  TransportPartTall: { args: { ...songFormArgs, part: 'transport' } },
  Forms: { args: songFormArgs },
  TransportPartStopped: { args: { ...songFormArgs, ...songFormSyncArmed, part: 'transport', next: undefined, nextAt: undefined } },
});

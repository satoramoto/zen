// Button's stories as plain props: Button.stories.tsx (React) and Button.stories.svelte.ts
// (Svelte) both draw them, and parity.test.tsx renders every instance in both.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { ButtonHue, ButtonModelProps } from './Button.model';

const NONE = 'none';
const SIZES = ['icon', 'md', 'band', 'pair', 'cell', 'caret'];
/** The hues that draw a distinct look (the deprecated `t2` and `m` draw as `t`, so they're left out). */
export const HUES: ButtonHue[] = ['t', 'a', 'lamp', 'rec', 'ok', 'role-2', 1, 2, 3, 4, 5, 'intro', 'main', 'ending', 'brk', 'fill'];
const SYMBOLS = ['prev', 'next', 'up', 'down', 'plus', 'minus', 'caret'];
/** A select whose first option is `none` (undefined), so the control can go back to "no value". */
const optional = (options: string[]) => ({ control: 'select' as const, options: [NONE, ...options], mapping: { [NONE]: undefined } });
/** none / false / true, for a boolean whose undefined means "no attribute". */
const threeWay = {
  control: 'select' as const,
  options: [NONE, 'false', 'true'],
  mapping: { [NONE]: undefined, false: false, true: true },
};

/** The controls, the same in both Storybooks. */
export const buttonArgTypes = {
  label: { control: 'text' },
  name: { control: 'text' },
  controls: { control: 'text' },
  tip: { control: 'text' },
  compact: { control: 'boolean' },
  strong: { control: 'boolean' },
  on: { control: 'boolean' },
  chosen: { control: 'boolean' },
  waiting: { control: 'boolean' },
  lit: { control: 'boolean' },
  tall: { control: 'boolean' },
  expanded: { control: 'boolean' },
  disabled: { control: 'boolean' },
  hold: { control: 'boolean' },
  size: { control: 'select', options: SIZES },
  variant: { control: 'inline-radio', options: ['primary', 'secondary', 'quiet'] },
  hue: { control: 'select', options: HUES },
  symbol: optional(SYMBOLS),
  join: optional(['start', 'end']),
  popup: optional(['dialog', 'menu']),
  bar: threeWay,
  pressed: threeWay,
} as const;

type P = FixtureProps<ButtonModelProps>;

/** The Faces story: every face of one hue. */
export const faceRow = (hue: ButtonHue): P[] => [
  { hue, label: String(hue), size: 'pair' },
  { hue, label: String(hue), size: 'pair', waiting: true },
  { hue, label: String(hue), size: 'pair', on: true },
  { hue, label: String(hue), size: 'pair', chosen: true },
  { hue, label: String(hue), size: 'pair', disabled: true },
];
export const FACE_HUES = HUES.filter((h) => h !== 'lamp');

/** The Sizes story's three rows: the sizes, the joined caret split, a cell filling its track. */
export const sizeRows: P[][] = [
  [
    { label: '?', size: 'icon', name: 'Help mode' },
    { label: 'Panic', size: 'md' },
    { label: 'Stop', size: 'band' },
    { label: 'Fill', symbol: 'up', size: 'pair' },
    { label: 'Fill', symbol: 'down', size: 'pair' },
  ],
  [
    { label: 'Metronome', size: 'md', join: 'start' },
    { symbol: 'caret', size: 'caret', join: 'end', popup: 'dialog', name: 'Metronome settings' },
  ],
  [{ label: 'Audition', size: 'cell' }],
];

const running: P = {
  label: 'Start / Stop',
  size: 'band',
  compact: true,
  strong: true,
  bar: true,
  pressed: true,
  name: 'Start / Stop, running',
  tip: 'transport.start_stop',
};

export const buttonStories = defineFixtures<ButtonModelProps>()({
  Board: {
    args: { symbol: 'caret', size: 'caret', join: 'end', popup: 'dialog', expanded: false, name: 'Metronome settings', tip: 'metronome.settings' },
  },
  Icon: { args: { label: '?', size: 'icon', pressed: false, name: 'Help mode' } },
  BandOn: { args: { label: 'Fade', size: 'band', on: true, pressed: true } },
  On: { args: { label: '?', size: 'icon', on: true, pressed: true, name: 'Help mode' } },
  Chosen: { args: { label: '2', size: 'icon', chosen: true, pressed: true, name: 'One Touch 2, applied' } },
  Band: { args: { label: 'Stop', size: 'band', name: 'Stop (fade with hold)' } },
  Running: { args: running },
  Stopped: { args: { ...running, bar: false, pressed: false, name: 'Start / Stop' } },
  Waiting: { args: { label: 'Fade', size: 'pair', waiting: true, pressed: false, name: 'Fade, armed', tip: 'transport.fade' } },
  WaitingFlash: {
    items: [
      { label: 'Fade', size: 'pair', waiting: true, lit: true, name: 'Fade, armed, lit' },
      { label: 'Fade', size: 'pair', waiting: true, lit: false, name: 'Fade, armed, unlit' },
      { label: 'On', size: 'pair', hue: 1, waiting: true, lit: true, name: 'Hue 1, armed, lit' },
      { label: 'On', size: 'pair', hue: 1, waiting: true, lit: false, name: 'Hue 1, armed, unlit' },
    ],
  },
  Role2: {
    items: [
      { label: 'Start', size: 'band', variant: 'primary', hue: 'role-2', tall: true, name: 'Start / Stop, stopped' },
      { label: 'Stop', size: 'band', hue: 'role-2', bar: true, tall: true, name: 'Start / Stop, running' },
      { label: 'Sync Start', size: 'md', hue: 'role-2', name: 'Sync Start' },
      { label: 'Sync Start', size: 'md', hue: 'role-2', waiting: true, name: 'Sync Start, armed' },
      { label: 'Fill', symbol: 'up', size: 'md', hue: 'role-2', waiting: true, lit: false, name: 'Fill up, queued, unlit' },
      { label: 'Tap', size: 'pair', hue: 'role-2', on: true, name: 'Tap, on' },
      { symbol: 'plus', size: 'icon', hue: 'role-2', name: 'Tempo up' },
    ],
  },
  Tall: { args: { label: 'Start', size: 'band', variant: 'primary', tall: true, name: 'Start / Stop' } },
  Disabled: { args: { label: 'Audition', size: 'md', compact: true, disabled: true, name: 'Audition (stop the band first)' } },
  DisabledHue: { args: { label: 'Fill', symbol: 'up', size: 'pair', hue: 'fill', disabled: true, name: 'Fill up (none in this style)' } },
  Hold: { args: { label: 'Tempo', symbol: 'plus', size: 'band', hold: true, name: 'Tempo up (Scene Launch)', tip: 'tempo.up' } },
  LongPress: { args: { label: 'Stop', size: 'band', tip: 'transport.stop' } },
  Hierarchy: {
    items: [
      { label: 'Start', size: 'band', variant: 'primary' },
      { label: 'Stop', size: 'band' },
      { label: 'Reset', size: 'md', variant: 'quiet' },
      { symbol: 'prev', size: 'icon', variant: 'quiet', name: 'Previous style' },
      { symbol: 'next', size: 'icon', variant: 'quiet', name: 'Next style' },
    ],
  },
  Quiet: {
    items: [
      { label: 'JSON', variant: 'quiet', pressed: false, name: 'JSON off' },
      { label: 'JSON', variant: 'quiet', pressed: true, chosen: true, name: 'JSON chosen' },
      { label: 'JSON', variant: 'quiet', disabled: true, name: 'JSON disabled' },
    ],
  },
  // The React story adds the sidebar icon to each and draws them in every pack; an icon is a React
  // node or a Svelte snippet, so the fixture holds the rest of each key.
  IconToggle: {
    items: [
      { size: 'icon', variant: 'quiet', name: 'Inspector', title: 'Show the inspector (⌘I)', pressed: false, chosen: false },
      { size: 'icon', variant: 'quiet', name: 'Sources', title: 'Hide the sources', pressed: true, chosen: true },
      { label: 'Library', variant: 'quiet', title: 'Show the library', pressed: false },
      { size: 'icon', name: 'Sources (secondary)', title: 'Sources' },
      { size: 'icon', variant: 'quiet', name: 'Sources (disabled)', disabled: true },
    ],
  },
  Faces: { items: FACE_HUES.flatMap(faceRow) },
  Sizes: { items: sizeRows.flat() },
});

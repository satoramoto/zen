// Pad's stories as plain props: Pad.stories.tsx draws them with React's or Svelte's `Tree`, and
// the tree snapshot renders every instance. The stories laid out in a grid or a cell are view
// trees built here (`padBankSample`, …), drawn with `treeStory`.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import { component, h, styleText, type Node } from '../../../view/Tree.model';
import type { PadModelProps, PadState } from './Pad.model';

type P = FixtureProps<PadModelProps>;

/** The controls, the same in both Storybooks. */
export const padArgTypes = {
  label: { control: 'text' },
  index: { control: 'text' },
  family: { control: 'select', options: ['intro', 'main', 'ending', 'brk', 'fill', 'util', 'start'] },
  hue: { control: 'select', options: [undefined, 1, 2, 3, 4, 5] },
  state: { control: 'select', options: ['idle', 'dark', 'playing', 'next', 'armed', 'running'] },
  lit: { control: 'boolean' },
  tagCorner: { control: 'boolean' },
  role: { control: 'select', options: [undefined, 1, 2] },
  accentNext: { control: 'boolean' },
  disabled: { control: 'boolean' },
  fillCell: { control: 'boolean' },
  onFace: { control: 'inline-radio', options: ['fill', 'ring'] },
  name: { control: 'text' },
  tip: { control: 'text' },
} as const;

/** Every story's base args (the React meta's), which each story's own args override. */
export const padBase = {
  label: 'Main B',
  index: '10',
  family: 'main',
  state: 'playing',
  lit: true,
  tip: 'section.lamps',
} satisfies P;

/** The cells the Stage puts pads in: a song-form step, 4 × 4 and 2 × 8 bank cells, a narrow eight-a-row cell. */
export const CELLS: { name: string; width: string; height: string; label: string; font?: string; tagCorner?: boolean }[] = [
  { name: 'Song-form step', width: 'calc(var(--control-h) * 1.1)', height: 'calc(var(--control-h) * 1.3)', label: 'C', font: 'var(--size-heading)', tagCorner: true },
  { name: '4 × 4 cell', width: 'calc(var(--control-h) * 2.6)', height: 'calc(var(--control-h) * 1.25)', label: 'Main A' },
  { name: '2 × 8 cell', width: 'calc(var(--control-h) * 1.95)', height: 'calc(var(--control-h) * 1.5)', label: 'Rack 4' },
  { name: 'Narrow cell', width: 'calc(var(--control-h) * 1.6)', height: 'calc(var(--control-h) * 1.5)', label: 'Bank +', font: 'var(--size-caption)' },
];

/** The TagClearance story's pads: NEXT and ARMED in every cell. */
export const TAG_STATES: PadState[] = ['next', 'armed'];
export const tagPad = (cell: (typeof CELLS)[number], state: PadState): P & { label: string } => ({
  label: cell.label,
  state,
  tagCorner: cell.tagCorner,
  fillCell: true,
  name: `${cell.label}, ${state}, ${cell.name}`,
});

/** A whole 4 × 4 bank. */
export const BANK: (P & { label: string })[] = [
  { label: 'Intro I', index: '1', family: 'intro', state: 'idle' },
  { label: 'Intro II', index: '2', family: 'intro', state: 'idle' },
  { label: 'Intro III', index: '3', family: 'intro', state: 'dark' },
  { label: 'Sync Start', index: '4', family: 'util', state: 'armed', role: 2 },
  { label: 'Ending I', index: '5', family: 'ending', state: 'idle' },
  { label: 'Ending II', index: '6', family: 'ending', state: 'idle' },
  { label: 'Fill', index: '7', family: 'fill', state: 'idle' },
  { label: 'Break', index: '8', family: 'brk', state: 'idle' },
  { label: 'Main A', index: '9', family: 'main', state: 'idle' },
  { label: 'Main B', index: '10', family: 'main', state: 'playing' },
  { label: 'Main C', index: '11', family: 'main', state: 'next', tagCorner: true },
  { label: 'Auto Fill', index: '12', family: 'util', state: 'playing', role: 2 },
  { label: 'QUICK 1', index: '13', family: 'util', hue: 1, state: 'playing' },
  { label: 'QUICK 2', index: '14', family: 'util', hue: 2, state: 'idle' },
  { label: 'BANK -', index: '15', family: 'util', hue: 3, state: 'dark' },
  { label: 'Start / Stop', index: '16', family: 'start', state: 'running', role: 2 },
];

/** The BankRing story: every pad but the sections on `onFace="ring"`. */
export const BANK_RING: (P & { label: string })[] = BANK.map((p) => ({ ...p, onFace: p.family === 'main' ? 'fill' : 'ring' }));

export const padStories = defineFixtures<PadModelProps>()({
  Board: { args: { ...padBase, name: 'Main B, playing' } },
  Idle: { args: { ...padBase, label: 'Intro I', index: '1', family: 'intro', state: 'idle' } },
  Dark: { args: { ...padBase, label: 'Intro III', index: '3', family: 'intro', state: 'dark', name: 'Intro III (not in this style)' } },
  DarkUtility: { args: { ...padBase, label: 'Auto Fill', index: '12', family: 'util', state: 'dark', name: 'Auto Fill (unavailable)' } },
  Next: { args: { ...padBase, label: 'Main C', index: '11', state: 'next', name: 'Main C, queued after bar 4 (flashing)' } },
  NextCorner: {
    args: { ...padBase, label: 'Main C', index: '11', state: 'next', tagCorner: true, name: 'Main C, queued after bar 4 (flashing)' },
  },
  TagClearance: { items: TAG_STATES.flatMap((state) => CELLS.map((cell) => tagPad(cell, state))) },
  NextUnlit: { args: { ...padBase, label: 'Main C', index: '11', state: 'next', lit: false, name: 'Main C, queued after bar 4 (flashing)' } },
  Armed: { args: { ...padBase, label: 'Ending I', index: '5', family: 'ending', state: 'armed', name: 'Ending I, armed (pulsing)' } },
  Utility: { args: { ...padBase, label: 'Sync Start', index: '4', family: 'util', state: 'idle' } },
  UtilityOn: { args: { ...padBase, label: 'Auto Fill', index: '12', family: 'util', state: 'playing' } },
  Running: { args: { ...padBase, label: 'Start / Stop', index: '16', family: 'start', state: 'running', name: 'Start / Stop, running (pad 16)' } },
  RoleRunning: {
    args: { ...padBase, label: 'Start / Stop', index: '16', family: 'start', state: 'running', role: 2, name: 'Start / Stop, running (pad 16)' },
  },
  RoleStopped: {
    args: { ...padBase, label: 'Start / Stop', index: '16', family: 'start', state: 'idle', role: 2, name: 'Start / Stop, stopped (pad 16)' },
  },
  RoleOn: { args: { ...padBase, label: 'Auto Fill', index: '12', family: 'util', state: 'playing', role: 2, name: 'Auto Fill, on (pad 12)' } },
  RoleArmed: { args: { ...padBase, label: 'Sync Start', index: '4', family: 'util', state: 'armed', role: 2, name: 'Sync Start, armed' } },
  Hue: { args: { ...padBase, label: 'QUICK 1', index: '1', family: 'util', hue: 1, state: 'playing', tip: 'padpage.racks' } },
  HueDark: { args: { ...padBase, label: 'BANK -', index: '13', family: 'util', hue: 3, state: 'dark', tip: 'padpage.racks' } },
  NextAccent: { args: { ...padBase, label: 'Main C', index: '11', state: 'next', accentNext: true, name: 'Main C, queued after bar 4' } },
  Disabled: { args: { ...padBase, label: 'Auto Fill', index: '12', family: 'util', state: 'idle', disabled: true } },
  FillCell: { args: { ...padBase, label: 'Main B', index: '10', state: 'playing', fillCell: true } },
  Bank: { items: BANK },
  // The first two take the story's args; the last two are their own pads (no tip, Main B on its fill).
  OnRing: {
    args: { ...padBase, label: 'Auto Fill', index: '12', family: 'util', state: 'playing', onFace: 'ring', name: 'Auto Fill, on (ring)' },
    items: [
      {},
      { role: 2, name: 'Auto Fill, on (ring, role 2)' },
      { label: 'QUICK 1', index: '13', family: 'util', hue: 1, state: 'playing', onFace: 'ring', name: 'Quick 1, on (ring)', tip: undefined },
      { label: 'Main B', index: '10', family: 'main', state: 'playing', onFace: 'fill', name: 'Main B, playing (fill)', tip: undefined },
    ],
  },
  BankRing: { items: BANK_RING },
});

/** A 4 × 4 grid of pads (the Bank and BankRing stories). */
export const padBankSample = (pads: (P & { label: string })[]): Node =>
  h(
    'div',
    { style: 'display: grid; grid-template-columns: repeat(4, max-content); gap: var(--space-2)' },
    pads.map((p) => component('Pad', { ...p }, { key: p.index })),
  );

/** The TagClearance story: NEXT and ARMED in every cell the Stage puts a pad in, a row per state. */
export const padTagClearanceSample = (): Node =>
  h(
    'div',
    { style: 'display: grid; gap: var(--space-6); padding-top: var(--space-3)' },
    // The regions set the pad's type size on the pad itself; this stands in for them.
    h('style', {}, '.yh-pad-cell .yh-pad { font-size: var(--yh-pad-cell-font, var(--size-label)); }'),
    TAG_STATES.map((state) =>
      h(
        'div',
        { style: 'display: flex; gap: var(--space-3); align-items: end' },
        CELLS.map((cell) =>
          h(
            'div',
            {
              class: 'yh-pad-cell',
              style: styleText({ display: 'grid', width: cell.width, height: cell.height, '--yh-pad-cell-font': cell.font }),
            },
            component('Pad', { ...tagPad(cell, state) }),
          ),
        ),
      ),
    ),
  );

/** The FillCell story: one pad (the story's args, its press as `press`) filling a wide, short cell. */
export const padFillCellSample = (args: P & { label: string }): Node =>
  h(
    'div',
    { style: 'display: grid; width: calc(var(--control-h) * 5); height: calc(var(--control-h) * 1.5)' },
    component('Pad', { ...args }, { on: { onPress: 'press' } }),
  );

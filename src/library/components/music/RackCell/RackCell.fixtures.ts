// RackCell's stories as plain props: RackCell.stories.tsx draws them in either renderer, and the
// tree snapshot records every instance. The stories that compose (Modified, LongName: PartMarks'
// edited dot in the `mark` slot; InRow: the cell at the head of a row of SoundCells) are view trees
// built here (`rackCellMarkSample`, `rackCellRowSample`), drawn with `treeStory`.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import { component, h, type Node } from '../../../view/Tree.model';
import type { RackCellModelProps } from './RackCell.model';

/** A cell's data props (its press is the samples' `press` handler). */
export type RackCellData = FixtureProps<RackCellModelProps>;

/** The controls, the same in both Storybooks. */
export const rackCellArgTypes = {
  rack: { control: 'text' },
  slot: { control: 'text' },
  label: { control: 'text' },
  name: { control: 'text' },
  tip: { control: 'text' },
} as const;

export const rackCellStories = defineFixtures<RackCellModelProps>()({
  Board: { args: { rack: 'Sunday drive', slot: 'A1', label: 'Rack', tip: 'nav.rack' } },
  NoSlot: { args: { rack: 'Ballad night', slot: '' } },
  Modified: { args: { rack: 'Sunday drive', slot: 'A1' } },
  LongName: { args: { rack: 'Saturday wedding set, second half with horns', slot: 'B4' } },
  Empty: { args: { rack: '', slot: '' } },
  InRow: { args: { rack: 'Sunday drive', slot: 'A1' } },
});

/** The cell's press, by the key the samples name. */
const on = { onPress: 'press' };

/** The Modified and LongName stories: one cell (the story's args) with PartMarks' edited dot in its `mark` slot. */
export const rackCellMarkSample = (args: RackCellData): Node =>
  h('div', {}, component('RackCell', { ...args }, { on, slots: { mark: [component('PartMarks', { edited: true })] } }));

/** The SoundCells after the rack in the InRow story. */
export const ROW_SOUND_CELLS = [
  { part: 'R1', partName: 'Right 1', hue: 1, number: '1', sound: 'Stage Grand' },
  { part: 'R2', partName: 'Right 2', hue: 2, number: '41', sound: 'Warm Strings' },
  { part: 'L', partName: 'Left', hue: 4, number: '208', sound: 'Concert Grand Piano Bright Stereo' },
];

/** The InRow story: the cell (the story's args) at the head of a sound row. */
export const rackCellRowSample = (args: RackCellData): Node =>
  h(
    'div',
    { class: 'lib-row', style: 'gap: var(--space-4); align-items: flex-start' },
    component('RackCell', { ...args }, { on }),
    ROW_SOUND_CELLS.map((cell) => component('SoundCell', { ...cell }, { key: cell.part })),
  );

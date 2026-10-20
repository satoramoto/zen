// SoundCell's stories as plain props: SoundCell.stories.tsx draws them in either renderer, and the
// tree snapshot records every instance. The stories that compose (WithMarks: PartMarks in the
// `marks` slot; Row: a row of cells) are view trees built here (`soundCellMarksSample`,
// `soundCellRowSample`), drawn with `treeStory`.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import { component, h, type Node } from '../../../view/Tree.model';
import type { SoundCellModelProps } from './SoundCell.model';

/** A cell's data props (its callbacks are the samples' `part` and `sound` handlers). */
export type SoundCellData = FixtureProps<SoundCellModelProps>;

/** The controls, the same in both Storybooks. */
export const soundCellArgTypes = {
  part: { control: 'text' },
  partName: { control: 'text' },
  hue: { control: 'inline-radio', options: [1, 2, 3, 4, 5] },
  number: { control: 'text' },
  sound: { control: 'text' },
  off: { control: 'boolean' },
  soundName: { control: 'text' },
  partTip: { control: 'text' },
  soundTip: { control: 'text' },
} as const;

/** The args every story starts from (the tooltip keys). */
export const soundCellArgs = { partTip: 'mixer.strip.select', soundTip: 'launchkey.fader_sound' };

export const soundCellStories = defineFixtures<SoundCellModelProps>()({
  Board: { args: { part: 'R1', partName: 'Right 1', hue: 1, number: '1', sound: 'Stage Grand', off: false } },
  Off: { args: { part: 'R3', partName: 'Right 3', hue: 3, number: '57', sound: 'Brass Section', off: true } },
  LongName: { args: { part: 'L', partName: 'Left', hue: 4, number: '208', sound: 'Concert Grand Piano Bright Stereo' } },
  WithMarks: { args: { part: 'R2', partName: 'Right 2', hue: 2, number: '41', sound: 'Warm Strings' } },
  NoNumber: { args: { part: 'R1', partName: 'Right 1', hue: 1, sound: 'User Piano' } },
  Row: {
    args: { part: 'R1', partName: 'Right 1', sound: 'Stage Grand' },
    items: [
      { part: 'R1', partName: 'Right 1', hue: 1, number: '1', sound: 'Stage Grand' },
      { part: 'R2', partName: 'Right 2', hue: 2, number: '41', sound: 'Warm Strings' },
      { part: 'R3', partName: 'Right 3', hue: 3, number: '57', sound: 'Brass Section', off: true },
      { part: 'L', partName: 'Left', hue: 4, number: '208', sound: 'Concert Grand Piano Bright Stereo' },
      { part: '5', partName: 'Slot 5', hue: 5, number: '12', sound: 'Jazz Organ' },
    ],
  },
});

/** The cells' callbacks, by the keys the samples name. */
const on = { onPart: 'part', onSound: 'sound' };

/** The WithMarks story: one cell (the story's args) with PartMarks (edited) in its `marks` slot. */
export const soundCellMarksSample = (args: SoundCellData): Node =>
  h('div', {}, component('SoundCell', { ...args }, { on, slots: { marks: [component('PartMarks', { edited: true })] } }));

/** The Row story: the five hue slots side by side, each item over the story's args. */
export const soundCellRowSample = (args: SoundCellData): Node =>
  h(
    'div',
    { class: 'lib-row', style: 'gap: var(--space-4); align-items: flex-start' },
    (soundCellStories.Row.items ?? []).map((item) => component('SoundCell', { ...args, ...item }, { on, key: item.part })),
  );

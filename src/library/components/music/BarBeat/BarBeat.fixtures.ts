// BarBeat's stories as plain props: BarBeat.stories.tsx draws them with React's or Svelte's
// `Tree`, and the tree snapshot renders every instance. The bar fills its container, so each story
// is a view tree built here (`barBeatSample`, `barBeatSectionsSample`), drawn with `treeStory`.
import { defineFixtures, instances } from '../../../fixtures';
import { component, h, type Node } from '../../../view/Tree.model';
import type { BarBeatHue, BarBeatModelProps } from './BarBeat.model';

/** The controls, the same in both Storybooks. */
export const barBeatArgTypes = {
  beat: { control: { type: 'range', min: 0, max: 12, step: 1 } },
  beats: { control: { type: 'number', min: 1, max: 12, step: 1 } },
  hue: { table: { disable: true } },
} as const;

/** The old section hues, passed and ignored in the Sections story. */
export const SECTIONS: BarBeatHue[] = ['intro', 'main', 'ending', 'brk', 'fill'];

export const barBeatStories = defineFixtures<BarBeatModelProps>()({
  Board: { args: { beat: 2, beats: 4 } },
  Intro: { args: { beat: 1, beats: 4 } },
  Stopped: { args: { beat: 0, beats: 4 } },
  ThreeFour: { args: { beat: 3, beats: 3 } },
  Sections: { args: { beat: 3, beats: 4 }, items: SECTIONS.map((hue) => ({ hue })) },
  SevenEight: { args: { beat: 5, beats: 7 } },
  Thick: { args: { beat: 2, beats: 4, thickness: '6px' } },
});

/** One bar (the story's args) in a 320px column. */
export const barBeatSample = (args: BarBeatModelProps): Node => h('div', { style: 'width: 320px' }, component('BarBeat', { ...args }));

/** The Sections story: a bar per old section hue, stacked in a 320px column. */
export const barBeatSectionsSample = (): Node =>
  h(
    'div',
    { style: 'display: grid; gap: 16px; width: 320px' },
    instances(barBeatStories.Sections).map((item) => component('BarBeat', { ...item }, { key: item.hue })),
  );

// TempoReadout's stories as plain props: TempoReadout.stories.tsx draws them with either renderer's
// `Tree`, and the tree snapshot renders every one. The Cells stories are a view tree built here
// (`tempoReadoutCellsSample`), drawn with `treeStory`.
import { defineFixtures } from '../../../fixtures';
import { component, h, styleText, type Node } from '../../../view/Tree.model';
import type { TempoReadoutModelProps } from './TempoReadout.model';

/** The controls, the same in both Storybooks. */
export const tempoReadoutArgTypes = {
  bpm: { control: { type: 'number', min: 5, max: 500, step: 1 } },
  unit: { control: 'text' },
  min: { control: { type: 'number', min: 5, max: 500, step: 1 } },
  max: { control: { type: 'number', min: 5, max: 500, step: 1 } },
  cells: { control: 'boolean' },
  unitLarge: { control: 'boolean' },
  size: { control: 'text' },
} as const;

/** The size container the Cells stories sit in. */
export const CELLS_BOX = { width: 360, height: 80 };

export const tempoReadoutStories = defineFixtures<TempoReadoutModelProps>()({
  Board: { args: { bpm: 104, unit: 'BPM', min: 5, max: 500 } },
  AtMax: { args: { bpm: 500, unit: 'BPM', min: 5, max: 500 } },
  Slow: { args: { bpm: 68, unit: 'BPM', min: 5, max: 500 } },
  HeroSize: { args: { bpm: 104, unit: 'BPM', min: 5, max: 500, size: 'var(--size-display)' } },
  // The stories draw these inside a CELLS_BOX size container (`tempoReadoutCellsSample`).
  Cells: { args: { bpm: 104, unit: 'BPM', min: 5, max: 500, cells: true } },
  CellsUnitLarge: { args: { bpm: 104, unit: 'BPM', min: 5, max: 500, cells: true, unitLarge: true } },
});

/** The Cells stories: one readout (the story's data; its callbacks as `tempo`, `plus`, `minus`,
 *  `reset`) in a CELLS_BOX size container. */
export const tempoReadoutCellsSample = (args: TempoReadoutModelProps): Node =>
  h(
    'div',
    { style: styleText({ 'container-type': 'size', width: `${CELLS_BOX.width}px`, height: `${CELLS_BOX.height}px` }) },
    component('TempoReadout', { ...args }, { on: { onTempo: 'tempo', onPlus: 'plus', onMinus: 'minus', onReset: 'reset' } }),
  );

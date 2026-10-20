// DisplayArt's stories as plain props, which DisplayArt.stories.tsx draws with either renderer and
// the tree snapshot shares; the UnderReadouts story is a view tree built here (`displayArtUnderReadouts`).
import { defineFixtures } from '../../fixtures';
import { component, h, type Node } from '../../view/Tree.model';
import { displayArtView, type DisplayArtModelProps } from './DisplayArt.model';

/** The controls, the same in both Storybooks. */
export const displayArtArgTypes = { fade: { control: 'boolean' } } as const;

/** The display's width the stories draw the art at, in px (the original's 528 × 300). */
export const DISPLAY_WIDTH = 528;

/** The readouts the UnderReadouts story lays over the art. */
export const UNDER_READOUTS = { chord: 'C', extension: 'maj7', bpm: 120 } as const;

export const displayArtStories = defineFixtures<DisplayArtModelProps>()({
  Board: { args: { fade: true } },
  Bare: { args: { fade: false } },
  UnderReadouts: { args: { fade: true } },
});

/** The UnderReadouts story's tree: the art, with the chord and tempo readouts (registered
 *  components) laid over it. */
export const displayArtUnderReadouts = (args: DisplayArtModelProps): Node =>
  h(
    'div',
    { style: 'position: relative' },
    displayArtView(args),
    h(
      'div',
      { class: 'lib-specimens', style: 'position: absolute; inset: 0; align-content: center; padding: var(--space-6)' },
      component('ChordReadout', { chord: UNDER_READOUTS.chord, extension: UNDER_READOUTS.extension }),
      component('TempoReadout', { bpm: UNDER_READOUTS.bpm }),
    ),
  );

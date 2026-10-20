// DisplayArt's stories as plain props: DisplayArt.stories.tsx (React) and DisplayArt.stories.svelte.ts
// (Svelte) both draw them, and the parity test renders every one in both.
import { defineFixtures } from '../../fixtures';
import type { DisplayArtModelProps } from './DisplayArt.model';

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

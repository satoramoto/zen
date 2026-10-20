// BarBeat's stories as plain props: BarBeat.stories.tsx (React) and BarBeat.stories.svelte.ts
// (Svelte) both draw them, and the parity test renders every instance in both.
import { defineFixtures } from '../../../fixtures';
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

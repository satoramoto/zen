// PartMarks' stories as plain props: PartMarks.stories.tsx (React) and PartMarks.stories.svelte.ts
// (Svelte) both draw them, and parity.test.tsx renders every instance in both.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { PartMarksModelProps } from './PartMarks.model';

type P = FixtureProps<PartMarksModelProps>;

/** The controls, the same in both Storybooks. */
export const partMarksArgTypes = {
  edited: { control: 'boolean' },
  missing: { control: 'boolean' },
  failed: { control: 'boolean' },
  off: { control: 'boolean' },
  bass: { control: 'boolean' },
  size: { control: 'select', options: ['cell', 'strip'] },
} as const;

/** The InSoundCells story's column: each part, its sound and its facts. */
export const soundCells: { part: string; sound: string; facts: P }[] = [
  { part: 'Right 1', sound: 'Grand Piano', facts: {} },
  { part: 'Right 2', sound: 'Strings', facts: { edited: true } },
  { part: 'Right 3', sound: 'Analog Brass', facts: { missing: true } },
  { part: 'Left', sound: 'Fingered Bass', facts: { edited: true, failed: true, bass: true } },
  { part: 'Right 4', sound: 'Choir Aahs', facts: { off: true } },
];

export const partMarksStories = defineFixtures<PartMarksModelProps>()({
  Board: { args: { edited: true } },
  Missing: { args: { missing: true } },
  Failed: { args: { failed: true } },
  Off: { args: { off: true } },
  Bass: { args: { off: true, bass: true } },
  Strip: { args: { edited: true, failed: true, bass: true, size: 'strip' } },
  // The React story lays the marks out after each part and sound name; the Svelte one draws the
  // marks alone. A part with no facts draws nothing, so only the parts with marks are instances.
  InSoundCells: { items: soundCells.map((cell) => cell.facts).filter((facts) => Object.keys(facts).length > 0) },
});

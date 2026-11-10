// SectionName's stories as plain props: SectionName.stories.tsx draws them in either renderer, and
// the tree snapshot records every instance.
import { defineFixtures } from '../../../fixtures';
import type { SectionNameModelProps } from './SectionName.model';

/** The controls, the same in both Storybooks. */
export const sectionNameArgTypes = {
  label: { control: 'text' },
  hue: { control: 'select', options: ['intro', 'main', 'ending', 'brk', 'fill'] },
  state: { control: 'inline-radio', options: ['playing', 'next', 'idle', 'absent'] },
  idle: { control: 'boolean' },
  size: { control: 'text' },
} as const;

export const sectionNameStories = defineFixtures<SectionNameModelProps>()({
  Board: { args: { label: 'Main B', hue: 'main' } },
  Idle: { args: { label: 'Main A', hue: 'main', idle: true } },
  Intro: { args: { label: 'Intro II', hue: 'intro' } },
  AllKinds: {
    args: { label: 'Main A' },
    items: [
      { label: 'Intro I', hue: 'intro' },
      { label: 'Main A', hue: 'main' },
      { label: 'Break', hue: 'brk' },
      { label: 'Fill', hue: 'fill' },
      { label: 'Ending II', hue: 'ending' },
      { label: 'Main C', hue: 'main', state: 'next' },
      { label: 'Main B', hue: 'main', idle: true },
      { label: 'Ending III', hue: 'ending', state: 'absent' },
    ],
  },
  Empty: { args: { label: '', hue: 'main' } },
  Next: { args: { label: 'Main C', hue: 'main', state: 'next' } },
  HeroSize: { args: { label: 'Main B', hue: 'main', size: 'var(--size-display)' } },
});

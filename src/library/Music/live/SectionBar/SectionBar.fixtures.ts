// SectionBar's stories as plain props: SectionBar.stories.tsx draws them with React's or Svelte's
// `Tree`. Hidden Signals' form from the setlist wireframe (INTRO 8, VERSE 16 ×2, CHORUS 16 open,
// BRIDGE 8, OUT free), and the Push's row 7 with its FILL, VAR and NO FORM pads after them. The
// state is controlled contract data: which section plays and which is queued is the host's.
import { defineFixtures } from '../../../fixtures';
import type { LiveSection, SectionBarProps } from './SectionBar.model';

export const songSections: readonly LiveSection[] = [
  { id: 'intro', name: 'INTRO', bars: 8 },
  { id: 'verse', name: 'VERSE', bars: 16, repeat: 2 },
  { id: 'chorus', name: 'CHORUS', bars: 16, open: true },
  { id: 'bridge', name: 'BRIDGE', bars: 8 },
  { id: 'out', name: 'OUT' },
];

/** Row 7 as the ONE wireframe draws it: the form, then FILL, VAR and NO FORM. */
export const rowSections: readonly LiveSection[] = [
  ...songSections,
  { id: 'fill', name: 'FILL', bars: 1 },
  { id: 'var', name: 'VAR ▸' },
  { id: 'no-form', name: 'NO FORM' },
];

/** The verse playing, the chorus queued, the host changing on the phrase. */
export const sectionBarBoard: SectionBarProps = { sections: songSections, current: 'verse', queued: 'chorus', hint: 'change on phrase' };

/** The controls, the same in both Storybooks. */
export const sectionBarArgTypes = {
  sections: { control: 'object' },
  current: { control: 'text' },
  queued: { control: 'text' },
  hint: { control: 'text' },
  form: { control: 'inline-radio', options: ['bars', 'row', 'chip'] },
  onSection: { control: false },
} as const;

/** Every story's args by export name. */
export const sectionBarStories = defineFixtures<SectionBarProps>()({
  Default: { args: { ...sectionBarBoard, form: 'bars' } },
  /** Every state: playing, queued, ready, and an unavailable section with the host's reason. */
  EveryState: {
    args: {
      sections: songSections.map((s) => (s.id === 'bridge' ? { ...s, available: false, reason: 'no bridge loop recorded' } : s)),
      current: 'chorus',
      queued: 'out',
      hint: 'change on bar',
      form: 'bars',
    },
  },
  /** The `row` form: Push row 7's eight cells. */
  Row: { args: { sections: rowSections, current: 'verse', queued: 'chorus', form: 'row' } },
  /** The `chip` form: one line for a header. */
  Dense: { args: { ...sectionBarBoard, form: 'chip' } },
  /** No form at all: a jam. */
  Empty: { args: { sections: [], current: undefined, queued: undefined, hint: undefined, form: 'bars' } },
  Disabled: { args: { ...sectionBarBoard, form: 'bars' } },
});

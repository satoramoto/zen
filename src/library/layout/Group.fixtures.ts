// Group's stories as plain data: Group.stories.tsx (React) and Group.stories.svelte.ts (Svelte)
// both draw them, and parity.test.tsx renders every story's Group in both.
import { defineFixtures } from '../fixtures';
import type { StackAlign } from '../primitives/Stack.model';
import type { Step } from '../primitives/step';
import type { GroupModelProps } from './Group.model';

export const LABELS = ['Intro A', 'Main A', 'Main B', 'Fill A', 'Fill B', 'Break', 'Ending A', 'Ending B'];

/** The stories' controls: the Group's props (`unset` for no align), how many controls, and the width. */
export interface GroupArgs {
  name: string;
  showLabel: boolean;
  aside: string;
  direction: 'row' | 'column';
  wrap: boolean;
  gap: Step;
  align: StackAlign | 'unset';
  count: number;
  width: number;
}

export const groupArgs: GroupArgs = { name: 'Sections', showLabel: true, aside: '', direction: 'row', wrap: false, gap: 2, align: 'unset', count: 4, width: 560 };

export const groupArgTypes = {
  name: { control: 'text' },
  showLabel: { control: 'boolean' },
  aside: { control: 'text' },
  direction: { control: 'inline-radio', options: ['row', 'column'] },
  wrap: { control: 'boolean' },
  gap: { control: { type: 'range', min: 0, max: 6, step: 1 } },
  align: { control: 'inline-radio', options: ['unset', 'start', 'center', 'end', 'stretch', 'baseline'] },
  count: { control: { type: 'range', min: 1, max: LABELS.length, step: 1 } },
  width: { control: { type: 'range', min: 200, max: 900, step: 10 } },
} as const;

/** Each story's args over `groupArgs`. */
export const groupStoryArgs = {
  Default: {},
  WithAside: { aside: '1 / 2' },
  Wrapping: { count: 8, wrap: true, width: 360 },
  ColumnUnlabelled: { direction: 'column', showLabel: false, count: 3, width: 200 },
  InRegion: {},
} satisfies Record<string, Partial<GroupArgs>>;

/** The `align` for a story's args. */
export const aligned = (align: GroupArgs['align']): StackAlign | undefined => (align === 'unset' ? undefined : align);

/** A Group's props in parity fixtures: the model's, with the label and aside as text. */
export type GroupFixtureProps = GroupModelProps & { label?: string | false; aside?: string };

/** The Group props for a story's args. */
export const groupProps = ({ name, showLabel, aside, direction, wrap, gap, align }: GroupArgs): GroupFixtureProps => ({
  name,
  label: showLabel ? undefined : false,
  aside: aside || undefined,
  direction,
  wrap,
  gap,
  align: aligned(align),
});

/** The InRegion story's second group (its controls stand apart from the story's count). */
export const UTILITY_GROUP = { name: 'Utility', aside: 'Transport', labels: ['Sync Start', 'Start / Stop'] };

/** The parity fixtures: each story's (first) Group, its controls' labels standing in as text. */
export const groupStories = defineFixtures<GroupFixtureProps>()(
  Object.fromEntries(
    Object.entries(groupStoryArgs).map(([story, over]) => {
      const args: GroupArgs = { ...groupArgs, ...over };
      return [story, { args: { ...groupProps(args), children: LABELS.slice(0, args.count).join(', ') } }];
    }),
  ) as Record<keyof typeof groupStoryArgs, { args: GroupFixtureProps & { children: string } }>,
);

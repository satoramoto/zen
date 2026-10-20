// Group's stories as plain data: Group.stories.tsx draws them, as view trees (`groupSample`) that
// React's or Svelte's `Tree` renders, and the tree snapshot (view/snapshot.test.ts) records both
// `groupView` for every fixture of `groupStories` and every story's sample.
import { defineFixtures } from '../fixtures';
import type { StackAlign } from '../primitives/Stack.model';
import type { Step } from '../primitives/step';
import { component, h, type Child, type Node } from '../view/Tree.model';
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

export type GroupStory = keyof typeof groupStoryArgs;

/** The `align` for a story's args. */
export const aligned = (align: GroupArgs['align']): StackAlign | undefined => (align === 'unset' ? undefined : align);

/** A Group's props in fixtures: the model's, with the label and aside as text. */
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

/** The fixtures: each story's (first) Group, its controls' labels standing in as text. */
export const groupStories = defineFixtures<GroupFixtureProps>()(
  Object.fromEntries(
    Object.entries(groupStoryArgs).map(([story, over]) => {
      const args: GroupArgs = { ...groupArgs, ...over };
      return [story, { args: { ...groupProps(args), children: LABELS.slice(0, args.count).join(', ') } }];
    }),
  ) as Record<GroupStory, { args: GroupFixtureProps & { children: string } }>,
);

/* ---------- the stories as view trees (Group holding registered components) ---------- */

/** A sample's args: the story's controls and which story it is. */
export type GroupSampleArgs = GroupArgs & { story: GroupStory };

/** Every story's args, for the sample snapshot. */
export const groupSampleStories = defineFixtures<GroupSampleArgs>()(
  Object.fromEntries((Object.keys(groupStoryArgs) as GroupStory[]).map((story) => [story, { args: { ...groupArgs, ...groupStoryArgs[story], story } }])) as Record<
    GroupStory,
    { args: GroupSampleArgs }
  >,
);

/** The first `count` labels as Buttons (the second the primary): stand-ins for the controls. */
const buttons = (count: number): Child[] =>
  LABELS.slice(0, count).map((label, i) => component('Button', { label, variant: i === 1 ? 'primary' : 'secondary' }, { key: label }));

/**
 * A story's tree, `width` wide: the Group with Buttons standing in for its controls; InRegion, two
 * Groups (the story's, and `UTILITY_GROUP`) in a Pads Region at gap step 4.
 */
export function groupSample(a: GroupSampleArgs): Node {
  const frame = (child: Child) => h('div', { style: `width: ${a.width}px` }, child);
  if (a.story !== 'InRegion') return frame(component('Group', { ...groupProps(a) }, { slots: { children: buttons(a.count) } }));
  return frame(
    component(
      'Region',
      { name: 'Pads', label: 'Pads', gap: 4 },
      {
        slots: {
          children: [
            component('Group', { name: 'Sections', direction: a.direction, wrap: a.wrap, gap: a.gap, align: aligned(a.align) }, { slots: { children: buttons(a.count) } }),
            component(
              'Group',
              { name: UTILITY_GROUP.name, aside: UTILITY_GROUP.aside, gap: a.gap, align: aligned(a.align) },
              { slots: { children: UTILITY_GROUP.labels.map((label) => component('Button', { label }, { key: label })) } },
            ),
          ],
        },
      },
    ),
  );
}

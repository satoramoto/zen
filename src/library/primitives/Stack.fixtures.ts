// Stack's stories as plain data: Stack.stories.tsx (React) and Stack.stories.svelte.ts (Svelte)
// both draw them, and parity.test.tsx renders every story's Stack in both.
import type { Fixtures } from '../fixtures';
import type { StackAlign, StackJustify, StackModelProps } from './Stack.model';
import type { Step } from './step';

export const LABELS = ['Intro', 'Main A', 'Main B', 'Fill', 'Break', 'Ending', 'Sync', 'Start / Stop'];

/** The stories' controls: the Stack's props (`unset` for none), how many buttons, and the width. */
export interface StackArgs {
  direction: 'row' | 'column';
  gap: Step;
  align: StackAlign | 'unset';
  justify: StackJustify | 'unset';
  wrap: boolean;
  count: number;
  width: number;
}

export const stackArgs: StackArgs = { direction: 'row', gap: 2, align: 'unset', justify: 'unset', wrap: false, count: 4, width: 560 };

export const stackArgTypes = {
  direction: { control: 'inline-radio', options: ['row', 'column'] },
  gap: { control: { type: 'range', min: 0, max: 6, step: 1 } },
  align: { control: 'inline-radio', options: ['unset', 'start', 'center', 'end', 'stretch', 'baseline'] },
  justify: { control: 'inline-radio', options: ['unset', 'start', 'center', 'end', 'between', 'around'] },
  wrap: { control: 'boolean' },
  count: { control: { type: 'range', min: 1, max: LABELS.length, step: 1 } },
  width: { control: { type: 'range', min: 200, max: 900, step: 10 } },
} as const;

/** Each story's args over `stackArgs`. */
export const stackStoryArgs = {
  Playground: {},
  Column: { direction: 'column', align: 'start', count: 3, width: 240 },
  Wrapping: { count: 8, wrap: true, width: 360 },
  Between: { count: 3, justify: 'between' },
} satisfies Record<string, Partial<StackArgs>>;

/** The Stack props for a story's args. */
export const stackProps = ({ direction, gap, align, justify, wrap }: StackArgs): StackModelProps => ({
  direction,
  gap,
  align: align === 'unset' ? undefined : align,
  justify: justify === 'unset' ? undefined : justify,
  wrap,
});

/** The parity fixtures: each story's Stack, its buttons' labels standing in as text. */
export const stackStories: Fixtures<StackModelProps> = Object.fromEntries(
  Object.entries(stackStoryArgs).map(([name, over]) => {
    const args: StackArgs = { ...stackArgs, ...over };
    return [name, { args: { ...stackProps(args), children: LABELS.slice(0, args.count).join(', ') } }];
  }),
);

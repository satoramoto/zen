// Stack's stories as plain data: Stack.stories.tsx draws them as view trees (`stackSample`) in
// either renderer, parity.test.tsx renders every story's Stack with both Stack components, and the
// tree snapshot draws each with `stackNode`.
import type { Fixtures } from '../fixtures';
import { component, h, type Node } from '../view/Tree.model';
import { stackNode, type StackAlign, type StackJustify, type StackModelProps } from './Stack.model';
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

/** A story's tree: a Stack of registered Buttons (the first primary) in a box of the args' width. */
export const stackSample = (args: StackArgs): Node =>
  h(
    'div',
    { style: `width: ${args.width}px` },
    stackNode(
      stackProps(args),
      {},
      LABELS.slice(0, args.count).map((label, i) => component('Button', { label, variant: i === 0 ? 'primary' : 'secondary' }, { key: label })),
    ),
  );

/** The parity fixtures: each story's Stack, its buttons' labels standing in as text. */
export const stackStories: Fixtures<StackModelProps> = Object.fromEntries(
  Object.entries(stackStoryArgs).map(([name, over]) => {
    const args: StackArgs = { ...stackArgs, ...over };
    return [name, { args: { ...stackProps(args), children: LABELS.slice(0, args.count).join(', ') } }];
  }),
);

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/core';
import type { Step } from './step';
import { withLibraryTheme } from '../storybook';
import { Stack, type StackAlign, type StackJustify } from './Stack';

const LABELS = ['Intro', 'Main A', 'Main B', 'Fill', 'Break', 'Ending', 'Sync', 'Start / Stop'];

interface StackArgs {
  direction: 'row' | 'column';
  gap: Step;
  align: StackAlign | 'unset';
  justify: StackJustify | 'unset';
  wrap: boolean;
  count: number;
  width: number;
}

const meta: Meta<StackArgs> = {
  title: 'Design OS/Primitives/Stack',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { direction: 'row', gap: 2, align: 'unset', justify: 'unset', wrap: false, count: 4, width: 560 },
  argTypes: {
    direction: { control: 'inline-radio', options: ['row', 'column'] },
    gap: { control: { type: 'range', min: 0, max: 6, step: 1 } },
    align: { control: 'inline-radio', options: ['unset', 'start', 'center', 'end', 'stretch', 'baseline'] },
    justify: { control: 'inline-radio', options: ['unset', 'start', 'center', 'end', 'between', 'around'] },
    wrap: { control: 'boolean' },
    count: { control: { type: 'range', min: 1, max: LABELS.length, step: 1 } },
    width: { control: { type: 'range', min: 200, max: 900, step: 10 } },
  },
  render: ({ direction, gap, align, justify, wrap, count, width }) => (
    <div style={{ width }}>
      <Stack
        direction={direction}
        gap={gap}
        align={align === 'unset' ? undefined : align}
        justify={justify === 'unset' ? undefined : justify}
        wrap={wrap}
      >
        {LABELS.slice(0, count).map((label, i) => (
          <Button key={label} label={label} variant={i === 0 ? 'primary' : 'secondary'} />
        ))}
      </Stack>
    </div>
  ),
};
export default meta;
type Story = StoryObj<StackArgs>;

/** Controls in a row with a scale step between them: change `gap` and the space changes, nothing else. */
export const Playground: Story = {};

/** A column: the default direction of a bare Stack. */
export const Column: Story = { args: { direction: 'column', align: 'start', count: 3, width: 240 } };

/** Wrapping onto more lines when the row is full (narrow the width). */
export const Wrapping: Story = { args: { count: 8, wrap: true, width: 360 } };

/** Spread across the line: `justify="between"`. */
export const Between: Story = { args: { count: 3, justify: 'between' } };

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/core';
import { withLibraryTheme } from '../storybook';
import { Stack } from './Stack';
import { LABELS, stackArgTypes, stackArgs, stackProps, stackStoryArgs, type StackArgs } from './Stack.fixtures';

// The args and controls come from Stack.fixtures.ts, which the Svelte stories and the parity test share.
const meta: Meta<StackArgs> = {
  title: 'Design OS/Primitives/Stack',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: stackArgs,
  argTypes: stackArgTypes,
  render: (args) => (
    <div style={{ width: args.width }}>
      <Stack {...stackProps(args)}>
        {LABELS.slice(0, args.count).map((label, i) => (
          <Button key={label} label={label} variant={i === 0 ? 'primary' : 'secondary'} />
        ))}
      </Stack>
    </div>
  ),
};
export default meta;
type Story = StoryObj<StackArgs>;

/** Controls in a row with a scale step between them: change `gap` and the space changes, nothing else. */
export const Playground: Story = { args: stackStoryArgs.Playground };

/** A column: the default direction of a bare Stack. */
export const Column: Story = { args: stackStoryArgs.Column };

/** Wrapping onto more lines when the row is full (narrow the width). */
export const Wrapping: Story = { args: stackStoryArgs.Wrapping };

/** Spread across the line: `justify="between"`. */
export const Between: Story = { args: stackStoryArgs.Between };

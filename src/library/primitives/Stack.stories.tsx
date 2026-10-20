import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../storybook';
import { treeStory, withRenderer } from '../stories/story';
import { stackArgTypes, stackArgs, stackSample, stackStoryArgs, type StackArgs } from './Stack.fixtures';

// The args, controls and story tree come from Stack.fixtures.ts (`stackNode` holding registered
// Buttons); the toolbar's Renderer draws it with React's or Svelte's `Tree`.
const sample = treeStory<StackArgs>((args) => ({ tree: stackSample(args) }));

const meta: Meta<StackArgs> = {
  title: 'Design OS/Primitives/Stack',
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen', ...sample.parameters },
  args: stackArgs,
  argTypes: stackArgTypes,
  render: sample.render,
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

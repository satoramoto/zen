import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { treeStory, withRenderer, type StoryView } from '../../../stories/story';
import { deviceFaceHandlers } from './DeviceFace.model';
import { deviceFaceArgTypes, deviceFaceStories as s, deviceParamsSample, type DeviceFaceStoryProps } from './DeviceFace.fixtures';
import { component, type Handlers, type Root } from '../../../view/Tree.model';

// Every story draws the face as a component node with the params slot filled (`treeStory`), so the
// toolbar's Renderer draws it with React's or Svelte's `Tree` — the same way MixBand draws it.

interface DeviceFaceArgs extends DeviceFaceStoryProps {
  onToggle: (on: boolean) => void;
  onFold: (folded: boolean) => void;
  onSelect: () => void;
}

const meta: Meta<DeviceFaceArgs> = {
  title: 'Design OS/Components/Music/DeviceFace',
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { name: 'FX A Delay', on: true, withParams: true, onToggle: fn(), onFold: fn(), onSelect: fn(), onParam: fn() },
  argTypes: deviceFaceArgTypes,
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The story's tree: the face as a component node, the params slot filled, callbacks as spies. */
const sample = (args: DeviceFaceArgs): { tree: Root; handlers: Handlers } => {
  const { withParams, onParam, onToggle, onFold, onSelect, name, ...rest } = args;
  const data = { name: name ?? 'Device', ...rest };
  return {
    tree: component(
      'DeviceFace',
      data,
      {
        slots: withParams ? { params: deviceParamsSample } : {},
        on: { onToggle: 'power', onFold: 'fold', onSelect: 'select' },
      },
    ),
    handlers: {
      ...deviceFaceHandlers({ ...data, onToggle, onFold, onSelect }),
      time: (delta: number) => onParam?.('time', delta),
      feedback: (delta: number) => onParam?.('feedback', delta),
      mix: (value: number) => onParam?.('mix', value),
    },
  };
};
/** A story from a fixture: the face node with the fixture's args. */
const storyOf = (fixture: { args?: object; items?: object[] }, extra: Partial<Story> = {}): Story => ({
  ...treeStory(sample as StoryView<DeviceFaceArgs>),
  args: { ...meta.args, ...fixture.args } as DeviceFaceArgs,
  ...extra,
});

/** The delay face, on, params underneath: power asks for `false`. */
export const Default: Story = storyOf(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'FX A Delay power' }));
    await expect(args.onToggle).toHaveBeenCalledWith(false);
  },
});

/** On and pointed at, on, off, and folded: every face at once. */
export const EveryState: Story = storyOf(s.EveryState);

/** The same face in a narrow frame. */
export const Dense: Story = storyOf(s.Dense);

/** No device: the empty face, no params. */
export const Empty: Story = storyOf(s.Empty);

/** Drawn but deaf: dimmed, nothing fires. */
export const Disabled: Story = storyOf(s.Disabled);

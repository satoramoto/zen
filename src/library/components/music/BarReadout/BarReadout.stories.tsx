import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, treeStory, withRenderer } from '../../../stories/story';
import { BarReadout } from './BarReadout';
import BarReadoutSvelte from './BarReadout.svelte';
import { barReadoutArgTypes, barReadoutArgs, barReadoutGroupSample, barReadoutStories as s } from './BarReadout.fixtures';

// Every story is built from BarReadout.fixtures.ts (`story(s.Name)`), which the tree snapshot
// shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`. Group is a view tree from
// the fixtures (`treeStory`), its rows stacked.
const meta = {
  title: 'Design OS/Components/Music/BarReadout',
  component: BarReadout,
  decorators: [
    withRenderer,
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
    withLibraryTheme,
  ],
  parameters: { layout: 'centered' },
  args: { ...barReadoutArgs, onChange: fn() },
  argTypes: barReadoutArgTypes,
} satisfies Meta<typeof BarReadout>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(BarReadout, BarReadoutSvelte);

/** Level 90 of 0–127: → sends 91. */
export const Level: Story = {
  ...story(s.Level),
  play: async ({ canvasElement, args }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Level' });
    await expect(slider).toHaveAttribute('aria-valuenow', '90');
    await expect(slider).toHaveAttribute('aria-valuetext', 'Level 90');
    await expect(slider).toHaveAttribute('data-tip', 'mixer.channel.level');
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onChange).toHaveBeenLastCalledWith(91);
  },
};

/** Pan right of centre, filled from the centre: "R6". */
export const Pan: Story = {
  ...story(s.Pan),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('slider')).toHaveAttribute('aria-valuetext', 'Pan R6');
  },
};

/** The low EQ frequency at 120 Hz: the bar sits at its nearest step of the XG table. */
export const LowFreq: Story = {
  ...story(s.LowFreq),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('slider')).toHaveAttribute('aria-valuetext', 'Low freq 120 Hz');
  },
};

/** An insert setting with the state's own text: "0.50" with "Hz" small after it. */
export const Display: Story = {
  ...story(s.Display),
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent('0.50Hz');
  },
};

/** The compressor's ratio in tenths: "3:1". */
export const Ratio: Story = {
  ...story(s.Ratio),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('slider')).toHaveAttribute('aria-valuetext', 'Ratio 3:1');
  },
};

/** The hardware fader hasn't reached the level yet: "Level ↕". */
export const Waiting: Story = {
  ...story(s.Waiting),
  play: async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Level' });
    await expect(slider).toHaveAttribute('aria-valuetext', 'Level 90, hardware fader away');
  },
};

/** A send that isn't there: "—", faint, a dashed track, focusable, sends nothing. */
export const Disabled: Story = {
  ...story(s.Disabled),
  play: async ({ canvasElement, args }) => {
    const slider = within(canvasElement).getByRole('slider');
    await expect(slider).toHaveAttribute('aria-disabled', 'true');
    await expect(slider).toHaveAttribute('aria-valuetext', 'Send 5, not added');
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/** Added: a group as the Channel page stacks it, so the values line up on their last digit. */
export const Group: Story = treeStory(() => ({ tree: barReadoutGroupSample(s.Group.items!) }));

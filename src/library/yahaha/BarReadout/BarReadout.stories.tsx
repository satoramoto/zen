import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { BarReadout } from './BarReadout';
import { HIGH_STEPS, LOW_STEPS } from './bar';

const meta = {
  title: 'Library/Yahaha/Primitives/BarReadout',
  component: BarReadout,
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
    withLibraryTheme,
  ],
  parameters: { layout: 'centered' },
  args: {
    label: 'Level',
    value: 90,
    min: 0,
    max: 127,
    default: 100,
    kind: 'number',
    tip: 'mixer.channel.level',
    onChange: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    value: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    steps: { control: 'object' },
    kind: { control: 'select', options: ['number', 'db', 'ms', 'hz', 'pan', 'offset', 'ratio', 'display'] },
    display: { control: 'text' },
    bipolar: { control: 'boolean' },
    default: { control: 'number' },
    disabled: { control: 'boolean' },
    absent: { control: 'text' },
    waiting: { control: 'boolean' },
    suffix: { control: 'text' },
    name: { control: 'text' },
    tip: { control: 'text' },
  },
} satisfies Meta<typeof BarReadout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Level 90 of 0–127: → sends 91. */
export const Level: Story = {
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
  args: { label: 'Pan', value: 70, default: 64, kind: 'pan', bipolar: true, tip: 'mixer.channel.pan' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('slider')).toHaveAttribute('aria-valuetext', 'Pan R6');
  },
};

/** The low EQ frequency at 120 Hz: the bar sits at its nearest step of the XG table. */
export const LowFreq: Story = {
  args: { label: 'Low freq', value: 120, min: 32, max: 2000, steps: LOW_STEPS, kind: 'hz', default: 80, tip: undefined },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('slider')).toHaveAttribute('aria-valuetext', 'Low freq 120 Hz');
  },
};

/** An insert setting with the state's own text: "0.50" with "Hz" small after it. */
export const Display: Story = {
  args: { label: 'Speed', value: 40, default: 64, kind: 'display', display: '0.50 Hz', tip: undefined },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent('0.50Hz');
  },
};

/** The compressor's ratio in tenths: "3:1". */
export const Ratio: Story = {
  args: { label: 'Ratio', value: 30, min: 10, max: 200, default: 30, kind: 'ratio', tip: undefined },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('slider')).toHaveAttribute('aria-valuetext', 'Ratio 3:1');
  },
};

/** The hardware fader hasn't reached the level yet: "Level ↕". */
export const Waiting: Story = {
  args: { waiting: true },
  play: async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Level' });
    await expect(slider).toHaveAttribute('aria-valuetext', 'Level 90, hardware fader away');
  },
};

/** A send that isn't there: "—", faint, a dashed track, focusable, sends nothing. */
export const Disabled: Story = {
  args: { label: 'Send 5', value: 0, default: 0, disabled: true, absent: 'not added', tip: undefined },
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
export const Group: Story = {
  render: () => (
    <div>
      <BarReadout label="Level" value={90} min={0} max={127} default={100} />
      <BarReadout label="Pan" value={52} min={0} max={127} default={64} kind="pan" bipolar />
      <BarReadout label="Gain" value={-18} min={-48} max={0} default={0} kind="db" />
      <BarReadout label="High freq" value={8000} min={500} max={16000} steps={HIGH_STEPS} kind="hz" default={4000} />
      <BarReadout label="Attack" value={12} min={0} max={40} default={1} kind="ms" />
      <BarReadout label="Transpose" value={76} min={0} max={127} default={64} kind="offset" bipolar waiting />
      <BarReadout label="Send 5" value={0} min={0} max={127} default={0} disabled absent="not added" />
    </div>
  ),
};

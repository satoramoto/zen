import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Readout, type ReadoutProps } from './Readout';
import { splitUnit } from './adjust';

const meta = {
  title: 'Design OS/Components/Core/Readout',
  component: Readout,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
    withLibraryTheme,
  ],
  parameters: { layout: 'fullscreen' },
  args: {
    label: 'Feedback',
    value: 38,
    min: 0,
    max: 90,
    defaultValue: 38,
    display: '38%',
    code: 'K6',
    tip: 'fx.param.delay_feedback',
    onChange: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    value: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    defaultValue: { control: 'number' },
    display: { control: 'text' },
    code: { control: 'text' },
    disabled: { control: 'boolean' },
    name: { control: 'text' },
    tip: { control: 'text' },
  },
} satisfies Meta<typeof Readout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board's Delay Feedback: 38% of 0–90, on K6. The arrows, End and Space. */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Feedback' });
    await expect(slider).toHaveAttribute('aria-valuetext', 'Feedback 38%');
    await expect(slider).toHaveAttribute('data-tip', 'fx.param.delay_feedback');
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onChange).toHaveBeenLastCalledWith(39);
    await userEvent.keyboard('{End}');
    await expect(args.onChange).toHaveBeenLastCalledWith(90);
    await userEvent.keyboard(' ');
    await expect(args.onChange).toHaveBeenCalledTimes(2);
    await fireEvent.dblClick(slider);
    await expect(args.onChange).toHaveBeenCalledTimes(2);
  },
};

/** A value with a unit: the number large, "kHz" smaller after it (Delay Tone). */
export const WithUnit: Story = {
  args: { label: 'Tone', value: 50, min: 10, max: 200, defaultValue: 50, display: '5.0 kHz', code: 'K7', tip: 'fx.param.delay_tone' },
};

/** No Launchkey knob moves it: the code column stays, empty, so the rows still line up. */
export const NoCode: Story = {
  args: { label: 'Band send', value: 0, min: 0, max: 127, defaultValue: 0, display: '0%', code: '', tip: 'fx.variation_band' },
};

/** Shown, not settable: the label and value fade, the bar empties, nothing is sent. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Feedback' });
    await expect(slider).toHaveAttribute('aria-disabled', 'true');
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/** Story-only: keeps the value you set (re-seeded when the value control changes), shown with the display's unit. */
function ReadoutPlayground(props: ReadoutProps) {
  const [seed, setSeed] = useState(props.value);
  const [value, setValue] = useState(props.value);
  if (seed !== props.value) {
    setSeed(props.value);
    setValue(props.value);
  }
  const unit = splitUnit(props.display ?? '')[1];
  const display =
    value === props.value ? props.display : unit === '%' ? `${value}%` : unit ? `${value} ${unit}` : String(value);
  return (
    <Readout
      {...props}
      value={value}
      display={display}
      onChange={(next) => {
        setValue(next);
        props.onChange?.(next);
      }}
    />
  );
}

/** Play with it: a story-only wrapper keeps the value you set; each change still logs as an action. */
export const Playground: Story = {
  render: (args) => <ReadoutPlayground {...args} />,
  play: async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Feedback' });
    slider.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect(slider).toHaveAttribute('aria-valuetext', 'Feedback 40%');
  },
};

/** A page of parameters: the knob codes, bars and numbers line up down the column. */
export const Column: Story = {
  render: (args) => (
    <div>
      <Readout {...args} />
      <Readout {...args} label="Tone" value={50} min={10} max={200} display="5.0 kHz" code="K7" />
      <Readout {...args} label="Time" value={9} min={0} max={20} display="1/8" code="K8" />
      <Readout {...args} label="Band send" value={0} display="0%" code="" />
    </div>
  ),
};

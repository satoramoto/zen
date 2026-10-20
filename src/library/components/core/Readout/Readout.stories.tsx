import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { Readout, type ReadoutProps } from './Readout';
import ReadoutSvelte from './Readout.svelte';
import { readoutArgTypes, readoutStories as s } from './Readout.fixtures';
import { splitUnit } from './adjust';

// Every story but the live ones is built from Readout.fixtures.ts (`story(s.Name)`), which the tree
// snapshot shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`.

const meta = {
  title: 'Design OS/Components/Core/Readout',
  component: Readout,
  decorators: [
    withRenderer,
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
    withLibraryTheme,
  ],
  parameters: { layout: 'fullscreen' },
  args: { ...(s.Default.args as ReadoutProps), onChange: fn() },
  argTypes: readoutArgTypes,
} satisfies Meta<typeof Readout>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Readout, ReadoutSvelte);

/** The board's Delay Feedback: 38% of 0–90, on K6. The arrows, End and Space. */
export const Default: Story = {
  ...story(s.Default),
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
export const WithUnit: Story = story(s.WithUnit);

/** No Launchkey knob moves it: the code column stays, empty, so the rows still line up. */
export const NoCode: Story = story(s.NoCode);

/** Shown, not settable: the label and value fade, the bar empties, nothing is sent. */
export const Disabled: Story = {
  ...story(s.Disabled),
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

/** Play with it: a story-only wrapper keeps the value you set; each change still logs as an action. Its own React `render` (live state), so it stays React-only. */
export const Playground: Story = {
  render: (args) => <ReadoutPlayground {...args} />,
  play: async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Feedback' });
    slider.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect(slider).toHaveAttribute('aria-valuetext', 'Feedback 40%');
  },
};

/**
 * A page of parameters: the knob codes, bars and numbers line up down the column. The fixture's
 * rows stacked in a block (a fixture's items draw in a row), so it keeps its own React `render`.
 */
export const Column: Story = {
  ...story(s.Column, {
    render: (args) => (
      <div>
        {(s.Column.items ?? []).map((item, i) => (
          <Readout key={i} {...args} {...(item as Partial<ReadoutProps>)} />
        ))}
      </div>
    ),
  }),
};

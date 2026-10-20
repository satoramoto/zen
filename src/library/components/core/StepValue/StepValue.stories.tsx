import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { StepValue, type StepValueProps } from './StepValue';
import StepValueSvelte from './StepValue.svelte';
import { stepValueArgTypes, stepValueStories as s } from './StepValue.fixtures';

// Every story but the live ones is built from StepValue.fixtures.ts (`story(s.Name)`), which the
// tree snapshot shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`.

const meta = {
  title: 'Design OS/Components/Core/StepValue',
  component: StepValue,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { ...(s.Default.args as StepValueProps), tipAction: fn(), onchange: fn() },
  argTypes: stepValueArgTypes,
} satisfies Meta<typeof StepValue>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(StepValue, StepValueSvelte);

/** Right 2's send to the Delay: a pink swatch by the tag, 16 in full ink. Keys step it. */
export const Default: Story = {
  ...story(s.Default),
  play: async ({ canvasElement, args }) => {
    const step = within(canvasElement).getByRole('slider', { name: 'Right 2 delay send' });
    await expect(step).toHaveAttribute('aria-valuetext', '16');
    await expect(step).toHaveAttribute('data-tip', 'fx.send_param');
    step.focus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(args.onchange).toHaveBeenLastCalledWith(17);
    await userEvent.keyboard('{Home}');
    await expect(args.onchange).toHaveBeenLastCalledWith(0);
  },
};

/** A part that doesn't sound: the tag and value faded, still settable. */
export const Dim: Story = story(s.Dim);

/** A table cell: plain text ink, no tag (a Master EQ band's gain). */
export const TableCell: Story = story(s.TableCell);

/** Shown, not settable: faded, nothing is sent. */
export const Disabled: Story = {
  ...story(s.Disabled),
  play: async ({ canvasElement, args }) => {
    const step = within(canvasElement).getByRole('slider', { name: 'Right 2 delay send' });
    await expect(step).toHaveAttribute('aria-disabled', 'true');
    step.focus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(args.onchange).not.toHaveBeenCalled();
  },
};

/**
 * Added: a column of sends, one per part, held in state so drag, wheel and keys move it. Its own
 * React `render` (live state), so it stays React-only.
 */
export const SendColumn: Story = {
  render: function SendColumn() {
    const parts = [
      { tag: 'T', hue: 't', name: 'Tutti delay send' },
      { tag: 'R1', hue: 1, name: 'Right 1 delay send' },
      { tag: 'R2', hue: 2, name: 'Right 2 delay send' },
      { tag: 'R3', hue: 3, name: 'Right 3 delay send', dim: true },
      { tag: 'L', hue: 4, name: 'Left delay send' },
    ] as const;
    const [values, setValues] = useState<number[]>([0, 32, 16, 0, 101]);
    return (
      <div style={{ display: 'inline-grid', gap: 'var(--space-1)', minWidth: 120 }}>
        {parts.map((part, i) => (
          <StepValue
            key={part.tag}
            {...part}
            value={values[i]}
            defaultValue={0}
            onchange={(v) => setValues((vs) => vs.map((x, j) => (j === i ? v : x)))}
          />
        ))}
      </div>
    );
  },
};

/** Added: Master EQ gains as table cells, signed, held in state. Its own React `render` (live state), so it stays React-only. */
export const GainRow: Story = {
  render: function GainRow() {
    const [gains, setGains] = useState<number[]>([4, 0, -3, -12]);
    const signed = (v: number) => (v > 0 ? `+${v}` : String(v));
    return (
      <div className="lib-row">
        {gains.map((g, i) => (
          <StepValue
            key={i}
            value={g}
            min={-12}
            max={12}
            defaultValue={0}
            ink="t"
            display={signed(g)}
            valuetext={`${signed(g)} dB`}
            name={`Band ${i + 1} gain`}
            onchange={(v) => setGains((gs) => gs.map((x, j) => (j === i ? v : x)))}
          />
        ))}
      </div>
    );
  },
};

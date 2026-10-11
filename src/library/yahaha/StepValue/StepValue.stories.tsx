import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { StepValue } from './StepValue';

const meta = {
  title: 'Library/Yahaha/Primitives/StepValue',
  component: StepValue,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    value: 16,
    min: 0,
    max: 127,
    defaultValue: 0,
    tag: 'R2',
    hue: 'r2',
    name: 'Right 2 delay send',
    tip: 'fx.send_param',
    tipAction: fn(),
    onchange: fn(),
  },
  argTypes: {
    value: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    defaultValue: { control: 'number' },
    display: { control: 'text' },
    tag: { control: 'text' },
    hue: { control: 'select', options: ['t', 'r1', 'r2', 'r3', 'l'] },
    ink: { control: 'select', options: ['a', 't'] },
    dim: { control: 'boolean' },
    disabled: { control: 'boolean' },
    span: { control: 'number' },
    name: { control: 'text' },
    valuetext: { control: 'text' },
    tip: { control: 'text' },
  },
} satisfies Meta<typeof StepValue>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Right 2's send to the Delay: a pink swatch by the tag, 16 in full ink. Keys step it. */
export const Default: Story = {
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
export const Dim: Story = {
  args: { tag: 'R3', hue: 'r3', value: 0, dim: true, name: 'Right 3 delay send' },
};

/** A table cell: plain text ink, no tag (a Master EQ band's gain). */
export const TableCell: Story = {
  args: { tag: undefined, value: 4, min: -12, max: 12, display: '+4', ink: 't', name: 'Band 1 gain', valuetext: '+4 dB', tip: 'fx.master_eq_gain' },
};

/** Shown, not settable: faded, nothing is sent. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const step = within(canvasElement).getByRole('slider', { name: 'Right 2 delay send' });
    await expect(step).toHaveAttribute('aria-disabled', 'true');
    step.focus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(args.onchange).not.toHaveBeenCalled();
  },
};

/** Added: a column of sends, one per part, held in state so drag, wheel and keys move it. */
export const SendColumn: Story = {
  render: function SendColumn() {
    const parts = [
      { tag: 'T', hue: 't', name: 'Tutti delay send' },
      { tag: 'R1', hue: 'r1', name: 'Right 1 delay send' },
      { tag: 'R2', hue: 'r2', name: 'Right 2 delay send' },
      { tag: 'R3', hue: 'r3', name: 'Right 3 delay send', dim: true },
      { tag: 'L', hue: 'l', name: 'Left delay send' },
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

/** Added: Master EQ gains as table cells, signed, held in state. */
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

import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import StepValue from './StepValue.svelte'

/**
 * A value set in place, with no bar: an optional tag in its hue ("R2") then the value. The
 * Readout's handling in a small cell (a part's send, a Master EQ band's gain, a style insert's
 * amount): press and drag sideways, a wheel notch or an arrow key steps it, Page Up / Down by ten,
 * Home and End to the ends, a double-click back to its default. Controlled: it asks for a new value
 * through `onchange`.
 */
const meta = {
  title: 'Primitives/StepValue',
  component: StepValue,
  parameters: { layout: 'centered' },
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
} satisfies Meta<typeof StepValue>

export default meta
type Story = StoryObj<typeof meta>

/** Right 2's send to the Delay: the tag in pink, 16 in the accent. Keys step it. */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const step = within(canvasElement).getByRole('slider', { name: 'Right 2 delay send' })
    await expect(step).toHaveAttribute('aria-valuetext', '16')
    await expect(step).toHaveAttribute('data-tip', 'fx.send_param')
    step.focus()
    await userEvent.keyboard('{ArrowUp}')
    await expect(args.onchange).toHaveBeenLastCalledWith(17)
    await userEvent.keyboard('{Home}')
    await expect(args.onchange).toHaveBeenLastCalledWith(0)
  },
}

/** A part that doesn't sound: the tag and value faded, still settable. */
export const Dim: Story = {
  args: { tag: 'R3', hue: 'r3', value: 0, dim: true, name: 'Right 3 delay send' },
}

/** A table cell: plain text ink, no tag (a Master EQ band's gain). */
export const TableCell: Story = {
  args: { tag: undefined, value: 4, min: -12, max: 12, display: '+4', ink: 't', name: 'Band 1 gain', valuetext: '+4 dB', tip: 'fx.master_eq_gain' },
}

/** Shown, not settable: faded, nothing is sent. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const step = within(canvasElement).getByRole('slider', { name: 'Right 2 delay send' })
    await expect(step).toHaveAttribute('aria-disabled', 'true')
    step.focus()
    await userEvent.keyboard('{ArrowUp}')
    await expect(args.onchange).not.toHaveBeenCalled()
  },
}

import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import BarReadout from './BarReadout.svelte'
import { LOW_STEPS } from './bar'

/**
 * One row of the Channel page's groups: the label, a thin bar (a 2px track, the fill and a 2×12
 * cap in `--neutral`, which the page points at the part's hue) and the value with its unit small
 * after it. The bar is a slider: drag sideways anywhere on it (relative, 2px a unit, Shift 8px),
 * the wheel and arrows step one, Page Up / Page Down ten, Home and End the ends, a double-click
 * resets. Disabled (a send that isn't there) reads "—" in the absent ink and sends nothing.
 */
const meta = {
  title: 'Primitives/BarReadout',
  component: BarReadout,
  parameters: { layout: 'centered' },
  args: {
    label: 'Level',
    value: 90,
    min: 0,
    max: 127,
    default: 100,
    kind: 'number',
    tip: 'mixer.channel.level',
    onchange: fn(),
    tipAction: fn(),
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
} satisfies Meta<typeof BarReadout>

export default meta
type Story = StoryObj<typeof meta>

/** Level 90 of 0–127: → sends 91. */
export const Level: Story = {
  play: async ({ canvasElement, args }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Level' })
    await expect(slider).toHaveAttribute('aria-valuenow', '90')
    await expect(slider).toHaveAttribute('aria-valuetext', 'Level 90')
    await expect(slider).toHaveAttribute('data-tip', 'mixer.channel.level')
    await expect(args.tipAction).toHaveBeenCalledWith(slider, 'mixer.channel.level')
    slider.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenLastCalledWith(91)
  },
}

/** Pan at the centre, filled from the centre: "C". */
export const Pan: Story = {
  args: { label: 'Pan', value: 70, default: 64, kind: 'pan', bipolar: true, tip: 'mixer.channel.pan' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('slider')).toHaveAttribute('aria-valuetext', 'Pan R6')
  },
}

/** The low EQ frequency at 120 Hz: the bar sits at its nearest step of the XG table. */
export const LowFreq: Story = {
  args: { label: 'Low freq', value: 120, min: 32, max: 2000, steps: LOW_STEPS, kind: 'hz', default: 80, tip: undefined },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('slider')).toHaveAttribute('aria-valuetext', 'Low freq 120 Hz')
  },
}

/** An insert setting with the state's own text: "0.50" with "Hz" small after it. */
export const Display: Story = {
  args: { label: 'Speed', value: 40, default: 64, kind: 'display', display: '0.50 Hz', tip: undefined },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent('0.50Hz')
  },
}

/** The compressor's ratio in tenths: "3:1". */
export const Ratio: Story = {
  args: { label: 'Ratio', value: 30, min: 10, max: 200, default: 30, kind: 'ratio', tip: undefined },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('slider')).toHaveAttribute('aria-valuetext', 'Ratio 3:1')
  },
}

/** The hardware fader hasn't reached the level yet: "Level ↕". */
export const Waiting: Story = {
  args: { waiting: true },
  play: async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Level' })
    await expect(slider).toHaveAttribute('aria-valuetext', 'Level 90, hardware fader away')
  },
}

/** A send that isn't there: "—" in the absent ink, focusable, sends nothing. */
export const Disabled: Story = {
  args: { label: 'Send 5', value: 0, default: 0, disabled: true, absent: 'not added', tip: undefined },
  play: async ({ canvasElement, args }) => {
    const slider = within(canvasElement).getByRole('slider')
    await expect(slider).toHaveAttribute('aria-disabled', 'true')
    await expect(slider).toHaveAttribute('aria-valuetext', 'Send 5, not added')
    slider.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).not.toHaveBeenCalled()
  },
}

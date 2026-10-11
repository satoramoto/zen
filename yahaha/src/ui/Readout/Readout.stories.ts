import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test'
import Readout from './Readout.svelte'
import ReadoutPlayground from './ReadoutPlayground.svelte'

/**
 * The Effects page's parameter control: a labelled value with a bar, one 36px hairline row. The
 * label, a thin bar filled in the accent to where the value sits in its range, the value in the
 * accent with its unit drawn smaller, and the Launchkey knob that moves it. It is the control: press
 * anywhere on it and drag sideways (the bar's width stands for the whole range), a wheel notch or an
 * arrow key steps it, Page Up / Down by ten steps, Home and End to the ends, a double-click puts it
 * back to its default. Controlled: it asks for a new value through `onchange`.
 */
const meta = {
  title: 'Primitives/Readout',
  component: Readout,
  parameters: { layout: 'padded' },
  args: {
    label: 'Feedback',
    value: 38,
    min: 0,
    max: 90,
    defaultValue: 38,
    display: '38%',
    code: 'K6',
    tip: 'fx.param.delay_feedback',
    tipAction: fn(),
    onchange: fn(),
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
} satisfies Meta<typeof Readout>

export default meta
type Story = StoryObj<typeof meta>

/** The board's Delay Feedback: 38% of 0–90, on K6. The arrows, End and Space. */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Feedback' })
    await expect(slider).toHaveAttribute('aria-valuetext', 'Feedback 38%')
    await expect(slider).toHaveAttribute('data-tip', 'fx.param.delay_feedback')
    await expect(args.tipAction).toHaveBeenCalledWith(slider, 'fx.param.delay_feedback')
    slider.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenLastCalledWith(39)
    await userEvent.keyboard('{End}')
    await expect(args.onchange).toHaveBeenLastCalledWith(90)
    await userEvent.keyboard(' ')
    await expect(args.onchange).toHaveBeenCalledTimes(2)
    await fireEvent.dblClick(slider)
    await expect(args.onchange).toHaveBeenCalledTimes(2)
  },
}

/** A value with a unit: the number in the accent, "kHz" smaller after it (Delay Tone). */
export const WithUnit: Story = {
  args: { label: 'Tone', value: 50, min: 10, max: 200, defaultValue: 50, display: '5.0 kHz', code: 'K7', tip: 'fx.param.delay_tone' },
}

/** No Launchkey knob moves it: the code column stays, empty, so the rows still line up. */
export const NoCode: Story = {
  args: { label: 'Band send', value: 0, min: 0, max: 127, defaultValue: 0, display: '0%', code: '', tip: 'fx.variation_band' },
}

/** Shown, not settable: the label and value fade, the bar empties, nothing is sent. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Feedback' })
    await expect(slider).toHaveAttribute('aria-disabled', 'true')
    slider.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).not.toHaveBeenCalled()
  },
}

/** Play with it: a story-only wrapper keeps the value you set; each change still logs as an action. */
export const Playground: Story = {
  render: (args) => ({ Component: ReadoutPlayground, props: args }),
  play: async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Feedback' })
    slider.focus()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    await expect(slider).toHaveAttribute('aria-valuetext', 'Feedback 40%')
  },
}

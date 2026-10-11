import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test'
import LineSlider from './LineSlider.svelte'

/**
 * A horizontal value on a Settings page: a 2px line, the part up to the value in `--neutral` and
 * the rest in the hairline colour, a 3px cap at the value, then the value as a numeral with its
 * unit small after it. Drag along the line, or focus it and use the arrows (one step), Page Up /
 * Page Down (ten steps), Home and End. Disabled draws in `--absent-neutral` and moves nothing.
 * Controlled: it asks through `onchange` and moves when `value` does.
 */
const meta = {
  title: 'Primitives/LineSlider',
  component: LineSlider,
  parameters: { layout: 'centered' },
  args: {
    value: 10,
    min: 0,
    max: 30,
    step: 1,
    name: 'Chord settle',
    unit: 'ms',
    tip: 'settings.chord_settle',
    onchange: fn(),
    tipAction: fn(),
  },
  argTypes: {
    value: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    name: { control: 'text' },
    valueText: { control: 'text' },
    unit: { control: 'text' },
    width: { control: 'number' },
    disabled: { control: 'boolean' },
    tip: { control: 'text' },
  },
} satisfies Meta<typeof LineSlider>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The Chord page's Chord settle: 10 ms of 0–30. → asks for 11, End for 30, Home for 0, Page Up for
 * 20; the value text carries the unit. A press at the line's middle asks for 15.
 */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const slider = canvas.getByRole('slider', { name: 'Chord settle' })
    await expect(slider).toHaveAttribute('aria-valuenow', '10')
    await expect(slider).toHaveAttribute('aria-valuemin', '0')
    await expect(slider).toHaveAttribute('aria-valuemax', '30')
    await expect(slider).toHaveAttribute('aria-valuetext', '10 ms')
    await expect(slider).toHaveAttribute('data-tip', 'settings.chord_settle')
    await expect(args.tipAction).toHaveBeenCalledWith(slider, 'settings.chord_settle')
    await expect(canvasElement).toHaveTextContent('10ms')

    slider.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenLastCalledWith(11)
    await userEvent.keyboard('{ArrowLeft}')
    await expect(args.onchange).toHaveBeenLastCalledWith(9)
    await userEvent.keyboard('{End}')
    await expect(args.onchange).toHaveBeenLastCalledWith(30)
    await userEvent.keyboard('{Home}')
    await expect(args.onchange).toHaveBeenLastCalledWith(0)
    await userEvent.keyboard('{PageUp}')
    await expect(args.onchange).toHaveBeenLastCalledWith(20)
    await expect(args.onchange).toHaveBeenCalledTimes(5)
    // Controlled: nothing moved until the parent passes a new value.
    await expect(slider).toHaveAttribute('aria-valuenow', '10')

    const track = slider.firstElementChild as HTMLElement
    track.getBoundingClientRect = () => ({ left: 0, width: 120, top: 0, height: 2 }) as DOMRect
    await fireEvent.pointerDown(slider, { button: 0, pointerId: 1, clientX: 60 })
    await expect(args.onchange).toHaveBeenLastCalledWith(15)
    await fireEvent.pointerUp(slider, { pointerId: 1 })
  },
}

/** At the top: End and → ask for nothing, since the value is already the most it can be. */
export const AtMax: Story = {
  args: { value: 30 },
  play: async ({ canvasElement, args }) => {
    const slider = within(canvasElement).getByRole('slider')
    slider.focus()
    await userEvent.keyboard('{End}')
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).not.toHaveBeenCalled()
  },
}

/** A value shown as a word with a fractional step: "5.0 s" of a 0–10 s fade, a step of 0.5. */
export const ValueText: Story = {
  args: { value: 5, min: 0, max: 10, step: 0.5, name: 'Fade in', valueText: '5.0', unit: 's', tip: 'settings.fade_in' },
  play: async ({ canvasElement, args }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Fade in' })
    await expect(slider).toHaveAttribute('aria-valuetext', '5.0 s')
    slider.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenLastCalledWith(5.5)
  },
}

/**
 * Disabled: the line and value in `--absent-neutral`, still focusable and announced as disabled;
 * keys and presses ask for nothing.
 */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const slider = within(canvasElement).getByRole('slider')
    await expect(slider).toHaveAttribute('aria-disabled', 'true')
    await expect(slider).toHaveAttribute('tabindex', '0')
    slider.focus()
    await userEvent.keyboard('{ArrowRight}')
    await userEvent.keyboard('{End}')
    await fireEvent.pointerDown(slider, { button: 0, pointerId: 1, clientX: 60 })
    await expect(args.onchange).not.toHaveBeenCalled()
  },
}

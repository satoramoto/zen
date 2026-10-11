import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import Stepper from './Stepper.svelte'

/**
 * A value stepped with − and +: the value (a numeral or a note name) with its unit small after it,
 * then two icon Buttons. At either end of its range the button that would go past it is disabled
 * (`--absent-*`, still focusable, presses ignored). `large` draws the value at the hero size, for
 * a page's main number. Controlled: the buttons call `ondown` / `onup` and the parent passes the
 * new value.
 */
const meta = {
  title: 'Components/Stepper',
  component: Stepper,
  parameters: { layout: 'centered' },
  args: {
    value: 'F#2',
    unit: 'MIDI 54',
    size: 'large',
    nameDown: 'Split point one key down',
    nameUp: 'Split point one key up',
    tipDown: 'settings.split_strip',
    tipUp: 'settings.split_strip',
    ondown: fn(),
    onup: fn(),
    tipAction: fn(),
  },
  argTypes: {
    value: { control: 'text' },
    unit: { control: 'text' },
    size: { control: 'inline-radio', options: ['text', 'large'] },
    nameDown: { control: 'text' },
    nameUp: { control: 'text' },
    tipDown: { control: 'text' },
    tipUp: { control: 'text' },
    atMin: { control: 'boolean' },
    atMax: { control: 'boolean' },
  },
} satisfies Meta<typeof Stepper>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The Chord & Split page's split point: "F#2" at the hero size, "MIDI 54" small after it, then −
 * and +. − calls `ondown`, + calls `onup`, once each.
 */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('F#2')).toBeInTheDocument()
    await expect(canvas.getByText('MIDI 54')).toBeInTheDocument()
    const down = canvas.getByRole('button', { name: 'Split point one key down' })
    const up = canvas.getByRole('button', { name: 'Split point one key up' })
    await expect(down).toHaveAttribute('data-tip', 'settings.split_strip')
    await userEvent.click(down)
    await expect(args.ondown).toHaveBeenCalledTimes(1)
    await expect(args.onup).not.toHaveBeenCalled()
    await userEvent.click(up)
    await expect(args.onup).toHaveBeenCalledTimes(1)
    await expect(args.ondown).toHaveBeenCalledTimes(1)
  },
}

/** A transpose at the row's text size: "0 semitones". */
export const Text: Story = {
  args: {
    value: '0',
    unit: 'semitones',
    size: 'text',
    nameDown: 'Transpose down',
    nameUp: 'Transpose up',
    tipDown: undefined,
    tipUp: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('semitones')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Transpose down' })).toBeInTheDocument()
  },
}

/** At the bottom of the range: − is disabled and a press calls nothing; + still works. */
export const AtMin: Story = {
  args: { value: 'C0', unit: 'MIDI 12', atMin: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const down = canvas.getByRole('button', { name: 'Split point one key down' })
    await expect(down).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(down)
    await expect(args.ondown).not.toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Split point one key up' }))
    await expect(args.onup).toHaveBeenCalledTimes(1)
  },
}

/** At the top of the range: + is disabled and a press calls nothing. */
export const AtMax: Story = {
  args: { value: 'G8', unit: 'MIDI 127', atMax: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const up = canvas.getByRole('button', { name: 'Split point one key up' })
    await expect(up).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(up)
    await expect(args.onup).not.toHaveBeenCalled()
  },
}

import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import SettingsKeyboard from './SettingsKeyboard.svelte'
import { keyboardAtLimits, keyboardBoard, keyboardTransposed, keyboardUnlocked } from './SettingsKeyboard.fixtures'

/**
 * The Settings screen's Keyboard page: Transpose (Keyboard and Master, −12 to +12 semitones, and
 * Reset both to 0) and Parameter lock (Split point and Fingering type, and what a rack recall
 * sets). Controlled: every press is reported through `onchange` and changes nothing itself.
 */
const meta = {
  title: 'Components/SettingsKeyboard',
  component: SettingsKeyboard,
  parameters: { layout: 'centered' },
  args: { data: keyboardBoard, tipAction: fn(), onchange: fn() },
  argTypes: {
    data: { control: 'object' },
  },
} satisfies Meta<typeof SettingsKeyboard>

export default meta
type Story = StoryObj<typeof meta>

/** The board: no transpose, the split point locked. − steps Keyboard down; Reset is shown, not pressable. */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const down = canvas.getByRole('button', { name: 'Keyboard transpose down a semitone' })
    await expect(down).toHaveAttribute('data-tip', 'transpose.keyboard_down')
    await expect(args.tipAction).toHaveBeenCalledWith(down, 'transpose.keyboard_down')
    await userEvent.click(down)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'keyboardStep', delta: -1 })
    await userEvent.click(canvas.getByRole('button', { name: 'Master transpose up a semitone' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'masterStep', delta: 1 })

    const reset = canvas.getByRole('button', { name: 'Reset both to 0' })
    await expect(reset).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(reset)
    await expect(args.onchange).toHaveBeenCalledTimes(2)

    const split = canvas.getByRole('button', { name: 'Lock the split point' })
    await expect(split).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByText('Stays at F#2')).toBeInTheDocument()
    await expect(canvas.getByText('Kept · locked')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Lock the fingering type' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'lock', item: 'fingeringType', on: true })
    await expect(split).toHaveAttribute('aria-pressed', 'true')
  },
}

/** Keyboard transposed up two: "+2", you hear D, and Reset both is pressable. */
export const Transposed: Story = {
  args: { data: keyboardTransposed },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('+2')).toBeInTheDocument()
    await expect(canvas.getByText('D')).toBeInTheDocument()
    const reset = canvas.getByRole('button', { name: 'Reset both to 0' })
    await expect(reset).not.toHaveAttribute('aria-disabled')
    await userEvent.click(reset)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'reset' })
  },
}

/** At the range's ends: Keyboard +12 (its + not pressable), Master −12 (its − not pressable). */
export const AtLimits: Story = {
  args: { data: keyboardAtLimits },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('+12')).toBeInTheDocument()
    await expect(canvas.getByText('−12', { selector: '.value' })).toBeInTheDocument()
    const up = canvas.getByRole('button', { name: 'Keyboard transpose up a semitone' })
    const down = canvas.getByRole('button', { name: 'Master transpose down a semitone' })
    await expect(up).toHaveAttribute('aria-disabled', 'true')
    await expect(down).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(up)
    await userEvent.click(down)
    await expect(args.onchange).not.toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Keyboard transpose down a semitone' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'keyboardStep', delta: -1 })
  },
}

/** Nothing locked: no "Stays at" hint, and a rack recall loads the split point. Switching it on asks for the lock. */
export const Unlocked: Story = {
  args: { data: keyboardUnlocked },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByText(/Stays at/)).toBeNull()
    await expect(canvas.queryByText('Kept · locked')).toBeNull()
    const split = canvas.getByRole('button', { name: 'Lock the split point' })
    await expect(split).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(split)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'lock', item: 'splitPoint', on: true })
  },
}

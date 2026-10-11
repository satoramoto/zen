import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import QuickRacksBar from './QuickRacksBar.svelte'
import { quickSlotsBoard } from './QuickRacksBar.fixtures'

/**
 * The Library's Quick Racks bar: the "Quick Racks" header with ◀ the bank letter ▶, Store and
 * Clear, over the bank's eight slots (loaded, stored, empty, missing). Shown at the left column's
 * 320px; the bar fills its container.
 */
const meta = {
  title: 'Components/QuickRacksBar',
  component: QuickRacksBar,
  parameters: { layout: 'centered' },
  args: {
    width: 320,
    bank: 'A',
    bankCount: 8,
    slots: quickSlotsBoard,
    store: false,
    clear: false,
    readOnly: false,
    tipAction: fn(),
    onbank: fn(),
    onstore: fn(),
    onclear: fn(),
    onslot: fn(),
    onslotlong: fn(),
  },
  argTypes: {
    bank: { control: 'text' },
    bankCount: { control: { type: 'number', min: 1, max: 26, step: 1 } },
    slots: { control: 'object' },
    store: { control: 'boolean', table: { category: 'LampButton · Store' } },
    clear: { control: 'boolean', table: { category: 'Button · Clear' } },
    readOnly: { control: 'boolean' },
    width: { control: { type: 'number', min: 280, max: 640, step: 1 } },
  },
} satisfies Meta<typeof QuickRacksBar>

export default meta
type Story = StoryObj<typeof meta>

/** Bank B, so both ◀ and ▶ work: B1 loaded, B2–B4 stored, B5 missing, B6–B8 empty. */
export const Board: Story = {
  args: { bank: 'B' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Quick Rack B2, Organ' }))
    await expect(args.onslot).toHaveBeenCalledWith(1)
    await userEvent.click(canvas.getByRole('button', { name: 'Previous bank' }))
    await expect(args.onbank).toHaveBeenCalledWith(-1)
    await userEvent.click(canvas.getByRole('button', { name: 'Store' }))
    await expect(args.onstore).toHaveBeenCalledTimes(1)
    await userEvent.pointer({ keys: '[MouseRight]', target: canvas.getByRole('button', { name: 'Quick Rack B6, empty' }) })
    await expect(args.onslotlong).toHaveBeenCalledWith(5)
    await expect(canvas.getByText('Bank B of 8')).toBeInTheDocument()
  },
}

/** Store armed: the lamp on, every slot not loaded a store target (empty ones included). */
export const StoreArmed: Story = {
  args: { store: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Store' })).toHaveAttribute('aria-pressed', 'true')
    const empty = canvas.getByRole('button', { name: 'Quick Rack A7, empty' })
    await expect(empty).toHaveAttribute('data-face', 'waiting')
    await userEvent.click(empty)
    await expect(args.onslot).toHaveBeenCalledWith(6)
  },
}

/** Read-only: everything shown, nothing presses. */
export const ReadOnly: Story = {
  args: { readOnly: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Quick Rack A2, Organ' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Store' }))
    await userEvent.click(canvas.getByRole('button', { name: /^Clear/ }))
    await expect(args.onslot).not.toHaveBeenCalled()
    await expect(args.onstore).not.toHaveBeenCalled()
    await expect(args.onclear).not.toHaveBeenCalled()
  },
}

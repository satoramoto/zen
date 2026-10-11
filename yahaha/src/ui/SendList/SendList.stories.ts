import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import SendList from './SendList.svelte'
import { effectsList } from '../Effects/Effects.fixtures'
import type { ListData } from '../Effects/types'

/**
 * The Effects page's send list, 280 × 288: a row per send (numeral, name over subtitle, return or
 * the "Set by rack" badge), "+ Add send" while a send is free, and the Style inserts and Master
 * rows pinned to the foot. The open bus is the chosen block, a solid `--neutral` fill with its
 * text in `--on-ink`. A click calls `onopen` with the row's bus and leaves `bus` to the parent;
 * ↑ ↓ Home End only move focus. Rows shrink below 36px when there are more of them.
 */
const meta = {
  title: 'Components/SendList',
  component: SendList,
  parameters: { layout: 'centered' },
  args: { list: effectsList, bus: 2, tipAction: fn(), onopen: fn(), onadd: fn() },
  argTypes: {
    list: { control: 'object' },
    bus: { control: 'select', options: [0, 1, 2, 3, 4, 5, 'inserts', 'master'] },
  },
} satisfies Meta<typeof SendList>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The board's moment: four sends, the Delay (send 3) open, the Chorus's type kept by the rack,
 * Add send with "5 and 6 free".
 */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: 'Effects' })
    await expect(within(nav).getByRole('heading', { name: 'Effects' })).toBeInTheDocument()
    const delay = canvas.getByRole('button', { name: 'Send 3, Delay, 1/8 · Mine, return -5.0 dB, open' })
    await expect(delay).toHaveAttribute('aria-current', 'true')
    await expect(delay).toHaveAttribute('data-face', 'chosen')
    await expect(delay).toHaveAttribute('data-tip', 'fx.send_open')
    await expect(args.tipAction).toHaveBeenCalledWith(delay, 'fx.send_open')
    const chorus = canvas.getByRole('button', { name: 'Send 2, Chorus, Celeste · From style, type set by the rack' })
    await expect(chorus).toHaveTextContent('Set by rack')
    await expect(chorus).not.toHaveAttribute('aria-current')
    await expect(chorus).not.toHaveAttribute('data-face')

    await userEvent.click(canvas.getByRole('button', { name: /^Send 1, Reverb/ }))
    await expect(args.onopen).toHaveBeenLastCalledWith(0)
    await expect(delay).toHaveAttribute('aria-current', 'true')

    const add = canvas.getByRole('button', { name: 'Add a send effect (5 and 6 free)' })
    await expect(add).toHaveAttribute('data-tip', 'fx.send_add')
    await userEvent.click(add)
    await expect(args.onadd).toHaveBeenCalledTimes(1)

    await userEvent.click(canvas.getByRole('button', { name: 'Style inserts, On · Chord 1' }))
    await expect(args.onopen).toHaveBeenLastCalledWith('inserts')
    await userEvent.click(canvas.getByRole('button', { name: 'Master, Comp Natural · EQ off' }))
    await expect(args.onopen).toHaveBeenLastCalledWith('master')

    // ↑ ↓ move focus only.
    delay.focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(canvas.getByRole('button', { name: /^Send 4, Phaser/ })).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    await expect(chorus).toHaveFocus()
    await expect(args.onopen).toHaveBeenCalledTimes(3)
  },
}

const sixSends: ListData = {
  ...effectsList,
  sends: [
    ...effectsList.sends,
    { send: 4, name: 'Plate', subtitle: 'Added send', returnLevel: 40, setByRack: true },
    { send: 5, name: 'Room', subtitle: 'Added send', returnLevel: 52, setByRack: true },
  ],
  canAdd: false,
  free: '',
}

/** All six sends: no Add send, the rows shrink so the foot rows still fit in 288. */
export const SixSends: Story = {
  args: { list: sixSends },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: /^Add a send/ })).toBeNull()
    await expect(canvas.getAllByRole('button')).toHaveLength(8)
    await expect(canvas.getByRole('button', { name: /^Send 6, Room/ })).toHaveTextContent('Set by rack')
  },
}

/** The Master row open: it is the chosen block, no send is. */
export const MasterOpen: Story = {
  args: { bus: 'master' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const master = canvas.getByRole('button', { name: 'Master, Comp Natural · EQ off, open' })
    await expect(master).toHaveAttribute('aria-current', 'true')
    await expect(master).toHaveAttribute('data-tip', 'fx.master_open')
    await expect(canvas.getByRole('button', { name: /^Send 3, Delay/ })).not.toHaveAttribute('aria-current')
  },
}

/** The style's three sends alone, Add send hidden. */
export const BlocksOnly: Story = {
  args: { list: { ...effectsList, sends: effectsList.sends.slice(0, 3), canAdd: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('button')).toHaveLength(5)
    await expect(canvas.queryByRole('button', { name: /^Add a send/ })).toBeNull()
  },
}

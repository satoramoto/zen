import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import BusEditor from './BusEditor.svelte'
import { chorusBus, delayBus, phaserBus, reverbBus } from '../Effects/Effects.fixtures'

/**
 * The open send's editor on the Effects page (the display's right part), at the width it fills.
 * The header names the bus and its send; a style bus has its source run (From style / Mine) and
 * its type run, an added send a kind picker and Remove. Two columns of 36px rows: the switch row
 * and the parameters on the left, the levels and the four parts' sends on the right; the note
 * line under them. Controlled: every change is reported through `onchange` as a `BusChange`.
 */
const meta = {
  title: 'Components/BusEditor',
  component: BusEditor,
  parameters: { layout: 'padded' },
  args: { bus: delayBus, onchange: fn(), tipAction: fn() },
  argTypes: {
    bus: { control: 'object' },
  },
} satisfies Meta<typeof BusEditor>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The board: send 3, the Delay, Mine, 1/8, tempo sync on. Choosing From style, Ping-pong, the
 * Tempo sync lamp, a key on Feedback and on Right 2's send each report their change.
 */
export const Delay: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('region', { name: 'Delay, send 3' })).toBeInTheDocument()

    const source = canvas.getByRole('tablist', { name: 'Delay source' })
    await expect(within(source).getByRole('tab', { name: 'Mine' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(within(source).getByRole('tab', { name: 'Mine' }))
    await expect(args.onchange).not.toHaveBeenCalled()
    await userEvent.click(within(source).getByRole('tab', { name: 'From style' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'source', send: 2, follow: true })

    const type = canvas.getByRole('tablist', { name: 'Delay type' })
    await expect(within(type).getByRole('tab', { name: '1/8' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(within(type).getByRole('tab', { name: 'Ping-pong' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'kind', send: 2, kind: 'pingPong' })

    const sync = canvas.getByRole('button', { name: 'Tempo sync' })
    await expect(sync).toHaveAttribute('data-tip', 'fx.param.delay_sync')
    await userEvent.click(sync)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'switch', send: 2, id: 'delaySync', on: false })

    const feedback = canvas.getByRole('slider', { name: 'Feedback' })
    await expect(feedback).toHaveAttribute('aria-valuenow', '38')
    await expect(args.tipAction).toHaveBeenCalledWith(feedback, 'fx.param.delay_feedback')
    feedback.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'param', send: 2, id: 'delayFeedback', value: 39 })
    await expect(feedback).toHaveAttribute('aria-valuenow', '38')

    const r2 = canvas.getByRole('slider', { name: 'Right 2 delay send' })
    await expect(r2).toHaveAttribute('data-tip', 'fx.part_sends')
    r2.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'partSend', send: 2, part: 1, value: 17 })
    await expect(canvas.queryByRole('button', { name: /Remove/ })).toBeNull()
  },
}

/** Send 1, the Reverb, following the style (Hall): Keep with rack alone in the switch row. */
export const Reverb: Story = {
  args: { bus: reverbBus },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const source = canvas.getByRole('tablist', { name: 'Reverb source' })
    await expect(within(source).getByRole('tab', { name: 'From style' })).toHaveAttribute('aria-selected', 'true')
  },
}

/** Send 2, the Chorus, Celeste kept with the rack: its Keep with rack lamp lit. */
export const Chorus: Story = {
  args: { bus: chorusBus },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Chorus: keep this type with the rack' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

/**
 * Send 4, an added Phaser: no source run, a kind picker on the header's line and Remove at its
 * right end, no switch row. Picking Room reports it and the picker stays on the state's Phaser.
 */
export const AddedSend: Story = {
  args: { bus: phaserBus },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('tablist', { name: 'Phaser source' })).toBeNull()
    await expect(canvas.queryByRole('tablist')).toBeNull()
    const picker = canvas.getByRole<HTMLSelectElement>('combobox', { name: 'Phaser type' })
    await expect(picker.options).toHaveLength(12)
    await expect(picker.value).toBe('phaser')
    await expect(picker).toHaveAttribute('data-tip', 'fx.send_kind')
    await userEvent.selectOptions(picker, 'room')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'kind', send: 3, kind: 'room' })
    await expect(picker.value).toBe('phaser')
    await userEvent.click(canvas.getByRole('button', { name: 'Remove send 4' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'remove', send: 3 })
  },
}

/** The Delay with tempo sync off: the Note row is Time, in milliseconds (10–2000). */
export const TimeNotSynced: Story = {
  args: {
    bus: {
      ...delayBus,
      switches: delayBus.switches.map((s) => (s.id === 'delaySync' ? { ...s, on: false } : s)),
      params: [
        { id: 'delayTime', label: 'Time', value: 375, min: 10, max: 2000, defaultValue: 375, display: '375 ms', code: 'K5', tip: 'fx.param.delay_time' },
        ...delayBus.params.slice(1),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Tempo sync' })).toHaveAttribute('aria-pressed', 'false')
    await expect(canvas.getByRole('slider', { name: 'Time' })).toHaveAttribute('aria-valuenow', '375')
    await expect(canvas.queryByRole('slider', { name: 'Note' })).toBeNull()
  },
}

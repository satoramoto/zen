import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import ChannelMix from './ChannelMix.svelte'
import { channelBoard, channelStylePart } from '../Channel/Channel.fixtures'

/**
 * The Channel page's Mix tab body: four 264px columns in the display's 1110×240 body. Sound (the
 * sound button opens Library › Sounds; Mine, the plugin line and Edit), Level (Level, Pan, On and
 * Solo), and the Sends across two columns, whose "+ Add send" swaps the rows for the twelve send
 * kinds in place (Esc or Cancel closes them). Neutral controls take the open part's hue.
 * Controlled: every edit is reported through `onchange` and the tab moves only when `data` does.
 */
const meta = {
  title: 'Components/ChannelMix',
  component: ChannelMix,
  parameters: { layout: 'padded' },
  args: { data: channelBoard, tipAction: fn(), onchange: fn(), onsound: fn(), onedit: fn() },
  argTypes: {
    data: { control: 'object' },
  },
} satisfies Meta<typeof ChannelMix>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The board: Right 1, Stage Grand on the fake plugin, Level 90, four sends. Arrow keys step the
 * bars, the lamps report their press, and + Add send opens the kinds and adds the one picked.
 */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const level = canvas.getByRole('slider', { name: 'Level' })
    await expect(level).toHaveAttribute('aria-valuetext', 'Level 90')
    await expect(level).toHaveAttribute('data-tip', 'mixer.channel.level')
    level.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'level', value: 91 })

    await userEvent.click(canvas.getByRole('button', { name: 'Solo Right 1' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'solo' })
    await userEvent.click(canvas.getByRole('button', { name: 'Right 1 on' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'on' })

    const sound = canvas.getByRole('button', { name: 'Right 1 sound: 1 Stage Grand. Opens Library › Sounds' })
    await userEvent.click(sound)
    await expect(args.onsound).toHaveBeenCalledOnce()
    await userEvent.click(canvas.getByRole('button', { name: 'Open the plugin editor' }))
    await expect(args.onedit).toHaveBeenCalledOnce()

    await expect(canvas.getByRole('slider', { name: 'Send 5' })).toHaveAttribute('aria-disabled', 'true')
    await expect(canvas.getByRole('slider', { name: 'Send 1, reverb' })).toHaveAttribute('aria-valuetext', 'Send 1, reverb 40')

    const add = canvas.getByRole('button', { name: 'Add a send effect (5 of 6)' })
    await userEvent.click(add)
    await expect(canvas.queryByRole('slider', { name: 'Send 5' })).toBeNull()
    await userEvent.keyboard('{Escape}')
    await expect(canvas.getByRole('slider', { name: 'Send 5' })).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Add a send effect (5 of 6)' }))
    await expect(canvas.getByRole('button', { name: 'Cancel adding a send' })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Add a Plate send' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'addSend', kind: 'plate' })
    await expect(canvas.getByRole('slider', { name: 'Send 5' })).toHaveAttribute('aria-disabled', 'true')
  },
}

/** A Style part (Rhythm 1): the voice as plain text, no pan, no swap; Level and the lamps still edit. */
export const StylePart: Story = {
  args: { data: channelStylePart },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const pan = canvas.getByRole('slider', { name: 'Pan' })
    await expect(pan).toHaveAttribute('aria-disabled', 'true')
    await expect(pan).toHaveAttribute('aria-valuetext', 'Pan, not available')
    pan.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).not.toHaveBeenCalled()
    await expect(canvas.getByRole('slider', { name: 'Level' })).toHaveAttribute('data-tip', 'mixer.style.volume')
    await expect(canvas.queryByRole('button', { name: /sound:/ })).toBeNull()
    await expect(canvas.getByText('Standard Kit 1')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Rhythm 1 on' })).toHaveAttribute('data-tip', 'mixer.style.mute')
  },
}

/** Six sends: every row is there and + Add send is shown, not pressable. */
export const SixSends: Story = {
  args: {
    data: {
      ...channelBoard,
      sends: channelBoard.sends.map((s) =>
        s.present ? s : { ...s, present: true, label: s.send === 4 ? 'Hall' : 'Flanger', level: 30 },
      ),
      sendKinds: [],
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const add = canvas.getByRole('button', { name: 'Add a send effect: all six added' })
    await expect(add).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(add)
    await expect(canvas.getByRole('slider', { name: 'Send 6, flanger' })).not.toHaveAttribute('aria-disabled')
    await expect(args.onchange).not.toHaveBeenCalled()
  },
}

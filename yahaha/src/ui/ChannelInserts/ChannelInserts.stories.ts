import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import ChannelInserts from './ChannelInserts.svelte'
import { channelBoard, channelStylePart } from '../Channel/Channel.fixtures'

/**
 * The Channel page's Inserts tab, filling the page's 1110×240 body: insert 1 over columns 1–2 and
 * insert 2 over columns 3–4, each its header (the On lamp while it has a kind), its kind tabs and
 * up to four settings; under them the global Rotary fast lamp. Choosing the slot's own kind sends
 * nothing (so re-picking Rotary keeps its settings). Controlled: every control reports a
 * ChannelChange and the tab moves only when `data` does.
 */
const meta = {
  title: 'Components/ChannelInserts',
  component: ChannelInserts,
  parameters: { layout: 'padded' },
  args: { data: channelBoard, onchange: fn(), tipAction: fn() },
  argTypes: {
    data: { control: 'object' },
  },
} satisfies Meta<typeof ChannelInserts>

export default meta
type Story = StoryObj<typeof meta>

/** The board: insert 1 a Rotary (Depth, Drive, Balance), insert 2 empty, Rotary fast on. */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const kind1 = within(canvas.getByRole('tablist', { name: 'Insert 1 kind' }))
    await expect(kind1.getByRole('tab', { name: 'Rotary' })).toHaveAttribute('aria-selected', 'true')
    await expect(kind1.getByRole('tab', { name: 'Phaser' })).toHaveAttribute('data-tip', 'mixer.strip.insert_kind')

    await expect(canvas.getByRole('slider', { name: 'Depth' })).toHaveAttribute('aria-valuetext', 'Depth 64')
    await expect(canvas.getByRole('slider', { name: 'Drive' })).toHaveAttribute('aria-valuetext', 'Drive 20')
    const balance = canvas.getByRole('slider', { name: 'Balance' })
    await expect(balance).toHaveAttribute('aria-valuetext', 'Balance 64')
    await expect(balance).toHaveAttribute('data-tip', 'mixer.strip.insert_setting_3')

    await userEvent.click(kind1.getByRole('tab', { name: 'Rotary' }))
    await expect(args.onchange).not.toHaveBeenCalled()
    await userEvent.click(kind1.getByRole('tab', { name: 'Phaser' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'insertKind', slot: 0, kind: 'phaser' })

    balance.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'insertSetting', slot: 0, setting: 2, value: 65 })

    const on1 = canvas.getByRole('button', { name: 'Insert 1 on' })
    await userEvent.click(on1)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'insertOn', slot: 0 })
    await expect(args.tipAction).toHaveBeenCalledWith(on1, 'mixer.strip.insert_on')

    await expect(canvas.queryByRole('button', { name: /^Insert 2 o/ })).toBeNull()
    const kind2 = within(canvas.getByRole('tablist', { name: 'Insert 2 kind' }))
    await expect(kind2.getByRole('tab', { name: 'None' })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByText('Empty: choose a kind above.')).toBeInTheDocument()

    const rotary = canvas.getByRole('button', { name: 'Rotary fast, global: the rotary speed for every part' })
    await expect(rotary).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(rotary)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'rotaryFast' })
  },
}

/** Both slots filled: insert 2 a Distortion with three settings, switched off; a newer build's kind in slot 1. */
export const TwoInserts: Story = {
  args: {
    data: {
      ...channelBoard,
      inserts: [
        { kind: 'shimmer', name: 'Shimmer', on: true, settings: [] },
        {
          kind: 'distortion',
          name: 'Distortion',
          on: false,
          settings: [
            { name: 'Drive', value: 80, min: 0, max: 127, default: 64, display: '80' },
            { name: 'Tone', value: 40, min: 0, max: 127, default: 64, display: '40' },
            { name: 'Level', value: 100, min: 0, max: 127, default: 100, display: '100' },
          ],
        },
      ],
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const kind1 = within(canvas.getByRole('tablist', { name: 'Insert 1 kind' }))
    await expect(kind1.getByRole('tab', { name: 'Shimmer' })).toHaveAttribute('aria-selected', 'true')

    const kind2 = within(canvas.getByRole('tablist', { name: 'Insert 2 kind' }))
    await expect(kind2.getByRole('tab', { name: 'Distortion' })).toHaveAttribute('aria-selected', 'true')
    const on2 = canvas.getByRole('button', { name: 'Insert 2 off' })
    await expect(on2).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(on2)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'insertOn', slot: 1 })

    await expect(canvas.getByRole('slider', { name: 'Tone' })).toHaveAttribute('aria-valuetext', 'Tone 40')
    await userEvent.dblClick(canvas.getByRole('slider', { name: 'Drive' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'insertSetting', slot: 1, setting: 0, value: 64 })
  },
}

/** Rhythm 1 (a Style part): slot 1 is the style's insert, a Compressor with four settings, live. */
export const StylePart: Story = {
  args: { data: channelStylePart },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: /^Insert 1\W+the style's$/ })).toBeInTheDocument()
    const kind1 = within(canvas.getByRole('tablist', { name: 'Insert 1 kind' }))
    await expect(kind1.getByRole('tab', { name: 'Compressor' })).toHaveAttribute('aria-selected', 'true')
    const output = canvas.getByRole('slider', { name: 'Output' })
    await expect(output).toHaveAttribute('data-tip', 'mixer.strip.insert_setting_4')
    await expect(canvas.getByRole('slider', { name: 'Release' })).toHaveAttribute('aria-valuetext', 'Release 150 ms')
    output.focus()
    await userEvent.keyboard('{ArrowLeft}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'insertSetting', slot: 0, setting: 3, value: 99 })
  },
}

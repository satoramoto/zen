import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import ChannelComp from './ChannelComp.svelte'
import { channelBoard } from '../Channel/Channel.fixtures'

/**
 * The Channel page's Compressor tab, filling the page's 1110×240 body: the Compressor group (its
 * On lamp in the header, the Type tabs and a note) over columns 1–2 and the Settings group's five
 * bar readouts over columns 3–4. Choosing the chosen type puts its parameters back; a
 * double-click on a row resets it to the type's value. Controlled: every control reports a
 * ChannelChange and the tab moves only when `data` does.
 */
const meta = {
  title: 'Components/ChannelComp',
  component: ChannelComp,
  parameters: { layout: 'padded' },
  args: { data: channelBoard, onchange: fn(), tipAction: fn() },
  argTypes: {
    data: { control: 'object' },
  },
} satisfies Meta<typeof ChannelComp>

export default meta
type Story = StoryObj<typeof meta>

/** The board: Punchy, edited (threshold −18, ratio 3:1), the compressor on. */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: /^Compressor\W+edited$/ })).toBeInTheDocument()

    const types = within(canvas.getByRole('tablist', { name: 'Compressor type' }))
    await expect(types.getByRole('tab', { name: 'Punchy' })).toHaveAttribute('aria-selected', 'true')
    await expect(types.getByRole('tab', { name: 'Rich' })).toHaveAttribute('data-tip', 'mixer.strip.comp_type')
    await userEvent.click(types.getByRole('tab', { name: 'Rich' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'compPreset', preset: 'rich' })
    await expect(types.getByRole('tab', { name: 'Punchy' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(types.getByRole('tab', { name: 'Punchy' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'compPreset', preset: 'punchy' })

    const threshold = canvas.getByRole('slider', { name: 'Threshold' })
    await expect(threshold).toHaveAttribute('aria-valuetext', 'Threshold −18 dB')
    await expect(threshold).toHaveAttribute('data-tip', 'mixer.strip.comp_threshold')
    await expect(canvas.getByRole('slider', { name: 'Ratio' })).toHaveAttribute('aria-valuetext', 'Ratio 3:1')
    await expect(canvas.getByRole('slider', { name: 'Make-up' })).toHaveAttribute('aria-valuetext', 'Make-up 0 dB')
    await userEvent.dblClick(threshold)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'compParam', param: 'threshold', value: -24 })

    const on = canvas.getByRole('button', { name: 'Compressor on' })
    await expect(on).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(on)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'compOn' })
    await expect(args.tipAction).toHaveBeenCalledWith(on, 'mixer.strip.comp')
  },
}

/** Natural at its own parameters, the compressor off: no "edited", the rows still edit (CH-D10). */
export const NotEdited: Story = {
  args: {
    data: {
      ...channelBoard,
      comp: { on: false, preset: 'natural', threshold: -18, ratio: 25, attack: 10, release: 200, makeup: 0, edited: false },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Compressor' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Compressor off' })).toHaveAttribute('aria-pressed', 'false')
    await expect(canvas.getByRole('slider', { name: 'Ratio' })).toHaveAttribute('aria-valuetext', 'Ratio 2.5:1')
    const release = canvas.getByRole('slider', { name: 'Release' })
    release.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'compParam', param: 'release', value: 201 })
  },
}

import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import ChannelEqTone from './ChannelEqTone.svelte'
import { channelBoard, channelStylePart } from '../Channel/Channel.fixtures'

/**
 * The Channel page's EQ & Tone tab body: four 264px columns in the display's 1110×240 body. EQ
 * (low and high shelf gain and frequency), Tone across two columns (eight offsets on the sound, 64
 * the voice's own), and Play (Mono, Portamento time and its on/off switch, Octave, Bend range). A Style part has no tone or
 * play: those rows are shown, not editable. Neutral controls take the open part's hue.
 * Controlled: every edit is reported through `onchange` and the tab moves only when `data` does.
 */
const meta = {
  title: 'Components/ChannelEqTone',
  component: ChannelEqTone,
  parameters: { layout: 'padded' },
  args: { data: channelBoard, tipAction: fn(), onchange: fn() },
  argTypes: {
    data: { control: 'object' },
  },
} satisfies Meta<typeof ChannelEqTone>

export default meta
type Story = StoryObj<typeof meta>

/** The board: Right 1's EQ and tone offsets; the arrows step a bar, the steppers and Mono report their press. */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('slider', { name: 'Low' })).toHaveAttribute('aria-valuetext', 'Low +2 dB')
    await expect(canvas.getByRole('slider', { name: 'Low freq' })).toHaveAttribute('aria-valuetext', 'Low freq 120 Hz')
    await expect(canvas.getByRole('slider', { name: 'High' })).toHaveAttribute('aria-valuetext', 'High −2 dB')
    await expect(canvas.getByRole('slider', { name: 'High freq' })).toHaveAttribute('aria-valuetext', 'High freq 8.0 kHz')
    const cutoff = canvas.getByRole('slider', { name: 'Cutoff' })
    await expect(cutoff).toHaveAttribute('aria-valuetext', 'Cutoff +12')
    await expect(cutoff).toHaveAttribute('data-tip', 'mixer.channel.tone.cutoff')
    cutoff.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'tone', control: 'cutoff', value: 77 })

    const glide = canvas.getByRole('slider', { name: 'Portamento time' })
    await expect(glide).toHaveAttribute('aria-valuetext', 'Portamento time 0, off')
    await expect(glide).toHaveAttribute('data-tip', 'mixer.channel.portamento_time')
    glide.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'portamento', time: 1 })
    const porta = canvas.getByRole('button', { name: 'Portamento off' })
    await expect(porta).toHaveAttribute('data-tip', 'mixer.channel.portamento')
    await userEvent.click(porta)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'portamentoOn' })

    await userEvent.click(canvas.getByRole('button', { name: 'Octave down' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'octave', step: -1 })
    await userEvent.click(canvas.getByRole('button', { name: 'Bend range up' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'bend', step: 1 })
    await userEvent.click(canvas.getByRole('button', { name: 'Mono off' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'mono' })
  },
}

/** A Style part (Rhythm 1): the EQ still edits; Tone and Play are shown, not editable. */
export const StylePart: Story = {
  args: { data: channelStylePart },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const cutoff = canvas.getByRole('slider', { name: 'Cutoff' })
    await expect(cutoff).toHaveAttribute('aria-disabled', 'true')
    await expect(cutoff).toHaveAttribute('aria-valuetext', 'Cutoff, not available')
    cutoff.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).not.toHaveBeenCalled()
    await expect(canvas.getByRole('button', { name: 'Octave down' })).toHaveAttribute('aria-disabled', 'true')
    await expect(canvas.getByRole('button', { name: 'Octave up' })).toHaveAttribute('aria-disabled', 'true')
    await expect(canvas.getByRole('button', { name: 'Mono off' })).toHaveAttribute('aria-disabled', 'true')
    await expect(canvas.getByRole('slider', { name: 'Portamento time' })).toHaveAttribute('aria-disabled', 'true')
    await expect(canvas.getByRole('button', { name: 'Portamento off' })).toHaveAttribute('aria-disabled', 'true')
    await expect(canvas.getByRole('heading', { level: 3, name: /^Tone\b.*the style's voice$/ })).toBeInTheDocument()
  },
}

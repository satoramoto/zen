import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test'
import MetronomePopover from './MetronomePopover.svelte'

/**
 * The metronome's settings, opened by the section row's Metronome ▾ caret: the title, then
 * Metronome On/Off, Volume (0–127, a LineSlider) and Bell on beat 1 (On/Off), each a settings row.
 * A caption says when the click can't sound. Esc or a press outside it asks to close it.
 */
const meta = {
  title: 'Components/MetronomePopover',
  component: MetronomePopover,
  parameters: { layout: 'centered' },
  args: {
    id: 'metronome-settings',
    on: true,
    volume: 90,
    bell: true,
    audible: true,
    tipAction: fn(),
    onon: fn(),
    onvolume: fn(),
    onbell: fn(),
    onclose: fn(),
  },
  argTypes: {
    id: { control: 'text' },
    on: { control: 'boolean' },
    volume: { control: { type: 'number', min: 0, max: 127, step: 1 } },
    bell: { control: 'boolean' },
    audible: { control: 'boolean' },
  },
} satisfies Meta<typeof MetronomePopover>

export default meta
type Story = StoryObj<typeof meta>

/**
 * On, volume 90, the bell on. Off asks for the metronome off, End asks for volume 127, the bell's
 * Off asks for no bell; Esc and a press outside ask to close it. Every control carries its tip.
 */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const dialog = canvas.getByRole('dialog', { name: 'Metronome settings' })
    await expect(dialog).toHaveAttribute('id', 'metronome-settings')
    const on = canvas.getByRole('button', { name: 'Metronome on/off' })
    const bell = canvas.getByRole('button', { name: 'Bell on beat 1' })
    const volume = canvas.getByRole('slider', { name: 'Metronome volume' })
    await expect(on).toHaveAttribute('data-tip', 'metronome.on')
    await expect(bell).toHaveAttribute('data-tip', 'metronome.bell')
    await expect(volume).toHaveAttribute('data-tip', 'metronome.volume')
    await expect(volume).toHaveAttribute('aria-valuenow', '90')
    await userEvent.click(on)
    await expect(args.onon).toHaveBeenLastCalledWith(false)
    await userEvent.click(bell)
    await expect(args.onbell).toHaveBeenLastCalledWith(false)
    volume.focus()
    await userEvent.keyboard('{End}')
    await expect(args.onvolume).toHaveBeenLastCalledWith(127)
    await expect(args.onclose).not.toHaveBeenCalled()
    await userEvent.keyboard('{Escape}')
    await expect(args.onclose).toHaveBeenCalledTimes(1)
    await fireEvent.pointerDown(document.body)
    await expect(args.onclose).toHaveBeenCalledTimes(2)
  },
}

/** Off, quiet, no bell. */
export const Off: Story = {
  args: { on: false, volume: 20, bell: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Metronome on/off' })).toHaveAttribute('aria-pressed', 'false')
    await expect(canvas.getByRole('button', { name: 'Bell on beat 1' })).toHaveAttribute('aria-pressed', 'false')
  },
}

/** The built-in synth isn't running: a caption says the click can't sound. */
export const NotAudible: Story = {
  args: { audible: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/the click can't sound/)).toBeInTheDocument()
  },
}

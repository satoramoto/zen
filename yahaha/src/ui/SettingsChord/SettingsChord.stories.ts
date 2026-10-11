import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import SettingsChord from './SettingsChord.svelte'
import { chordBoard, chordPicking, chordSingle, chordSplitMoved, chordUpper } from './SettingsChord.fixtures'

/**
 * The Chord & Split page of the Settings screen. Three columns, each section in its own hue: the
 * seven fingering types as a radiogroup list (the chosen one a solid block); the left hand's
 * switches (Upper, Manual Bass, which works only with Upper on, Left Hold) and the chord-settle
 * window; the split point with − and +, "Set on the keys", Reset and the lock note, then who plays
 * on each side. No page keyboard: the split is set on the main keyboard at the foot of the screen
 * ("Set on the keys" arms a pick there). Controlled: every change goes out through `onchange`.
 */
const meta = {
  title: 'Components/SettingsChord',
  component: SettingsChord,
  parameters: { layout: 'fullscreen' },
  args: { data: chordBoard, tipAction: fn(), onchange: fn() },
  argTypes: {
    data: { control: 'object' },
  },
} satisfies Meta<typeof SettingsChord>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The board: Fingered chosen, Upper off so Manual Bass is shown but not pressable, the split at its
 * default F#2 (Reset not pressable) and locked by a rack.
 */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const radios = canvas.getAllByRole('radio')
    await expect(radios).toHaveLength(7)
    const fingered = canvas.getByRole('radio', { name: /^Fingered Play every/ })
    await expect(fingered).toHaveAttribute('aria-checked', 'true')
    await expect(fingered).toHaveAttribute('tabindex', '0')
    await expect(args.tipAction).toHaveBeenCalledWith(fingered, 'fingering.fingered')

    await userEvent.click(canvas.getByRole('button', { name: 'Upper: read chords right of the split' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'upper', on: true })

    const manualBass = canvas.getByRole('button', { name: 'Manual Bass, works with Upper on' })
    await expect(manualBass).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(manualBass)
    await expect(args.onchange).toHaveBeenCalledTimes(1)

    await expect(canvas.getByRole('button', { name: 'Reset to F#2' })).toHaveAttribute('aria-disabled', 'true')
    await expect(canvas.getByText('Locked')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /Split point is locked/ }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'openKeyboard' })

    // The fingering list: an arrow moves the choice, and the page asks rather than moves itself.
    fingered.focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'fingering', id: 'fingeredOnBass' })
    await expect(fingered).toHaveAttribute('aria-checked', 'true')

    // No page keyboard: the split is set on the main keyboard. Locked, "Set on the keys" is shown, not pressable.
    await expect(canvas.queryByRole('img', { name: /^Keys:/ })).toBeNull()
    await expect(canvas.queryByRole('slider', { name: /Split/ })).toBeNull()
    const pick = canvas.getByRole('button', { name: 'Set on the keys' })
    await expect(pick).toHaveAttribute('aria-disabled', 'true')
    await expect(pick).toHaveAttribute('data-tip', 'settings.split_pick')

    await expect(canvas.getByText(/Chords read left of the split/)).toBeInTheDocument()
  },
}

/** "Set on the keys" pressed: the waiting face (a 2px ring) until a key is clicked on the main keyboard. */
export const Picking: Story = {
  args: { data: chordPicking },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const pick = canvas.getByRole('button', { name: /^Set on the keys: click a key/ })
    await expect(pick).toHaveAttribute('aria-pressed', 'true')
    await expect(pick).toHaveTextContent('Click a key below…')
    await userEvent.click(pick)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'pick', armed: false })
  },
}

/** Upper on: chords read right of the split, and Manual Bass is pressable. */
export const UpperOn: Story = {
  args: { data: chordUpper },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const manualBass = canvas.getByRole('button', { name: 'Manual Bass, works with Upper on' })
    await expect(manualBass).not.toHaveAttribute('aria-disabled')
    await expect(manualBass).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(manualBass)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'manualBass', on: false })
    await userEvent.click(canvas.getByRole('button', { name: 'Upper: read chords right of the split' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'upper', on: false })
    await expect(canvas.getByText(/Chords read right of the split/)).toBeInTheDocument()
    await expect(canvas.queryByText('Locked')).toBeNull()
  },
}

/** Single chosen, Left Hold on, a 4 ms settle. */
export const SingleChosen: Story = {
  args: { data: chordSingle },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const single = canvas.getByRole('radio', { name: /^Single/ })
    await expect(single).toHaveAttribute('aria-checked', 'true')
    await expect(canvas.getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1)
    await userEvent.click(canvas.getByRole('radio', { name: /^AI Fingered/ }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'fingering', id: 'aiFingered' })
    single.focus()
    await userEvent.keyboard('{ArrowUp}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'fingering', id: 'aiFullKeyboard' })

    const settle = canvas.getByRole('slider', { name: 'Chord settle window' })
    await expect(settle).toHaveAttribute('aria-valuenow', '4')
    settle.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'settle', ms: 5 })

    await userEvent.click(canvas.getByRole('button', { name: 'Left Hold: the chord holds when you lift' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'leftHold', on: false })
  },
}

/** The split moved to C3: Reset is pressable, and − and + step it. */
export const SplitMoved: Story = {
  args: { data: chordSplitMoved },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('MIDI 60')).toBeInTheDocument()
    const reset = canvas.getByRole('button', { name: 'Reset to F#2' })
    await expect(reset).not.toHaveAttribute('aria-disabled')
    await userEvent.click(reset)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'splitReset' })
    await userEvent.click(canvas.getByRole('button', { name: 'Split point one key up' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'splitStep', delta: 1 })
    await userEvent.click(canvas.getByRole('button', { name: 'Split point one key down' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'splitStep', delta: -1 })
    const pick = canvas.getByRole('button', { name: 'Set on the keys' })
    await expect(pick).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(pick)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'pick', armed: true })
  },
}

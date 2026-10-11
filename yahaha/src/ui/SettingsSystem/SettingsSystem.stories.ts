import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import SettingsSystem from './SettingsSystem.svelte'
import { systemBoard, systemEmpty, systemNoSynth, systemOnlyThese, systemScanning } from './SettingsSystem.fixtures'

/**
 * The Settings screen's System page: Audio, MIDI inputs, and the style folders, SoundFonts and
 * theme, one column each. Each section is called out in its own hue, and every row shares one
 * label width, so the controls of the three columns line up. Every one-of-many choice is a run of ChosenTabs, every switch a
 * LampButton; readouts are plain values. Controlled: a control reports a `SystemChange` through
 * `onchange` and the page changes nothing itself.
 */
const meta = {
  title: 'Components/SettingsSystem',
  component: SettingsSystem,
  parameters: { layout: 'centered' },
  args: { data: systemBoard, onchange: fn(), tipAction: fn() },
  argTypes: {
    data: { control: 'object' },
  },
} satisfies Meta<typeof SettingsSystem>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The board: the synth on at 128 frames, CPU 74 % in trouble red, All inputs (each input's lamp
 * shows on and can't be pressed), RGB LEDs, two style folders, Dark. Choosing 256 asks for it;
 * choosing Light asks for the light theme; Rescan asks for a rescan; the chosen tab asks nothing.
 */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('heading', { level: 3 }).map((h) => h.textContent?.trim())).toEqual([
      'Audio',
      'MIDI inputs',
      'Output and Launchkey',
      'Style folders',
      'SoundFonts',
      'App',
    ])
    // Each section is a region in its own hue (SECTION_HUES.system).
    for (const [name, hue] of [
      ['Audio', 'main'],
      ['MIDI inputs', 'r1'],
      ['Output and Launchkey', 'r3'],
      ['Style folders', 'intro'],
      ['SoundFonts', 'r2'],
      ['App', 'a'],
    ]) {
      await expect(canvas.getByRole('region', { name })).toHaveAttribute(
        'style',
        expect.stringContaining(`--header-ink: var(--${hue})`),
      )
    }
    // A long input name is cut to the label column and keeps its full name as a title.
    await expect(canvas.getByTitle('Launchkey MK4 61 DAW')).toHaveTextContent('Launchkey MK4 61 DAW')
    await expect(canvas.getByTitle('MK4 61 · DAW mode')).toBeVisible()

    const cpu = canvas.getByRole('img', { name: 'CPU 74 percent, above 70' })
    await expect(cpu).toHaveClass('trouble')
    await expect(canvas.getByText('Launchkey connected')).toBeVisible()
    await expect(canvas.getByText('1,284')).toBeVisible()
    await expect(canvas.getByText('styles in 2 folders')).toBeVisible()

    const synth = canvas.getByRole('button', { name: 'Built-in synth' })
    await expect(synth).toHaveAttribute('aria-pressed', 'true')
    await expect(synth).toHaveAttribute('data-tip', 'audio.synth_on')
    await expect(args.tipAction).toHaveBeenCalledWith(synth, 'audio.synth_on')

    await userEvent.click(canvas.getByRole('tab', { name: '128 frames' }))
    await expect(args.onchange).not.toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('tab', { name: '256 frames' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'buffer', frames: 256 })
    await userEvent.click(canvas.getByRole('tab', { name: 'Outputs 3–4' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'outputPair', first: 3 })
    await userEvent.click(synth)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'synth', on: false })

    const all = canvas.getByRole('tab', { name: 'All inputs' })
    await expect(all).toHaveAttribute('aria-selected', 'true')
    for (const name of ['Launchkey MK4 61 MIDI', 'IAC Driver Bus 1', 'Roland UM-ONE']) {
      const lamp = canvas.getByRole('button', { name: `Listen to ${name}` })
      await expect(lamp).toHaveAttribute('aria-pressed', 'true')
      await expect(lamp).toHaveAttribute('aria-disabled', 'true')
      await expect(lamp).toHaveAttribute('data-tip', 'midi.input')
    }
    await expect(canvas.getByText('pads')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Listen to IAC Driver Bus 1' }))
    await expect(args.onchange).toHaveBeenCalledTimes(3)
    await userEvent.click(canvas.getByRole('tab', { name: 'Palette' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'paletteLeds', on: true })

    const system = canvas.getByRole('tab', { name: 'System: follow the computer' })
    await expect(system).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(system)
    await expect(args.onchange).toHaveBeenCalledTimes(4)
    await userEvent.click(canvas.getByRole('tab', { name: 'Light' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'theme', theme: 'light' })

    const rescan = canvas.getByRole('button', { name: 'Rescan the style folders' })
    await expect(rescan).toHaveAttribute('data-tip', 'settings.rescan')
    await userEvent.click(rescan)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'rescan' })

    const master = canvas.getByRole('slider', { name: 'Master volume (fader 9)' })
    master.focus()
    await userEvent.keyboard('{ArrowUp}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'master', volume: 101 })
    await expect(args.onchange).toHaveBeenCalledTimes(7)
  },
}

/**
 * Only these: each input's lamp is pressable and shows whether it listens (IAC Driver Bus 1 off).
 * Two dropouts lately read in trouble red; the CPU is calm. Choosing All inputs asks for all;
 * a lamp asks for its input on or off.
 */
export const OnlyThese: Story = {
  args: { data: systemOnlyThese },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('tab', { name: 'Only these' })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('img', { name: 'CPU 31 percent' })).not.toHaveClass('trouble')
    await expect(canvas.getByText('lately')).toBeVisible()

    const iac = canvas.getByRole('button', { name: 'Listen to IAC Driver Bus 1' })
    await expect(iac).toHaveAttribute('aria-pressed', 'false')
    await expect(iac).not.toHaveAttribute('aria-disabled')
    await userEvent.click(iac)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'input', name: 'IAC Driver Bus 1', on: true })
    const roland = canvas.getByRole('button', { name: 'Listen to Roland UM-ONE' })
    await expect(roland).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(roland)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'input', name: 'Roland UM-ONE', on: false })

    await userEvent.click(canvas.getByRole('tab', { name: 'All inputs' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'allInputs', all: true })
    await expect(args.onchange).toHaveBeenCalledTimes(3)
  },
}

/** Only these, from All inputs: choosing it asks for `all: false`. */
export const ChooseOnlyThese: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('tab', { name: 'Only these' }))
    await expect(args.onchange).toHaveBeenCalledTimes(1)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'allInputs', all: false })
  },
}

/**
 * Started without the built-in synth: its lamp, output pair, buffer and master are shown, not
 * pressable, with "Not running"; the readouts show —. No Launchkey, LEDs set at launch. Light.
 */
export const NoSynth: Story = {
  args: { data: systemNoSynth },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const synth = canvas.getByRole('button', { name: 'Built-in synth' })
    await expect(synth).toHaveAttribute('aria-disabled', 'true')
    await expect(canvas.getByText('Not running')).toBeVisible()
    await userEvent.click(synth)
    await userEvent.click(canvas.getByRole('tab', { name: '256 frames' }))
    await userEvent.click(canvas.getByRole('tab', { name: 'Outputs 3–4' }))
    const master = canvas.getByRole('slider', { name: 'Master volume (fader 9)' })
    await expect(master).toHaveAttribute('aria-disabled', 'true')
    master.focus()
    await userEvent.keyboard('{ArrowUp}')
    await userEvent.click(canvas.getByRole('tab', { name: 'Palette' }))
    await expect(args.onchange).not.toHaveBeenCalled()
    await expect(canvas.queryByRole('img', { name: /^CPU/ })).toBeNull()
    await expect(canvas.getByText('Launchkey not connected')).toBeVisible()
    await expect(canvas.getByText('Not connected')).toBeVisible()
    await expect(canvas.getByRole('tab', { name: 'Light' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(canvas.getByRole('tab', { name: 'Dark' }))
    await expect(args.onchange).toHaveBeenCalledTimes(1)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'theme', theme: 'dark' })
  },
}

/** Rescanning: the button reads "Scanning…" on the waiting face and asks nothing until it ends. */
export const Scanning: Story = {
  args: { data: systemScanning },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Scanning the style folders' })
    await expect(button).toHaveTextContent('Scanning…')
    await expect(button).toHaveAttribute('data-face', 'waiting')
    await userEvent.click(button)
    await expect(args.onchange).not.toHaveBeenCalled()
  },
}

/** Nothing found, and the engine fixes every choice: the empty lines say so; Rescan and the choices can't be pressed. */
export const Empty: Story = {
  args: { data: systemEmpty },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No MIDI inputs found')).toBeVisible()
    await expect(canvas.getByText('No folders reported')).toBeVisible()
    await expect(canvas.getByText('No SoundFonts found')).toBeVisible()
    await expect(canvas.getByText('not open')).toBeVisible()
    await expect(canvas.getByRole('tab', { name: 'Only these' })).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(canvas.getByRole('tab', { name: 'Only these' }))
    await userEvent.click(canvas.getByRole('tab', { name: 'Palette' }))
    const rescan = canvas.getByRole('button', { name: 'Rescan the style folders' })
    await expect(rescan).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(rescan)
    await expect(args.onchange).not.toHaveBeenCalled()
  },
}

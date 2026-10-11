import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { multiPadsBoard, multiPadsEmpty, multiPadsLoadFailed, multiPadsLoading, multiPadsNoBanks } from './MultiPads.fixtures'
import MultiPads from './MultiPads.svelte'
import MultiPadsOnStage from './MultiPadsOnStage.svelte'
import MultiPadsPlayground from './MultiPadsPlayground.svelte'

/**
 * The Multi Pads page at the app's 1440 × 900, in the Stage's display box (Multi Pads chosen in the
 * app bar; the section row, band and keys as on the Stage). Three columns: the bank list with its
 * pager and Clear bank; the four pads, each with Select (Synchro Start) and Stop, Repeat and Chord
 * Match; and what acts on all pads: Stop all, the Multi Pad volume (Panel fader 6) and Synchro Stop.
 * The pads speak the band's pad language: ready is the Fill hue's outline, playing solid Ending red,
 * waiting for the bar line Intro gold's ring with NEXT, Synchro Start standby Ending red's ring with
 * ARMED. Every request goes out through `onchange`.
 */
const meta = {
  title: 'Screens/MultiPads',
  component: MultiPads,
  parameters: { layout: 'fullscreen' },
  args: { data: multiPadsBoard, tipAction: fn(), onchange: fn() },
  argTypes: {
    data: { control: 'object' },
  },
  render: (args) => ({ Component: MultiPadsOnStage, props: args }),
} satisfies Meta<typeof MultiPads>

export default meta
type Story = StoryObj<typeof meta>

const page = (el: HTMLElement) => within(within(el).getByRole('region', { name: 'Multi Pads page' }))

/** The board: Pop Grooves 2 while the band plays; pad 1 playing, 2 waiting for the bar, 3 armed, 4 ready. */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = page(canvasElement)
    await expect(canvas.getByRole('button', { name: /^Pad 1: Clav Riff, playing/ })).toHaveAttribute('data-face', 'playing')
    await expect(canvas.getByRole('button', { name: /^Pad 2: Brass Stabs, next bar/ })).toHaveAttribute('data-face', 'next')
    await expect(canvas.getByRole('button', { name: 'Select pad 3: Synchro Start' })).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('button', { name: /Pop Grooves 2/ })).toHaveAttribute('aria-current', 'true')
    await userEvent.click(canvas.getByRole('button', { name: /^Pad 4: Tambourine/ }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'play', pad: 3 })
    await userEvent.click(canvas.getByRole('button', { name: 'Stop pad 1' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'stop', pad: 0 })
    await userEvent.click(canvas.getByRole('button', { name: 'Repeat pad 2' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'repeat', pad: 1, on: true })
    await userEvent.click(canvas.getByRole('button', { name: 'Chord Match pad 4' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'chordMatch', pad: 3, on: true })
    await userEvent.click(canvas.getByRole('button', { name: 'Next bank' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'bank', id: '2' })
    await userEvent.click(canvas.getByRole('button', { name: 'Stop all' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'stopAll' })
    await userEvent.click(canvas.getByRole('button', { name: 'At the ending' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'synchroStop', styleStop: true, ending: true })
  },
}

/** No bank: the pads dark, their controls absent, Clear bank absent; the band stopped. */
export const NoBank: Story = {
  name: 'No bank',
  args: { data: multiPadsEmpty },
  play: async ({ canvasElement, args }) => {
    const canvas = page(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Clear bank' })).toHaveAttribute('aria-disabled', 'true')
    await expect(canvas.getByRole('button', { name: 'Stop pad 1' })).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(canvas.getByRole('button', { name: /^Pad 1: empty/ }))
    await expect(args.onchange).not.toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Previous bank' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'bank', id: '8' })
    await userEvent.click(canvas.getByRole('button', { name: 'Load a bank file' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'loadFile' })
  },
}

/** Load… failed: the file picker didn't open, and the line under the bank tools says why. */
export const LoadFailed: Story = {
  name: 'Load failed',
  args: { data: multiPadsLoadFailed },
  play: async ({ canvasElement }) => {
    const canvas = page(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent("The file picker didn't open: dialog.open not allowed")
  },
}

/** A bank loading, one pad empty, fader 6 not yet picked up, both Synchro Stops on. */
export const Loading: Story = {
  args: { data: multiPadsLoading },
  play: async ({ canvasElement }) => {
    const canvas = page(canvasElement)
    await expect(canvas.getByText('Loading…')).toBeInTheDocument()
    await expect(canvas.getByText(/pick up/)).toBeInTheDocument()
  },
}

/** No .pad files in the style folders: the list says where to put them. */
export const NoFiles: Story = {
  name: 'No files',
  args: { data: multiPadsNoBanks },
  play: async ({ canvasElement }) => {
    const canvas = page(canvasElement)
    await expect(canvas.getByText(/No .pad files/)).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Next bank' })).toHaveAttribute('aria-disabled', 'true')
  },
}

/**
 * Play with the page: every control responds. A story-only wrapper (`MultiPadsPlayground.svelte`)
 * keeps what you change, seeded from the args; each change still logs in the Actions panel.
 */
export const Playground: Story = {
  args: { data: { ...multiPadsBoard, running: false } },
  render: (args) => ({ Component: MultiPadsPlayground, props: args }),
  play: async ({ canvasElement }) => {
    const canvas = page(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /^Pad 4: Tambourine/ }))
    await expect(canvas.getByRole('button', { name: /^Pad 4: Tambourine, playing/ })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Stop all' }))
    await expect(canvas.getByRole('button', { name: /^Pad 1: Clav Riff, ready/ })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /Latin Perc/ }))
    await expect(canvas.getByRole('button', { name: /^Pad 1: Latin Groove, ready/ })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Clear bank' }))
    await expect(canvas.getByRole('button', { name: /^Pad 1: empty/ })).toBeInTheDocument()
  },
}

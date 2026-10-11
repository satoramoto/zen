import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import LibraryInstruments from './LibraryInstruments.svelte'
import { instrumentRows, instrumentsBoard, missingDetail, samplerDetail } from './LibraryInstruments.fixtures'

/**
 * Library › Instruments: the zone header (counts, the Show tabs, Rescan), the instrument list
 * with the SoundFont folder line under it, and the chosen instrument's details beside it.
 */
const meta = {
  title: 'Components/LibraryInstruments',
  component: LibraryInstruments,
  parameters: { layout: 'centered' },
  args: {
    ...instrumentsBoard,
    show: 'all',
    rows: instrumentRows,
    selected: samplerDetail.id,
    detail: samplerDetail,
    canRescan: true,
    scanning: false,
    width: 1010,
    height: 560,
    tipAction: fn(),
    onshow: fn(),
    onchoose: fn(),
    onrescan: fn(),
    onbrowse: fn(),
    onnewsound: fn(),
    onedit: fn(),
    onreplace: fn(),
    onshowracks: fn(),
    oninprocess: fn(),
  },
  argTypes: {
    summary: { control: 'text' },
    show: { control: 'inline-radio', options: ['all', 'plugins', 'fonts', 'attention'] },
    attention: { control: { type: 'number', min: 0, max: 20, step: 1 } },
    rows: { control: 'object' },
    selected: { control: 'text' },
    detail: { control: 'object' },
    canRescan: { control: 'boolean' },
    scanning: { control: 'boolean' },
    folder: { control: 'text' },
    hint: { control: 'text' },
    width: { control: { type: 'number', min: 720, max: 1440, step: 1 } },
    height: { control: { type: 'number', min: 320, max: 900, step: 1 } },
  },
} satisfies Meta<typeof LibraryInstruments>

export default meta
type Story = StoryObj<typeof meta>

/** As the board: Sampler Deluxe chosen, in process, playing on Right 1, Right 2 and Left. */
export const Board: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('tab', { name: 'Plugins' }))
    await expect(args.onshow).toHaveBeenCalledWith('plugins')
    await userEvent.click(canvas.getByRole('option', { name: /Tiny Synth/ }))
    await expect(args.onchoose).toHaveBeenCalledWith('au:aumu Tiny Demo')
    await userEvent.click(canvas.getByRole('button', { name: 'Rescan' }))
    await expect(args.onrescan).toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Browse sounds' }))
    await expect(args.onbrowse).toHaveBeenCalledWith('au:aumu Smp7 Fake')
    await userEvent.click(canvas.getByRole('button', { name: 'New sound from Sampler Deluxe on Right 1' }))
    await expect(args.onnewsound).toHaveBeenCalledWith('au:aumu Smp7 Fake')
    await userEvent.click(canvas.getByRole('button', { name: 'Edit…' }))
    await expect(args.onedit).toHaveBeenCalledWith('au:aumu Smp7 Fake')
    await userEvent.click(canvas.getByRole('button', { name: /In process/ }))
    await expect(args.oninprocess).toHaveBeenCalledWith('au:aumu Smp7 Fake', false)
  },
}

/** A missing plugin chosen, on the Needs attention tab: Replace… absent (no part plays it now), Show racks. */
export const Missing: Story = {
  args: {
    show: 'attention',
    rows: instrumentRows.filter((r) => r.missing),
    selected: missingDetail.id,
    detail: missingDetail,
    scanning: true,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Replace…' }))
    await expect(args.onreplace).not.toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Show racks' }))
    await expect(args.onshowracks).toHaveBeenCalledWith('missing:aumu Orc1 Fake')
    await userEvent.click(canvas.getByRole('button', { name: /Rescan/ }))
    await expect(args.onrescan).not.toHaveBeenCalled()
  },
}

/** Nothing found: no instruments, nothing chosen, plugins not hostable. */
export const Empty: Story = {
  args: {
    summary: '0 plugins, 0 SoundFonts',
    attention: 0,
    rows: [],
    selected: null,
    detail: null,
    canRescan: false,
    folder: '',
  },
}

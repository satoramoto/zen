import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import LibrarySounds from './LibrarySounds.svelte'
import { soundsBoard, soundsEmpty, soundsStopped } from './LibrarySounds.fixtures'

const SOURCES = ['all', 'mine', 'factory', 'soundFont', 'starred']

/**
 * Library › Sounds (its Save and Save as… are LibrarySoundsSave, in the Library header): the
 * search, Source tabs, the instrument filter and "Loads into", then the
 * categories under their "Category" heading, the sound list and the selected sound's details (Audition while the band is
 * stopped, Use on the part, Copy to My Sounds, and for My Sounds Duplicate, Move up / down,
 * Delete with its inline confirm, and the category).
 */
const meta = {
  title: 'Components/LibrarySounds',
  component: LibrarySounds,
  parameters: { layout: 'centered' },
  args: {
    ...soundsBoard,
    tipAction: fn(),
    onquery: fn(),
    onsource: fn(),
    onpart: fn(),
    onclearinstrument: fn(),
    oncategory: fn(),
    onselect: fn(),
    onstar: fn(),
    onaudition: fn(),
    onuse: fn(),
    oncopy: fn(),
    onduplicate: fn(),
    onmove: fn(),
    onaskdelete: fn(),
    oncanceldelete: fn(),
    ondelete: fn(),
    onsetcategory: fn(),
  },
  argTypes: {
    partNames: { control: 'object' },
    part: { control: { type: 'number', min: 0, max: 3, step: 1 } },
    query: { control: 'text', table: { category: 'SearchField' } },
    source: { control: 'select', options: SOURCES, table: { category: 'ChosenTabs' } },
    instrument: { control: 'text' },
    categories: { control: 'object', table: { category: 'FolderList' } },
    category: { control: 'text', table: { category: 'FolderList' } },
    rows: { control: 'object', table: { category: 'ListTable' } },
    selected: { control: 'text', table: { category: 'ListTable' } },
    emptyText: { control: 'text', table: { category: 'ListTable' } },
    detail: { control: 'object', table: { category: 'DetailPanel' } },
    running: { control: 'boolean', table: { category: 'DetailPanel' } },
    confirmDelete: { control: 'boolean', table: { category: 'DetailPanel' } },
    width: { control: { type: 'number', min: 720, max: 1440, step: 1 } },
    height: { control: { type: 'number', min: 400, max: 900, step: 1 } },
  },
} satisfies Meta<typeof LibrarySounds>

export default meta
type Story = StoryObj<typeof meta>

/** As the board: Strings, Right 2 the target, the band running so Audition is off. */
export const Board: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Stop the band to audition.')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Audition' }))
    await expect(args.onaudition).not.toHaveBeenCalled()

    // The categories' heading and the list's stand on one line, so the rows line up.
    const head = canvas.getByText('Category', { selector: '.col-head' })
    await expect(head).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('option', { name: /^—, Strings, / }))
    await expect(args.onselect).toHaveBeenCalledWith('sf:demo.sf2:0:48')
    await userEvent.click(canvas.getByRole('searchbox', { name: 'Search sounds' }))
    await userEvent.keyboard('{ArrowDown}')
    await expect(args.onselect).toHaveBeenCalledWith('saved:p42')

    await userEvent.click(canvas.getByRole('tab', { name: 'Mine' }))
    await expect(args.onsource).toHaveBeenCalledWith('mine')
    await userEvent.click(canvas.getByRole('tab', { name: 'Load into Left' }))
    await expect(args.onpart).toHaveBeenCalledWith(3)
    await userEvent.click(canvas.getByRole('button', { name: /^Piano/ }))
    await expect(args.oncategory).toHaveBeenCalledWith('piano')

    await userEvent.click(canvas.getByRole('button', { name: 'Duplicate' }))
    await expect(args.onduplicate).toHaveBeenCalledWith('saved:p41')
    await userEvent.click(canvas.getByRole('button', { name: 'Move up' }))
    await expect(args.onmove).toHaveBeenCalledWith('saved:p41', -1)
    await userEvent.click(canvas.getByRole('button', { name: 'Delete' }))
    await expect(args.onaskdelete).toHaveBeenCalled()
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Category' }), 'pad')
    await expect(args.onsetcategory).toHaveBeenCalledWith('saved:p41', 'pad')
  },
}

/** The band stopped, a SoundFont preset selected: Audition and Use on Right 2 work. */
export const Stopped: Story = {
  args: { ...soundsStopped },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Audition' }))
    await expect(args.onaudition).toHaveBeenCalledWith('sf:demo.sf2:0:49')
    await userEvent.click(canvas.getByRole('button', { name: 'Use on Right 2' }))
    await expect(args.onuse).toHaveBeenCalledWith('sf:demo.sf2:0:49')
    await userEvent.click(canvas.getByRole('button', { name: 'Copy to My Sounds' }))
    await expect(args.oncopy).toHaveBeenCalledWith('sf:demo.sf2:0:49')
  },
}

/** Delete's inline confirm open on Silk Strings. */
export const ConfirmDelete: Story = {
  args: { confirmDelete: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Delete for good' }))
    await expect(args.ondelete).toHaveBeenCalledWith('saved:p41')
    await userEvent.click(canvas.getByRole('button', { name: 'Keep' }))
    await expect(args.oncanceldelete).toHaveBeenCalled()
  },
}

/** Browsing Sampler Deluxe's sounds with a search nothing matches: the instrument filter shows and clears. */
export const Empty: Story = {
  args: { ...soundsEmpty },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(soundsEmpty.emptyText)).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Show every instrument, not only Sampler Deluxe' }))
    await expect(args.onclearinstrument).toHaveBeenCalled()
  },
}

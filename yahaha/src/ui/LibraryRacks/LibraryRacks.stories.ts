import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import LibraryRacks from './LibraryRacks.svelte'
import { racksBoard, racksStyle } from './LibraryRacks.fixtures'

/**
 * Library › Racks: the zone header (count, search, Needs attention, + New rack), the rack list
 * with the live rack's "Loaded now" line, the chosen rack's details (rename, parts, Load,
 * Duplicate, Delete with its inline confirm), and the loaded style's Style racks.
 */
const meta = {
  title: 'Components/LibraryRacks',
  component: LibraryRacks,
  parameters: { layout: 'centered' },
  args: {
    ...racksBoard,
    tipAction: fn(),
    onquery: fn(),
    onattention: fn(),
    onnew: fn(),
    onsave: fn(),
    onsaveasopen: fn(),
    onsaveasname: fn(),
    onsaveas: fn(),
    onsaveascancel: fn(),
    onselect: fn(),
    onload: fn(),
    onrename: fn(),
    onduplicate: fn(),
    onaskdelete: fn(),
    oncanceldelete: fn(),
    ondelete: fn(),
    onotsrack: fn(),
    onotslink: fn(),
    onotstiming: fn(),
  },
  argTypes: {
    count: { control: { type: 'number', min: 0, step: 1 } },
    query: { control: 'text' },
    attention: { control: 'boolean' },
    attentionCount: { control: { type: 'number', min: 0, step: 1 } },
    loaded: { control: 'object' },
    missing: { control: 'object' },
    saveAsName: { control: 'text' },
    rows: { control: 'object', table: { category: 'ListTable' } },
    selected: { control: 'text', table: { category: 'ListTable' } },
    emptyText: { control: 'text', table: { category: 'ListTable' } },
    chosen: { control: 'object', table: { category: 'DetailPanel' } },
    confirming: { control: 'boolean', table: { category: 'DetailPanel' } },
    styleRacks: { control: 'object' },
    width: { control: { type: 'number', min: 720, max: 1440, step: 1 } },
    height: { control: { type: 'number', min: 400, max: 900, step: 1 } },
  },
} satisfies Meta<typeof LibraryRacks>

export default meta
type Story = StoryObj<typeof meta>

/** As the board: Sunday drive loaded (modified, Right 3's plugin missing), Organ chosen with its delete confirm open. */
export const Board: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'New rack' }))
    await expect(args.onnew).toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Save Sunday drive' }))
    await expect(args.onsave).toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Save Sunday drive as a new rack' }))
    await expect(args.onsaveasopen).toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: /^Needs attention/ }))
    await expect(args.onattention).toHaveBeenCalledWith(true)
    await expect(canvas.getByText('Orchestra Deluxe missing, part silent', { exact: false })).toBeInTheDocument()

    await userEvent.dblClick(canvas.getByRole('option', { name: /^Evening, / }))
    await expect(args.onload).toHaveBeenCalledWith('evening')
    await userEvent.click(canvas.getByRole('button', { name: 'Load Organ' }))
    await expect(args.onload).toHaveBeenCalledWith('organ')
    await userEvent.click(canvas.getByRole('button', { name: 'Duplicate Organ' }))
    await expect(args.onduplicate).toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Delete Organ' }))
    await expect(args.onaskdelete).toHaveBeenCalled()
    await expect(canvas.getByRole('alertdialog')).toHaveTextContent('Quick Rack A4 will be empty.')
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel: keep Organ' }))
    await expect(args.oncanceldelete).toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Delete Organ for good' }))
    await expect(args.ondelete).toHaveBeenCalled()

    const name = canvas.getByRole('textbox', { name: 'Rack name' })
    await userEvent.clear(name)
    await userEvent.type(name, 'Jazz organ{Enter}')
    await expect(args.onrename).toHaveBeenCalledWith('Jazz organ')

    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'One Touch 1 loads' }), 'evening')
    await expect(args.onotsrack).toHaveBeenCalledWith(0, 'evening')
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'One Touch 2 loads' }), '')
    await expect(args.onotsrack).toHaveBeenCalledWith(1, null)
    await userEvent.click(canvas.getByRole('button', { name: 'One Touch Link OTS Link' }))
    await expect(args.onotslink).toHaveBeenCalledWith(true)
    await userEvent.click(canvas.getByRole('tab', { name: 'Immediate' }))
    await expect(args.onotstiming).toHaveBeenCalledWith('immediate')
  },
}

/** Save as… open with a name typed; the loaded rack chosen, so Load and Delete are off. */
export const SavingAs: Story = {
  args: {
    saveAsName: 'Sunday drive copy',
    selected: 'sunday',
    confirming: false,
    chosen: {
      id: 'sunday',
      name: 'Sunday drive',
      loaded: true,
      subtitle: 'Quick Rack A1',
      parts: [
        { tag: 'R1', name: 'Stage Grand', on: true },
        { tag: 'R2', name: 'Silk Strings', on: true },
        { tag: 'R3', name: 'Orchestra Deluxe', on: true },
        { tag: 'L', name: 'Fingered Bass', on: true },
      ],
      deleteNote: 'Quick Rack A1 will be empty.',
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Save as Sunday drive copy' }))
    await expect(args.onsaveas).toHaveBeenCalledWith('Sunday drive copy')
    await userEvent.click(canvas.getByRole('button', { name: 'Delete Sunday drive' }))
    await expect(args.onaskdelete).not.toHaveBeenCalled()
  },
}

/** No racks yet, nothing chosen, a new rack loaded; the style's racks can't be changed. */
export const Empty: Story = {
  args: {
    count: 0,
    attentionCount: 0,
    loaded: { name: 'Untitled rack', modified: false, missing: false, slot: '', canSave: true },
    missing: [],
    rows: [],
    selected: null,
    emptyText: 'No racks yet. Save the live rack to make one.',
    chosen: null,
    confirming: false,
    styleRacks: { ...racksStyle, slots: racksStyle.slots.map(() => ({ rack: null, missing: false })), racks: [], applied: 0, readOnly: true },
  },
}

import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test'
import { bankCSlots, litStoreUndo, newRackWaiting, quickRacksBoard, quickRacksRest, storeUndo } from './QuickRacks.fixtures'
import QuickRacksPlayground from './QuickRacksPlayground.svelte'
import QuickRacksScreen from './QuickRacksScreen.svelte'

const CALLBACKS = [
  'onbank',
  'onstep',
  'onstore',
  'onslot',
  'onslotlong',
  'onclear',
  'onlibrary',
  'onots',
  'onotsrack',
  'onlink',
  'ontiming',
  'onname',
  'onsave',
  'oncancel',
  'onundo',
]

const actions = Object.fromEntries(CALLBACKS.map((name) => [name, fn()]))

/**
 * The Quick Racks page tab at the app's 1440 × 900 (QuickRacks-Dark): the Stage with Quick Racks
 * chosen in the app bar and the page in the display's box (1392 × 288). No now-playing block: the
 * app bar names the rack and the style. The bank's eight slots in one row (the live rack the solid
 * block, with the modified dot; stored an outline; empty a faded outline), Bank A–H as tabs, Store,
 * Rack ◀ ▶ and Library › Racks in the header; One Touch 1–4 below, each with what it loads for this
 * style, and Link with its timing; the legend and the gesture help, or a waiting Store's Save, at
 * the foot. The Stage around it is one object control (`stage`).
 */
const meta = {
  title: 'Screens/QuickRacks',
  component: QuickRacksScreen,
  parameters: { layout: 'fullscreen' },
  args: { ...quickRacksRest, tipAction: fn(), ...actions },
  argTypes: {
    stage: { control: 'object', table: { category: 'Stage' } },
    bank: { control: { type: 'range', min: 0, max: 7, step: 1 } },
    bankCount: { control: { type: 'number', min: 1, max: 8 } },
    slots: { control: 'object' },
    lit: { control: 'text' },
    store: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    waiting: { control: 'object' },
    undo: { control: 'object' },
    oneTouch: { control: 'object' },
  },
} satisfies Meta<typeof QuickRacksScreen>

export default meta
type Story = StoryObj<typeof meta>

/**
 * At rest: bank A, Sunday drive loaded (A1) and modified, three racks stored, four empty; One Touch
 * 2 applied, OTS 4 loading your Organ rack, Link off.
 */
export const Rest: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const page = canvas.getByRole('region', { name: 'Quick Racks' })
    const q = within(page)
    await expect(q.getByRole('button', { name: 'Quick Rack A1, Sunday drive, loaded, modified' })).toBeInTheDocument()
    await expect(q.queryByRole('button', { name: /^Undo store/ })).toBeNull()
    await userEvent.click(q.getByRole('button', { name: 'Quick Rack A2, Warm keys' }))
    await expect(args.onslot).toHaveBeenLastCalledWith(1)
    await fireEvent.contextMenu(q.getByRole('button', { name: 'Quick Rack A3, Lead synth' }))
    await expect(args.onslotlong).toHaveBeenLastCalledWith(2)
    await userEvent.click(q.getByRole('button', { name: 'Clear Quick Rack A4' }))
    await expect(args.onclear).toHaveBeenLastCalledWith(3)
    await expect(q.queryByRole('button', { name: 'Clear Quick Rack A5' })).toBeNull()
    await userEvent.click(q.getByRole('tab', { name: 'Bank C' }))
    await expect(args.onbank).toHaveBeenLastCalledWith(2)
    await userEvent.click(q.getByRole('button', { name: 'Store' }))
    await expect(args.onstore).toHaveBeenCalled()
    await userEvent.click(q.getByRole('button', { name: 'Next rack' }))
    await expect(args.onstep).toHaveBeenLastCalledWith(1)
    await userEvent.click(q.getByRole('button', { name: 'Open Library on its Racks page' }))
    await expect(args.onlibrary).toHaveBeenCalled()
    await userEvent.click(q.getByRole('button', { name: /Piano solo, One Touch 1/ }))
    await expect(args.onots).toHaveBeenLastCalledWith(0)
    await expect(q.getByRole('button', { name: /Strings up, One Touch 2, applied/ })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.selectOptions(q.getByRole('combobox', { name: 'OTS 1 loads' }), 'r-warm')
    await expect(args.onotsrack).toHaveBeenLastCalledWith(0, 'r-warm')
    await expect(q.getByRole('combobox', { name: 'OTS 4 loads' })).toHaveValue('r-organ')
    await userEvent.click(q.getByRole('button', { name: 'Link' }))
    await expect(args.onlink).toHaveBeenCalled()
    await userEvent.click(q.getByRole('tab', { name: 'Immediate' }))
    await expect(args.ontiming).toHaveBeenLastCalledWith('immediate')
  },
}

/**
 * The board (QuickRacks-Dark): Store armed, every slot not loaded rings as a store target; A5 was
 * tapped while Sunday drive is modified, so it waits for Save, and the foot asks: Save rack or
 * Cancel.
 */
export const Board: Story = {
  args: { ...quickRacksBoard },
  play: async ({ canvasElement, args }) => {
    const q = within(canvasElement)
    await expect(q.getByRole('button', { name: 'Quick Rack A5, empty, waiting for Save' })).toBeInTheDocument()
    await expect(q.getByRole('group', { name: 'Save the rack to store it on A5' })).toHaveTextContent('Sunday drive modified')
    await userEvent.click(q.getByRole('button', { name: 'Save rack' }))
    await expect(args.onsave).toHaveBeenCalled()
    await userEvent.click(q.getByRole('button', { name: 'Cancel' }))
    await expect(args.oncancel).toHaveBeenCalled()
  },
}

/** A Store waiting on a rack never saved: the foot asks for its name. */
export const NameNewRack: Story = {
  args: {
    ...quickRacksBoard,
    slots: quickRacksBoard.slots.map((s) => (s.state === 'loaded' ? { ...s, state: 'stored' as const, modified: false } : s)),
    lit: '',
    waiting: newRackWaiting,
  },
  play: async ({ canvasElement, args }) => {
    const q = within(canvasElement)
    const field = q.getByRole('textbox', { name: 'Rack name' })
    await expect(field).toHaveValue('New rack')
    await userEvent.type(field, '!')
    await expect(args.onname).toHaveBeenLastCalledWith('New rack!')
  },
}

/**
 * After a store: Sunday drive was saved over Lead synth on A3 with a long press, so "Undo store on
 * A3" shows in the header; pressing it takes the store back (Lead synth on A3 again).
 */
export const AfterStore: Story = {
  args: { undo: storeUndo },
  play: async ({ canvasElement, args }) => {
    const q = within(canvasElement)
    const undo = q.getByRole('button', { name: 'Undo store on A3: put Lead synth back' })
    await expect(undo).toHaveTextContent('Undo store on A3')
    await userEvent.click(undo)
    await expect(args.onundo).toHaveBeenCalled()
  },
}

/**
 * After a store over the lit rack: Sunday drive saved over itself on A1, the old one kept as
 * "Previous: Sunday drive"; Undo puts it back.
 */
export const AfterStoreOverLit: Story = {
  args: { undo: litStoreUndo },
  play: async ({ canvasElement }) => {
    const q = within(canvasElement)
    await expect(q.getByRole('button', { name: 'Undo store on A1: put Sunday drive back' })).toBeInTheDocument()
  },
}

/** Bank C: one stored rack, one whose rack is gone (⚠, in the warning hue), the rest empty, none lit. */
export const BankC: Story = {
  args: { bank: 2, slots: bankCSlots, lit: '' },
  play: async ({ canvasElement }) => {
    const q = within(canvasElement)
    await expect(q.getByRole('button', { name: 'Quick Rack C3, rack missing' })).toBeInTheDocument()
    await expect(q.getByRole('tab', { name: 'Bank C' })).toHaveAttribute('aria-selected', 'true')
  },
}

/**
 * Read-only: Quick Racks can't be changed (a newer yahaha's file, or no data folder). The slots
 * and Store are shown disabled and the foot says why; One Touch still works, but its rack choices
 * are locked too.
 */
export const ReadOnly: Story = {
  args: { readOnly: true, undo: storeUndo, oneTouch: { ...quickRacksRest.oneTouch, readOnly: true } },
  play: async ({ canvasElement }) => {
    const q = within(canvasElement)
    await expect(q.getByRole('button', { name: 'Quick Rack A2, Warm keys' })).toHaveAttribute('aria-disabled', 'true')
    await expect(q.queryByRole('button', { name: 'Clear Quick Rack A2' })).toBeNull()
    await expect(q.getByRole('combobox', { name: 'OTS 1 loads' })).toBeDisabled()
    await expect(q.getByText(/can't be changed/)).toBeInTheDocument()
    await expect(q.queryByRole('button', { name: /^Undo store/ })).toBeNull()
  },
}

/**
 * Play with the page: the controls respond (a story-only wrapper, `QuickRacksPlayground.svelte`,
 * keeps what you change; editing a control re-seeds it; every press still logs in Actions).
 *
 * - Bank letters switch the bank; each keeps its own slots.
 * - A tap loads a stored slot (the solid block and Lit follow); the lit one recalls it clean.
 * - Store arms; a tap then stores the live rack, or waits for Save while it's modified.
 * - A long press or right-click saves over a slot, and Undo takes it back; ✕ empties one; Rack ◀ ▶
 *   step the stored slots.
 * - One Touch applies, its selects pick what it loads, Link and the timing switch.
 */
export const Playground: Story = {
  render: (args) => ({ Component: QuickRacksPlayground, props: args }),
  play: async ({ canvasElement }) => {
    const q = within(canvasElement)
    await userEvent.click(q.getByRole('button', { name: 'Quick Rack A2, Warm keys' }))
    await expect(q.getByRole('button', { name: 'Quick Rack A2, Warm keys, loaded' })).toBeInTheDocument()
    await userEvent.click(q.getByRole('button', { name: 'Clear Quick Rack A3' }))
    await expect(q.getByRole('button', { name: 'Quick Rack A3, empty' })).toBeInTheDocument()
    await fireEvent.contextMenu(q.getByRole('button', { name: 'Quick Rack A4, Organ' }))
    await expect(q.getByRole('button', { name: 'Quick Rack A4, Warm keys, loaded' })).toBeInTheDocument()
    await userEvent.click(q.getByRole('button', { name: 'Undo store on A4: put Organ back' }))
    await expect(q.getByRole('button', { name: 'Quick Rack A4, Organ' })).toBeInTheDocument()
    await expect(q.queryByRole('button', { name: /^Undo store/ })).toBeNull()
    await userEvent.click(q.getByRole('button', { name: /Brass hits, One Touch 3/ }))
    await expect(q.getByRole('button', { name: /Brass hits, One Touch 3, applied/ })).toBeInTheDocument()
  },
}

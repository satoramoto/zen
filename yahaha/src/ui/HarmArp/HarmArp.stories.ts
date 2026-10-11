import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import HarmArp from './HarmArp.svelte'
import {
  harmArpArpeggio,
  harmArpBoard,
  harmArpBrowsing,
  harmArpEcho,
  harmArpLoading,
  harmArpMulti,
} from './HarmArp.fixtures'
import HarmArpPlayground from './HarmArpPlayground.svelte'
import HarmArpScreen from './HarmArpScreen.svelte'

/**
 * The Harm/Arp page at the app's 1440 × 900: the Stage with Harm/Arp chosen in the app bar and the
 * page in the display's box (1392 × 288); the section row, band, status line and keys as on the
 * Stage. The band's Harm/Arp lamp is the page's switch, drawn twice. Two sections, each in its hue:
 *
 * - **Harmony / Arpeggio** (accent): the selected type's name and category, the switch (fader button
 *   5); the category tabs (the three Harmony categories, then one per arpeggio category), which only
 *   browse; the grid of the viewed category, the selected type a solid block. A click on a type is
 *   what picks it. With an arpeggio selected, Quantize and Velocity stand at the section's foot.
 * - **Settings** (Right 1 blue): the rows the selected type has.
 *
 * `data` is one object control; every change goes out through `onchange`, every tab through `onview`.
 */
const meta = {
  title: 'Screens/HarmArp',
  component: HarmArp,
  parameters: { layout: 'fullscreen' },
  args: { data: harmArpBoard, tipAction: fn(), onchange: fn(), onview: fn() },
  argTypes: {
    data: { control: 'object' },
  },
  render: (args) => ({ Component: HarmArpScreen, props: args }),
} satisfies Meta<typeof HarmArp>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The Harmony board: Standard Duet 1, on. Assign Auto, Volume 100 (knob 5 on the Rack knob page),
 * Touch limit 1, Chord note only off.
 */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="page"]')!
    const inPage = within(page)
    await expect(inPage.getByRole('button', { name: 'Harmony/Arpeggio on (fader button 5)' })).toHaveAttribute('aria-pressed', 'true')
    await expect(inPage.getByRole('button', { name: 'Standard Duet 1' })).toHaveAttribute('aria-pressed', 'true')
    await expect(within(inPage.getByRole('group', { name: 'Harmony types' })).getAllByRole('button')).toHaveLength(19)
    await expect(inPage.getByRole('tab', { name: 'Harmony: 19 types, selected type here' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(inPage.getByRole('tab', { name: /^Echo:/ }))
    await expect(args.onview).toHaveBeenCalledWith({ group: 'harmony', name: 'Echo' })
    await userEvent.click(inPage.getByRole('button', { name: 'Rock Duet' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'pick', group: 'harmony', index: 4 })
    await userEvent.click(inPage.getByRole('button', { name: /^Harmony\/Arpeggio on/ }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'on', on: false })
    await userEvent.click(inPage.getByRole('tab', { name: 'Right 2' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'assign', assign: 'right2' })
    await userEvent.click(inPage.getByRole('button', { name: 'Chord note only' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'chordNoteOnly', on: true })
    await expect(inPage.getByText('Knob 5')).toBeVisible()
    await expect(canvas.queryByRole('slider', { name: 'Speed' })).toBeNull()
  },
}

/** Echo selected: the caption "Echo", a grid of three, Speed between Volume and Touch limit; Assign Right 2. */
export const Echo: Story = {
  args: { data: harmArpEcho },
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement.querySelector<HTMLElement>('[data-slot="page"]')!)
    await expect(within(page.getByRole('group', { name: 'Echo types' })).getAllByRole('button')).toHaveLength(3)
    await userEvent.click(within(page.getByRole('tablist', { name: 'Speed' })).getByRole('tab', { name: '1/16' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'speed', speed: '1/16' })
    await expect(page.queryByRole('button', { name: 'Chord note only' })).toBeNull()
  },
}

/** Multi Assign selected: it has no settings, and a note says so. */
export const MultiAssign: Story = {
  args: { data: harmArpMulti },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.querySelector<HTMLElement>('[data-slot="page"]')!)
    await expect(page.getByText(/Multi Assign has no settings/)).toBeVisible()
    await expect(page.queryByRole('tablist', { name: 'Assign' })).toBeNull()
  },
}

/**
 * The Harmony-Arp board: Climb 16 (Up & Down) with Hold on, Quantize 1/16 and a fixed velocity of
 * 96. Quantize and Velocity at the type section's foot; Assign (no Multi: an arpeggio plays on every
 * Right part that is on, or on one), Volume, Hold with the Hold pedal's switch, and Keep Key On.
 */
export const Arpeggio: Story = {
  args: { data: harmArpArpeggio },
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement.querySelector<HTMLElement>('[data-slot="page"]')!)
    await expect(page.getByText('Arpeggio · Up & Down')).toBeVisible()
    await expect(page.queryByRole('tab', { name: 'Multi' })).toBeNull()
    await expect(page.getByRole('button', { name: 'Arpeggio Hold' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(page.getByRole('button', { name: 'Arpeggio Hold pedal' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'pedalHold', on: true })
    await userEvent.click(page.getByRole('button', { name: 'Keep Key On' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'keepKeyOn', on: true })
    await userEvent.click(within(page.getByRole('tablist', { name: 'Arpeggio quantize' })).getByRole('tab', { name: 'Off' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'quantize', quantize: 'off' })
    await userEvent.click(within(page.getByRole('tablist', { name: 'Arpeggio velocity' })).getByRole('tab', { name: 'As played' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'velocity', mode: 'thru', velocity: 96 })
    const fixed = page.getByRole('slider', { name: 'Fixed velocity' })
    fixed.focus()
    await userEvent.keyboard('{ArrowUp}')
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'velocity', mode: 'fixed', velocity: 97 })
  },
}

/** Browsing: the Chord Stab patterns are shown while Standard Duet 1 stays selected, so no block. */
export const Browsing: Story = {
  args: { data: harmArpBrowsing },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.querySelector<HTMLElement>('[data-slot="page"]')!)
    const grid = page.getByRole('group', { name: 'Chord Stab patterns' })
    await expect(within(grid).getAllByRole('button').every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true)
    await expect(page.getByText('Standard Duet 1')).toBeVisible()
  },
}

/** Switched off, before the library's lists arrive (no arpeggio tabs, an empty grid), on a rack map with no Harmony volume knob. */
export const Loading: Story = {
  args: { data: harmArpLoading },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.querySelector<HTMLElement>('[data-slot="page"]')!)
    await expect(page.getByRole('button', { name: 'Harmony/Arpeggio off (fader button 5)' })).toHaveAttribute('aria-pressed', 'false')
    await expect(within(page.getByRole('tablist', { name: 'Arpeggio categories' })).queryAllByRole('tab')).toHaveLength(0)
    await expect(page.queryByText(/^Knob/)).toBeNull()
  },
}

/**
 * Play with the page: every control responds. A story-only wrapper (`HarmArpPlayground.svelte`)
 * keeps what you change. The category tabs browse without changing the type; a click on a type
 * picks it and the tabs snap to its category; the settings column follows the type's kind; the
 * switch lights the band's Harm/Arp lamp too. Each change still logs in the Actions panel.
 */
export const Playground: Story = {
  render: (args) => ({ Component: HarmArpPlayground, props: args }),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.querySelector<HTMLElement>('[data-slot="page"]')!)
    await userEvent.click(page.getByRole('tab', { name: /^Guitar:/ }))
    await userEvent.click(page.getByRole('button', { name: 'Campfire Strum' }))
    await expect(page.getByRole('button', { name: 'Campfire Strum' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('Arpeggio · Guitar')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Arpeggio settings' })).toBeVisible()
    await userEvent.click(page.getByRole('tab', { name: /^Harmony:/ }))
    await userEvent.click(page.getByRole('button', { name: 'Block' }))
    await expect(page.getByRole('heading', { name: 'Harmony settings' })).toBeVisible()
  },
}

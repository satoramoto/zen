import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import SettingsLaunchkey from './SettingsLaunchkey.svelte'
import { launchkeyBoard, launchkeyDefault, launchkeyPageLeftOut } from './SettingsLaunchkey.fixtures'

/**
 * The Settings screen's Launchkey page: the order Pad Bank ▲ ▼ steps through the pad pages.
 * Sections is fixed first; each other page has a Shown lamp and ▲ ▼ to move it (no drag). A page
 * left out sits last, unnumbered. Controlled: every press is reported through `onchange`.
 */
const meta = {
  title: 'Components/SettingsLaunchkey',
  component: SettingsLaunchkey,
  parameters: { layout: 'centered' },
  args: { data: launchkeyBoard, tipAction: fn(), onchange: fn() },
  argTypes: {
    data: { control: 'object' },
  },
} satisfies Meta<typeof SettingsLaunchkey>

export default meta
type Story = StoryObj<typeof meta>

/** The page cells of each body row: number, name. */
function bodyRows(canvasElement: HTMLElement) {
  return [...canvasElement.querySelectorAll('tbody tr')].map((row) => {
    const cells = row.querySelectorAll('td')
    return [cells[0].textContent?.trim(), cells[1].textContent?.trim()]
  })
}

/** The board: all five shown, Setup moved up. ▼ moves a page later, a Shown lamp switched off leaves it out, Default order resets. */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(bodyRows(canvasElement)).toEqual([
      ['1', 'Sections'],
      ['2', 'Racks'],
      ['3', 'Chord'],
      ['4', 'Setup'],
      ['5', 'Multi Pads'],
    ])
    for (const fixed of canvas.getAllByRole('button', { name: 'Sections is fixed as page 1' })) {
      await expect(fixed).toHaveAttribute('aria-disabled', 'true')
    }
    await expect(canvas.getByRole('button', { name: 'Move Racks up' })).toHaveAttribute('aria-disabled', 'true')
    await expect(canvas.getByRole('button', { name: 'Move Multi Pads down' })).toHaveAttribute('aria-disabled', 'true')

    const down = canvas.getByRole('button', { name: 'Move Racks down' })
    await expect(down).toHaveAttribute('data-tip', 'settings.pad_pages.down')
    await expect(args.tipAction).toHaveBeenCalledWith(down, 'settings.pad_pages.down')
    await userEvent.click(down)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'move', id: 'racks', delta: 1 })
    await userEvent.click(canvas.getByRole('button', { name: 'Move Setup up' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'move', id: 'setup', delta: -1 })

    const chord = canvas.getByRole('button', { name: 'Show the Chord page' })
    await expect(chord).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(chord)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'shown', id: 'chord', on: false })
    await expect(chord).toHaveAttribute('aria-pressed', 'true')

    await expect(canvas.getByText('5 pages')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Default order' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'reset' })
  },
}

/** Multi Pads left out: listed last and unnumbered, its ▲ ▼ not pressable; switching it on asks to show it. */
export const PageLeftOut: Story = {
  args: { data: launchkeyPageLeftOut },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(bodyRows(canvasElement)).toEqual([
      ['1', 'Sections'],
      ['2', 'Racks'],
      ['3', 'Chord'],
      ['4', 'Setup'],
      ['', 'Multi Pads'],
    ])
    const up = canvas.getByRole('button', { name: 'Move Multi Pads up' })
    const down = canvas.getByRole('button', { name: 'Move Multi Pads down' })
    await expect(up).toHaveAttribute('aria-disabled', 'true')
    await expect(down).toHaveAttribute('aria-disabled', 'true')
    // Setup is now the last shown page: its ▼ is not pressable.
    await expect(canvas.getByRole('button', { name: 'Move Setup down' })).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(up)
    await userEvent.click(down)
    await expect(args.onchange).not.toHaveBeenCalled()
    await expect(canvas.getByText('4 pages')).toBeInTheDocument()

    const multi = canvas.getByRole('button', { name: 'Show the Multi Pads page' })
    await expect(multi).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(multi)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'shown', id: 'multiPads', on: true })
  },
}

/** The default order: Multi Pads before Setup, and Default order is shown, not pressable. */
export const DefaultOrder: Story = {
  args: { data: launchkeyDefault },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(bodyRows(canvasElement).map(([, name]) => name)).toEqual([
      'Sections',
      'Racks',
      'Chord',
      'Multi Pads',
      'Setup',
    ])
    const reset = canvas.getByRole('button', { name: 'Default order' })
    await expect(reset).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(reset)
    await expect(args.onchange).not.toHaveBeenCalled()
  },
}

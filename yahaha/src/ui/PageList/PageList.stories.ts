import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import PageList from './PageList.svelte'
import { settingsPages } from './PageList.fixtures'

/**
 * A vertical list of pages, one row each: the page's name in `--type-strong`, on hairlines. The
 * open page is the chosen
 * block, a solid `--neutral` fill with its text in `--on-ink`, as a chosen tab is. Page navigation:
 * buttons with `aria-current="page"`; ↑ ↓ Home End move focus and call `onchoose`. Controlled: the
 * parent moves `chosen`.
 */
const meta = {
  title: 'Primitives/PageList',
  component: PageList,
  parameters: { layout: 'centered' },
  args: { pages: settingsPages, chosen: 'chord', label: 'Settings pages', onchoose: fn(), tipAction: fn() },
  argTypes: {
    pages: { control: 'object' },
    chosen: { control: 'select', options: [null, ...settingsPages.map((page) => page.id)] },
    label: { control: 'text' },
  },
} satisfies Meta<typeof PageList>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The Settings screen's left column: Chord & Split open, then Style, Keyboard, Pedals, System and
 * Controller, names only. A click calls `onchoose` with the page's id
 * and leaves `chosen` to the parent.
 */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('navigation', { name: 'Settings pages' })).toBeInTheDocument()
    const rows = canvas.getAllByRole('button')
    await expect(rows).toHaveLength(6)
    const chord = canvas.getByRole('button', { name: /Chord & Split/ })
    await expect(chord).toHaveAttribute('aria-current', 'page')
    await expect(chord).toHaveTextContent(/^Chord & Split$/)
    await expect(chord).toHaveAttribute('data-tip', 'settings.tab.chord')
    for (const row of rows.filter((r) => r !== chord)) await expect(row).not.toHaveAttribute('aria-current')
    await expect(canvas.getByRole('button', { name: /System/ })).toHaveTextContent(/^System$/)
    await expect(args.tipAction).toHaveBeenCalledWith(chord, 'settings.tab.chord')

    await userEvent.click(canvas.getByRole('button', { name: /Pedals/ }))
    await expect(args.onchoose).toHaveBeenLastCalledWith('pedals')
    await expect(chord).toHaveAttribute('aria-current', 'page')
  },
}

/**
 * Keys: ↓ from Chord & Split focuses Style and calls `onchoose('style')`; End goes to Controller;
 * ↓ from the last wraps to the first; ↑ from the first wraps to the last; Home to the first.
 */
export const Keys: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const row = (name: RegExp) => canvas.getByRole('button', { name })
    row(/Chord & Split/).focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(args.onchoose).toHaveBeenLastCalledWith('style')
    await expect(row(/^Style/)).toHaveFocus()
    await userEvent.keyboard('{End}')
    await expect(args.onchoose).toHaveBeenLastCalledWith('launchkey')
    await expect(row(/Controller/)).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(args.onchoose).toHaveBeenLastCalledWith('chord')
    await userEvent.keyboard('{ArrowUp}')
    await expect(args.onchoose).toHaveBeenLastCalledWith('launchkey')
    await userEvent.keyboard('{Home}')
    await expect(args.onchoose).toHaveBeenLastCalledWith('chord')
    await expect(row(/Chord & Split/)).toHaveFocus()
    await expect(args.onchoose).toHaveBeenCalledTimes(5)
  },
}

/** The System page open: the chosen block moves with `chosen`, and only that row is current. */
export const SystemOpen: Story = {
  args: { chosen: 'system' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /System/ })).toHaveAttribute('aria-current', 'page')
    await expect(canvas.getByRole('button', { name: /Chord & Split/ })).not.toHaveAttribute('aria-current')
  },
}

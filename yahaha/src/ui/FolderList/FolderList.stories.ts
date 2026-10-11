import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import FolderList from './FolderList.svelte'
import { soundCategories, styleFolders } from './FolderList.fixtures'

const ALL_IDS = [...styleFolders, ...soundCategories].map((item) => item.id)

/**
 * A vertical one-of-many list: the Library's style folders and sound categories. The chosen row is
 * a solid `--neutral` fill in `--on-ink`; the rest `--t2` with the count in `--m`. One tab stop;
 * ↑ ↓ Home End move along the rows and choose. The parent owns `chosen`.
 */
const meta = {
  title: 'Primitives/FolderList',
  component: FolderList,
  parameters: { layout: 'centered' },
  args: {
    items: styleFolders,
    chosen: 'pop',
    label: 'Style folders',
    width: 220,
    height: 280,
    onchoose: fn(),
    tipAction: fn(),
  },
  argTypes: {
    items: { control: 'object' },
    chosen: { control: 'select', options: [null, ...ALL_IDS] },
    label: { control: 'text' },
    width: { control: { type: 'number', min: 80, step: 10 } },
    height: { control: { type: 'number', min: 28, step: 28 } },
  },
} satisfies Meta<typeof FolderList>

export default meta
type Story = StoryObj<typeof meta>

/** The style folders, Pop & Rock chosen; taller than its box, so it scrolls. A click calls through. */
export const Styles: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: 'Style folders' })
    const buttons = within(nav).getAllByRole('button')
    await expect(buttons).toHaveLength(styleFolders.length)
    const pop = canvas.getByRole('button', { name: 'Pop & Rock 86' })
    await expect(pop).toHaveAttribute('aria-current', 'true')
    await expect(pop).toHaveAttribute('tabindex', '0')
    await expect(pop).toHaveAttribute('data-tip', 'library.folder')
    await expect(args.tipAction).toHaveBeenCalledWith(pop, 'library.folder')
    for (const button of buttons.filter((b) => b !== pop)) await expect(button).not.toHaveAttribute('aria-current')
    await expect(canvas.getByRole('button', { name: /Imported/ })).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: 'Latin 52' }))
    await expect(args.onchoose).toHaveBeenLastCalledWith('latin')
  },
}

/** ↑ ↓ Home End move focus and choose; the keys stop at the ends and skip disabled rows. */
export const Keys: Story = {
  play: async ({ canvasElement, args }) => {
    const spy = fn()
    window.addEventListener('keydown', spy)
    try {
      const canvas = within(canvasElement)
      const button = (name: RegExp) => canvas.getByRole('button', { name })
      button(/^Pop & Rock/).focus()
      await userEvent.keyboard('{ArrowDown}')
      await expect(args.onchoose).toHaveBeenLastCalledWith('ballad')
      await expect(button(/^Ballad/)).toHaveFocus()
      await userEvent.keyboard('{ArrowUp}{ArrowUp}')
      await expect(args.onchoose).toHaveBeenLastCalledWith('favourites')
      await userEvent.keyboard('{Home}')
      await expect(args.onchoose).toHaveBeenLastCalledWith('all')
      await userEvent.keyboard('{ArrowUp}')
      await expect(button(/^All styles/)).toHaveFocus()
      await userEvent.keyboard('{End}')
      await expect(args.onchoose).toHaveBeenLastCalledWith('user')
      await userEvent.keyboard('{ArrowDown}')
      await expect(args.onchoose).toHaveBeenCalledTimes(5)
      await expect(spy).not.toHaveBeenCalled()
    } finally {
      window.removeEventListener('keydown', spy)
    }
  },
}

/** The sound categories, none chosen: the first row takes the tab stop. */
export const Sounds: Story = {
  args: { items: soundCategories, chosen: null, label: 'Sound categories', height: 252 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Piano 24' })).toHaveAttribute('tabindex', '0')
    await expect(canvasElement.querySelector('[aria-current]')).toBeNull()
  },
}

import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import LibraryStyles from './LibraryStyles.svelte'
import { loadNothing, loadQueued, loadStopped, popRows, styleFolders, styleRows, styleViews } from './LibraryStyles.fixtures'

/**
 * The Library's Styles page, the style browser: the zone header (view name, count, the view tabs,
 * the filter, Open file…), the style folders beside the style list in Track order, and a footer
 * with Preview on select, Cancel while a style is queued and the Load button for the cursor row.
 * The filter drives the list: ↑ ↓ PgUp PgDn Home End move the cursor, Enter loads, Shift+Enter
 * previews (or queues while running), Ctrl/⌘+D stars. Controlled: the app's model fills it.
 */
const meta = {
  title: 'Components/LibraryStyles',
  component: LibraryStyles,
  parameters: { layout: 'centered' },
  args: {
    viewName: 'Pop & Rock',
    count: '212',
    views: styleViews,
    view: null,
    folders: styleFolders,
    folder: 'Pop & Rock',
    rows: styleRows,
    cursor: '103',
    query: '',
    emptyText: '',
    autoPreview: true,
    running: true,
    note: '',
    queued: true,
    canCancel: false,
    load: loadQueued,
    canOpenFile: true,
    width: 1010,
    height: 560,
    tipAction: fn(),
    onview: fn(),
    onfolder: fn(),
    onquery: fn(),
    onselect: fn(),
    onload: fn(),
    onpreview: fn(),
    onstar: fn(),
    onautopreview: fn(),
    oncancel: fn(),
    onopenfile: fn(),
  },
  argTypes: {
    viewName: { control: 'text' },
    count: { control: 'text' },
    views: { control: 'object' },
    view: { control: 'select', options: [null, 'all', 'favourites', 'recents'] },
    folders: { control: 'object' },
    folder: { control: 'select', options: [null, ...styleFolders.map((f) => f.id)] },
    rows: { control: 'object' },
    cursor: { control: 'text' },
    query: { control: 'text' },
    emptyText: { control: 'text' },
    autoPreview: { control: 'boolean' },
    running: { control: 'boolean' },
    note: { control: 'text' },
    queued: { control: 'boolean' },
    canCancel: { control: 'boolean' },
    load: { control: 'object' },
    canOpenFile: { control: 'boolean' },
    width: { control: { type: 'number', min: 600, step: 10 } },
    height: { control: { type: 'number', min: 240, step: 10 } },
  },
} satisfies Meta<typeof LibraryStyles>

export default meta
type Story = StoryObj<typeof meta>

/**
 * As the board: Pop & Rock chosen, the band running, Coastal Highway queued for the next bar and
 * the cursor on it. The views, folders, filter keys, stars and Load call through.
 */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const heading = canvas.getByRole('heading', { level: 2 })
    await expect(heading).toHaveTextContent(/^Styles.*· Pop & Rock$/)
    await expect(heading.nextElementSibling).toHaveTextContent(/^212$/)

    // Views: none chosen while a folder is; a click chooses.
    const views = canvas.getByRole('tablist', { name: 'Views' })
    for (const tab of within(views).getAllByRole('tab')) await expect(tab).toHaveAttribute('aria-selected', 'false')
    await userEvent.click(canvas.getByRole('tab', { name: 'Favourites, 36 styles' }))
    await expect(args.onview).toHaveBeenLastCalledWith('favourites')

    // Folders.
    await expect(canvas.getByRole('button', { name: 'Pop & Rock 212' })).toHaveAttribute('aria-current', 'true')
    await userEvent.click(canvas.getByRole('button', { name: 'Ballad 98' }))
    await expect(args.onfolder).toHaveBeenLastCalledWith('Ballad')

    // The filter drives the list.
    const filter = canvas.getByRole('searchbox', { name: 'Filter styles' })
    await expect(filter).toHaveAttribute('data-tip', 'browser.filter')
    await userEvent.click(filter)
    await userEvent.keyboard('w')
    await expect(args.onquery).toHaveBeenLastCalledWith('w')
    await userEvent.keyboard('{ArrowDown}')
    await expect(args.onselect).toHaveBeenLastCalledWith('104')
    await userEvent.keyboard('{End}')
    await expect(args.onselect).toHaveBeenLastCalledWith('111')
    await userEvent.keyboard('{Enter}')
    await expect(args.onload).toHaveBeenLastCalledWith('103')
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')
    await expect(args.onpreview).toHaveBeenLastCalledWith('103')
    await userEvent.keyboard('{Control>}d{/Control}')
    await expect(args.onstar).toHaveBeenLastCalledWith('103', false)

    // A row click selects; a star stars.
    const listbox = canvas.getByRole('listbox', { name: 'Styles in Pop & Rock' })
    await userEvent.click(within(listbox).getByRole('option', { name: /^Garage Summer/ }))
    await expect(args.onselect).toHaveBeenLastCalledWith('107')
    await userEvent.click(canvas.getByRole('button', { name: /^Star Waltz Pop,/ }))
    await expect(args.onstar).toHaveBeenLastCalledWith('106', true)

    // Footer: Preview on select absent while running, Cancel absent (no command), Load waiting.
    const lamp = canvas.getByRole('button', { name: 'Preview on select' })
    await expect(lamp).toHaveAttribute('aria-disabled', 'true')
    await expect(canvas.getByRole('status')).toHaveTextContent('While stopped')
    await expect(canvas.getByRole('button', { name: 'Cancel the style queued for the next bar' })).toHaveAttribute('aria-disabled', 'true')
    const load = canvas.getByRole('button', { name: 'Coastal Highway loads at the next bar (queued)' })
    await expect(load).toHaveAttribute('data-face', 'waiting')
    await expect(load).toHaveAttribute('data-tip', 'browser.queue')
    await userEvent.click(load)
    await expect(args.onload).toHaveBeenLastCalledWith('103')

    // Open file… opens the system file picker (the app's part); the button only calls through.
    const open = canvas.getByRole('button', { name: /^Open a style file/ })
    await expect(open).toHaveAttribute('data-tip', 'library.open_file')
    await userEvent.click(open)
    await expect(args.onopenfile).toHaveBeenCalledOnce()
  },
}

/** The band stopped, Preview on select on, a preview playing, the cursor on Waltz Pop: Load loads at once. */
export const Stopped: Story = {
  args: {
    running: false,
    queued: false,
    cursor: '106',
    note: 'Previewing Waltz Pop · bar 2/4 · Am',
    load: loadStopped,
    rows: styleRows.map((row) => (row.id === '103' ? { ...row, badge: undefined } : row)),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('Previewing Waltz Pop · bar 2/4 · Am')
    await expect(canvas.queryByRole('button', { name: /^Cancel/ })).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Preview on select' }))
    await expect(args.onautopreview).toHaveBeenLastCalledWith(false)
    const load = canvas.getByRole('button', { name: 'Load Waltz Pop' })
    await expect(load).toHaveAttribute('data-tip', 'library.style_load')
    await userEvent.click(load)
    await expect(args.onload).toHaveBeenLastCalledWith('106')
  },
}

/** All styles filtered by "pop": the count reads "6 of 1,284", the order is kept. */
export const Filtered: Story = {
  args: { viewName: 'All styles', view: 'all', folder: null, count: '6 of 1,284', query: 'pop', rows: popRows, cursor: '102' },
}

/** A filter nothing matches: the empty text, and Load with nothing to load. */
export const NoMatch: Story = {
  args: {
    viewName: 'All styles',
    view: 'all',
    folder: null,
    count: '0 of 1,284',
    query: 'zydeco',
    rows: [],
    cursor: null,
    emptyText: 'No style matches “zydeco”',
    running: false,
    queued: false,
    load: loadNothing,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No style matches “zydeco”')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Load: nothing to load' })).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(canvas.getByRole('searchbox', { name: 'Filter styles' }))
    await userEvent.keyboard('{Enter}{ArrowDown}')
    await expect(args.onload).not.toHaveBeenCalled()
    await expect(args.onselect).not.toHaveBeenCalled()
  },
}

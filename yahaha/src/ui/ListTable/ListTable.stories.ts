import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import ListTable from './ListTable.svelte'
import { largeStyleRows, soundColumns, soundRows, styleColumns, styleRows } from './ListTable.fixtures'

/**
 * The one list of every Library page: a header of column labels over a virtualised listbox. The
 * selected row is a solid `--neutral` fill in `--on-ink`. One tab stop: ↑ ↓ PgUp PgDn Home End
 * call `onselect`, Enter and a double-click `onactivate`; a star button calls `onstar` and never
 * selects. The parent owns `selected`.
 */
const meta = {
  title: 'Components/ListTable',
  component: ListTable,
  parameters: { layout: 'centered' },
  args: {
    columns: styleColumns,
    rows: styleRows,
    selected: 's1',
    label: 'Styles',
    marks: true,
    stars: true,
    rowHeight: 28,
    emptyText: 'No styles match',
    rowTip: 'library.row',
    starTip: 'library.star',
    width: 860,
    height: 340,
    onselect: fn(),
    onactivate: fn(),
    onstar: fn(),
    tipAction: fn(),
  },
  argTypes: {
    columns: { control: 'object' },
    rows: { control: 'object' },
    selected: { control: 'text' },
    label: { control: 'text' },
    marks: { control: 'boolean' },
    stars: { control: 'boolean' },
    rowHeight: { control: { type: 'number', min: 20, step: 2 } },
    emptyText: { control: 'text' },
    rowTip: { control: 'text' },
    starTip: { control: 'text' },
    width: { control: { type: 'number', min: 200, step: 10 } },
    height: { control: { type: 'number', min: 60, step: 10 } },
  },
} satisfies Meta<typeof ListTable>

export default meta
type Story = StoryObj<typeof meta>

/** The option for row `id` (the options' accessible names are long, so find it by position). */
function option(canvasElement: HTMLElement, posinset: number): HTMLElement {
  const found = canvasElement.querySelector<HTMLElement>(`[role="option"][aria-posinset="${posinset}"]`)
  if (!found) throw new Error(`no option at ${posinset}`)
  return found
}

/**
 * Styles: the playing one (●) selected, Coastal Highway queued for the next bar (▶), one
 * unreadable in `--absent` with ⚠. A click selects; a star stars without selecting.
 */
export const Styles: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const listbox = canvas.getByRole('listbox', { name: 'Styles' })
    await expect(listbox).toHaveAttribute('tabindex', '0')
    const first = option(canvasElement, 1)
    await expect(first).toHaveAttribute('aria-selected', 'true')
    await expect(listbox).toHaveAttribute('aria-activedescendant', first.id)
    await expect(first).toHaveAttribute('aria-setsize', String(styleRows.length))
    await expect(first).toHaveAttribute('data-tip', 'library.row')
    await expect(first).toHaveAccessibleName('1, Sunday Drive Pop, Pop & Rock, 112, 4/4, SundayDrivePop.sty')
    await expect(args.tipAction).toHaveBeenCalledWith(first, 'library.row')
    await expect(option(canvasElement, 2)).toHaveAttribute('aria-selected', 'false')
    await expect(option(canvasElement, 2)).toHaveTextContent('next bar')
    await expect(option(canvasElement, 7)).toHaveAccessibleName('Broken Compass Groove, unreadable')

    const star = canvas.getByRole('button', { name: /^Star 2, Coastal Highway/ })
    await expect(star).toHaveAttribute('aria-pressed', 'false')
    await expect(star).toHaveAttribute('tabindex', '-1')
    await expect(star).toHaveAttribute('data-tip', 'library.star')
    await expect(canvas.getByRole('button', { name: /^Unstar 1, Sunday Drive Pop/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(star)
    await expect(args.onstar).toHaveBeenCalledWith('s2', true)
    await expect(args.onselect).not.toHaveBeenCalled()

    await userEvent.click(option(canvasElement, 3))
    await expect(args.onselect).toHaveBeenLastCalledWith('s3')
    await userEvent.dblClick(option(canvasElement, 4))
    await expect(args.onactivate).toHaveBeenLastCalledWith('s4')
  },
}

/** The keys select from `selected`, clamped; Enter activates it; none reach the page. */
export const Keys: Story = {
  args: { selected: 's3' },
  play: async ({ canvasElement, args }) => {
    const spy = fn()
    window.addEventListener('keydown', spy)
    try {
      const canvas = within(canvasElement)
      canvas.getByRole('listbox', { name: 'Styles' }).focus()
      await userEvent.keyboard('{ArrowDown}')
      await expect(args.onselect).toHaveBeenLastCalledWith('s4')
      await userEvent.keyboard('{ArrowUp}')
      await expect(args.onselect).toHaveBeenLastCalledWith('s2')
      await userEvent.keyboard('{Home}')
      await expect(args.onselect).toHaveBeenLastCalledWith('s1')
      await userEvent.keyboard('{End}')
      await expect(args.onselect).toHaveBeenLastCalledWith('s10')
      await userEvent.keyboard('{PageDown}')
      await expect(args.onselect).toHaveBeenLastCalledWith('s10')
      await userEvent.keyboard('{PageUp}')
      await expect(args.onselect).toHaveBeenLastCalledWith('s1')
      await userEvent.keyboard('{Enter}')
      await expect(args.onactivate).toHaveBeenCalledTimes(1)
      await expect(args.onactivate).toHaveBeenCalledWith('s3')
      await expect(spy).not.toHaveBeenCalled()
    } finally {
      window.removeEventListener('keydown', spy)
    }
  },
}

/** Sounds: no marks or stars; the selected one is a missing plugin's, still selectable. */
export const Sounds: Story = {
  args: {
    columns: soundColumns,
    rows: soundRows,
    selected: 'sd-2',
    label: 'Sounds',
    marks: false,
    stars: false,
    emptyText: 'No sounds match',
    width: 640,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryAllByRole('button')).toHaveLength(0)
    const selected = canvas.getByRole('option', { name: 'Glass Choir Pad, plugin missing' })
    await expect(selected).toHaveAttribute('aria-selected', 'true')
  },
}

/** 5,000 styles, the 4,001st selected: only the rows around it are in the DOM. */
export const Virtualised: Story = {
  args: { rows: largeStyleRows, selected: 'g4000', label: 'All styles' },
  play: async ({ canvasElement, args }) => {
    const options = canvasElement.querySelectorAll('[role="option"]')
    await expect(options.length).toBeGreaterThan(0)
    await expect(options.length).toBeLessThan(80)
    const chosen = option(canvasElement, 4001)
    await expect(chosen).toHaveAttribute('aria-selected', 'true')
    await expect(chosen).toHaveAttribute('aria-setsize', '5000')
    await expect(canvasElement.querySelector('[aria-posinset="1"]')).toBeNull()
    within(canvasElement).getByRole('listbox', { name: 'All styles' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(args.onselect).toHaveBeenLastCalledWith('g4001')
  },
}

/** No rows: the empty text, centred in `--m`. */
export const Empty: Story = {
  args: { rows: [], selected: null },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No styles match')).toBeInTheDocument()
    await expect(canvas.queryAllByRole('option')).toHaveLength(0)
    canvas.getByRole('listbox', { name: 'Styles' }).focus()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(args.onselect).not.toHaveBeenCalled()
    await expect(args.onactivate).not.toHaveBeenCalled()
  },
}

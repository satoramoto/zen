import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { createRawSnippet, mount, unmount, type ComponentProps } from 'svelte'
import { expect, fn, within } from 'storybook/test'
import GoldenGrid from '../Golden/GoldenGrid.svelte'
import OneTouchPicker from './OneTouchPicker.svelte'

/**
 * A GoldenGrid's cells holding a `cells` OneTouchPicker: the group (the role the parent supplies)
 * is a `display: contents` element, so the label and each number are grid items, one a cell.
 */
function inGrid(args: ComponentProps<typeof OneTouchPicker>) {
  return createRawSnippet(() => ({
    render: () => '<div role="group" aria-label="One Touch Setting (OTS)" style="display: contents"></div>',
    setup: (root: Element) => {
      const picker = mount(OneTouchPicker, { target: root, props: args })
      return () => {
        void unmount(picker)
      }
    },
  }))
}

/**
 * One Touch on the display: "One Touch" in `--caption-ink`, then 1-4 as plain text (no boxes) in
 * `--tab-rest`, brightening on hover; the applied one in `--t`, underlined. Numbers past the
 * style's count are disabled.
 */
const meta = {
  title: 'Primitives/OneTouchPicker',
  component: OneTouchPicker,
  parameters: { layout: 'centered' },
  args: { tipAction: fn(), onapply: fn() },
  argTypes: {
    applied: { control: { type: 'inline-radio' }, options: [0, 1, 2, 3, 4] },
    count: { control: { type: 'number', min: 0, max: 4, step: 1 } },
    numbers: { control: { type: 'number', min: 1, max: 4, step: 1 } },
    label: { control: 'text' },
    orientation: { control: { type: 'inline-radio' }, options: ['horizontal', 'vertical'] },
    cells: { control: 'boolean' },
    hue: { control: { type: 'inline-radio' }, options: ['neutral', 'a'] },
    name: { control: 'text' },
  },
} satisfies Meta<typeof OneTouchPicker>

export default meta
type Story = StoryObj<typeof meta>

/** The board: One Touch 2 applied, underlined. */
export const Board: Story = {
  args: { applied: 2 },
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button')
    await expect(buttons.map((b) => b.getAttribute('data-face'))).toEqual(['off', 'chosen', 'off', 'off'])
    await expect(buttons[1]).toHaveAttribute('aria-pressed', 'true')
  },
}

/** None applied: every number plain. */
export const NoneApplied: Story = { args: { applied: 0 } }

/** Vertical, as in the golden Stage's One Touch block: the words on top, 1-4 stacked under them. */
export const Vertical: Story = {
  args: { applied: 2, orientation: 'vertical' },
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button')
    await expect(buttons[1]).toHaveAttribute('aria-pressed', 'true')
    await expect(canvasElement.querySelector('.ots')).toHaveClass('vertical')
  },
}

/**
 * Cells (`cells`) in a 5-cell GoldenGrid, its cuts drawn: no wrapper, the label a plain caption
 * flush left and 1-4 each an outlined face filling its cell, the applied one (2) solid with dark
 * ink, 4 past the style's three settings disabled. The grid's group element supplies the role.
 */
export const Cells: Story = {
  args: { applied: 2, count: 3, cells: true },
  parameters: { sample: { width: 610, height: 55 } },
  render: (args) => ({
    Component: GoldenGrid,
    // GoldenGrid hosts the story; Storybook types `props` as OneTouchPicker's.
    props: { columns: 5, overlay: true, name: 'One Touch', children: inGrid(args) } as unknown as typeof args,
  }),
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole('group', { name: 'One Touch Setting (OTS)' })
    const items = [...group.children]
    await expect(items).toHaveLength(5)
    await expect(items[0]).toHaveTextContent('One Touch')
    await expect(items[0]).not.toHaveAttribute('aria-hidden')
    await expect(group.parentElement).toHaveAttribute('data-golden-slots', 'grid')
    await expect(items[0].tagName).toBe('SPAN')
    const numbers = within(group).getAllByRole('button')
    await expect(numbers.map((b) => b.getAttribute('data-face'))).toEqual(['off', 'on', 'off', 'disabled'])
    await expect(numbers[1]).toHaveAttribute('aria-pressed', 'true')
    await expect(numbers[3]).toBeDisabled()
    await expect(canvasElement.querySelector('.ots')).toBeNull()
  },
}

/**
 * Cells in the style's violet (`hue` a), as on the golden Stage: a One Touch is a setting of the
 * style, so its numbers take the style's hue, outlined, the applied one solid.
 */
export const CellsViolet: Story = {
  args: { applied: 2, count: 4, cells: true, hue: 'a' },
  parameters: { sample: { width: 610, height: 55 } },
  render: (args) => ({
    Component: GoldenGrid,
    // GoldenGrid hosts the story; Storybook types `props` as OneTouchPicker's.
    props: { columns: 5, name: 'One Touch', children: inGrid(args) } as unknown as typeof args,
  }),
  play: async ({ canvasElement }) => {
    const numbers = within(canvasElement).getAllByRole('button')
    for (const n of numbers) await expect(n.style.getPropertyValue('--hue')).toBe('var(--a)')
    await expect(numbers[1]).toHaveAttribute('data-face', 'on')
  },
}

/** A style with two One Touch settings: 3 and 4 disabled. */
export const TwoSettings: Story = {
  args: { applied: 1, count: 2 },
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button')
    await expect(buttons.map((b) => (b as HTMLButtonElement).disabled)).toEqual([false, false, true, true])
  },
}

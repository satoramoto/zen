import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import ChannelParts from './ChannelParts.svelte'
import { partsBoard, partsLongName } from './ChannelParts.fixtures'

/**
 * The Channel page's parts list: a "Parts" header with the open part's counter, then the twelve
 * parts in two columns, row-major. Each entry is a plain row on a hairline: the tag in the part's
 * hue (a Style part: `--value-ink`) and a keyboard part's sound name. A part that doesn't sound
 * keeps its hue at absent strength (`--absent-<hue>`), its name in `--caption-ink`. The open part
 * is the chosen block: a solid fill in its hue (a Style part: `--neutral`), its text in `--on-ink`,
 * `aria-current="true"`. ← → ↑ ↓ Home End move focus and call `onopen`; controlled: the parent
 * moves `open`. 264px wide, as in the page.
 */
const meta = {
  title: 'Components/ChannelParts',
  component: ChannelParts,
  parameters: { layout: 'centered' },
  args: { parts: partsBoard, open: 0, width: 264, tipAction: fn(), onopen: fn() },
  argTypes: {
    parts: { control: 'object' },
    open: { control: { type: 'number', min: 0, max: 11, step: 1 } },
    width: { control: { type: 'number', min: 160, step: 1 } },
  },
} satisfies Meta<typeof ChannelParts>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The board: R1 Stage Grand open, R3 off (its tag at absent strength, its name in the caption
 * ink), the Style parts by tag alone. A click calls `onopen` with the part's index; → from R1 moves
 * to R2.
 */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: 'Parts' })
    await expect(within(nav).getByRole('heading', { level: 3, name: 'Parts' })).toBeInTheDocument()
    await expect(nav).toHaveTextContent('Part 1 of 12')
    const entries = canvas.getAllByRole('button')
    await expect(entries).toHaveLength(12)
    const tags = ['R1', 'R2', 'R3', 'L', 'Rhythm 1', 'Rhythm 2', 'Bass', 'Chord 1', 'Chord 2', 'Pad', 'Phrase 1', 'Phrase 2']
    for (const [i, entry] of entries.entries()) {
      await expect(entry.getAttribute('aria-label')).toMatch(new RegExp(`^Part ${i + 1} of 12: ${tags[i]}\\b`))
      await expect(entry).toHaveAttribute('data-tip', 'mixer.channel.part')
      await expect(args.tipAction).toHaveBeenCalledWith(entry, 'mixer.channel.part')
    }
    const [r1, r2, r3] = entries
    await expect(r1).toHaveAccessibleName('Part 1 of 12: R1 Stage Grand, open')
    await expect(r1).toHaveAttribute('aria-current', 'true')
    await expect(r1).toHaveAttribute('data-face', 'chosen')
    await expect(r1.querySelector('[data-hue]')).toHaveAttribute('data-hue', 'r1')
    for (const entry of entries.slice(1)) {
      await expect(entry).not.toHaveAttribute('aria-current')
      await expect(entry).toHaveAttribute('data-face', 'off')
    }
    await expect(r3).toHaveAccessibleName('Part 3 of 12: R3 Brass Section, off')
    await expect(r3.querySelector('[data-hue]')).toHaveAttribute('data-hue', 'd')
    await expect(entries[4]).toHaveAccessibleName('Part 5 of 12: Rhythm 1')
    await expect(entries[4]).toHaveTextContent(/^Rhythm 1$/)
    await expect(entries[4].querySelector('[data-hue]')).toHaveAttribute('data-hue', 't')

    await userEvent.click(r2)
    await expect(args.onopen).toHaveBeenLastCalledWith(1)
    await expect(r1).toHaveAttribute('aria-current', 'true')

    r1.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onopen).toHaveBeenLastCalledWith(1)
    await expect(r2).toHaveFocus()
  },
}

/** Keys: ↓ moves one row (two parts), ← one part, End to Phrase 2, Home to R1; no wrap at the ends. */
export const Keys: Story = {
  play: async ({ canvasElement, args }) => {
    const entries = within(canvasElement).getAllByRole('button')
    entries[0].focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(args.onopen).toHaveBeenLastCalledWith(2)
    await expect(entries[2]).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    await expect(args.onopen).toHaveBeenLastCalledWith(1)
    await userEvent.keyboard('{End}')
    await expect(args.onopen).toHaveBeenLastCalledWith(11)
    await expect(entries[11]).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(entries[11]).toHaveFocus()
    await userEvent.keyboard('{Home}')
    await expect(args.onopen).toHaveBeenLastCalledWith(0)
    await expect(entries[0]).toHaveFocus()
    await expect(args.onopen).toHaveBeenCalledTimes(4)
  },
}

/** Rhythm 1 open: a Style part's chosen block is the neutral fill; the counter reads 5 of 12. */
export const StylePartOpen: Story = {
  args: { open: 4 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rhythm = canvas.getByRole('button', { name: 'Part 5 of 12: Rhythm 1, open' })
    await expect(rhythm).toHaveAttribute('aria-current', 'true')
    await expect(rhythm.querySelector('[data-hue]')).toHaveAttribute('data-hue', 't')
    await expect(canvas.getByRole('navigation', { name: 'Parts' })).toHaveTextContent('Part 5 of 12')
  },
}

/** R2's sound name is longer than its cell: it ends in an ellipsis and the row keeps its height. */
export const LongName: Story = {
  args: { parts: partsLongName },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('button', { name: 'Part 2 of 12: R2 A Very Long Sound Name For Testing' }),
    ).toBeInTheDocument()
  },
}

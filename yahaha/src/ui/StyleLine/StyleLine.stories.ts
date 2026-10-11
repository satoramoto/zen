import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { createRawSnippet, mount, unmount, type ComponentProps } from 'svelte'
import { expect, fireEvent, fn, within } from 'storybook/test'
import GoldenGrid from '../Golden/GoldenGrid.svelte'
import StyleLine from './StyleLine.svelte'
import { styleLineBoard, styleLineLong, styleLineQueued } from './StyleLine.fixtures'

/**
 * The small line at the top of the display's left third: ‹ the style's name in the accent ›, then
 * its category and time signature (or a queued style after "→"). Plain text controls, no boxes.
 * A third of the display wide.
 */
const meta = {
  title: 'Components/StyleLine',
  component: StyleLine,
  parameters: { layout: 'centered' },
  args: {
    ...styleLineBoard,
    tipAction: fn(),
    onprev: fn(),
    onnext: fn(),
    onbrowse: fn(),
  },
  argTypes: {
    styleName: { control: 'text' },
    category: { control: 'text' },
    timeSignature: { control: 'text' },
    queued: { control: 'text' },
    cells: { control: 'boolean' },
  },
} satisfies Meta<typeof StyleLine>

export default meta
type Story = StoryObj<typeof meta>

/** A one-cell GoldenGrid whose leaf is a size container holding the line, as the grid Stage gives it. */
function inCell(args: ComponentProps<typeof StyleLine>) {
  return createRawSnippet(() => ({
    render: () => '<div style="container-type: size; width: 100%; height: 100%"></div>',
    setup: (root: Element) => {
      const line = mount(StyleLine, { target: root, props: args })
      return () => {
        void unmount(line)
      }
    },
  }))
}

/** The board: ‹ Sunday Drive Pop ›  Pop & Rock · 4/4. */
export const Board: Story = {}

/** Coastal Highway waits for the bar line: "→ Coastal Highway" in place of the category. */
export const Queued: Story = { args: { ...styleLineQueued } }

/** A name longer than the third: it ends in an ellipsis, the full name in its title. */
export const LongName: Story = { args: { ...styleLineLong } }

/**
 * In cells (`cells`): the line fills a 420 × 32 band of the golden Stage; ‹ and › are squares as
 * tall as the line, the glyph alone in the style's hue, outlined only on hover and keyboard focus;
 * the name and the metre between them as before.
 */
export const Cells: Story = {
  args: { ...styleLineBoard, cells: true },
  parameters: { sample: { width: 420, height: 32 } },
  render: (args) => ({
    // GoldenGrid hosts the story; Storybook types `Component` and `props` as StyleLine's.
    Component: GoldenGrid as unknown as typeof StyleLine,
    props: { columns: 1, overlay: true, name: 'Style line', children: inCell(args) } as unknown as typeof args,
  }),
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    const line = canvasElement.querySelector('[data-cells]') as HTMLElement
    await expect(line).toHaveClass('cells')
    const prev = c.getByRole('button', { name: 'Previous style (Track left)' })
    const next = c.getByRole('button', { name: 'Next style (Track right)' })
    for (const glyph of [prev, next]) {
      const box = glyph.getBoundingClientRect()
      // Real layout only (jsdom has none): each a square as tall as the line.
      if (box.height > 0) {
        await expect(Math.abs(box.width - box.height)).toBeLessThan(1)
        await expect(Math.abs(box.height - line.getBoundingClientRect().height)).toBeLessThan(1)
        // The glyph alone: no box until hover or keyboard focus (the owner's exception).
        await expect(getComputedStyle(glyph).boxShadow).toBe('none')
      }
    }
    await fireEvent.click(next)
    await expect(args.onnext).toHaveBeenCalledTimes(1)
  },
}

import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { createRawSnippet, mount, unmount, type ComponentProps } from 'svelte'
import { expect, fireEvent, fn, within } from 'storybook/test'
import GoldenGrid from '../Golden/GoldenGrid.svelte'
import TempoReadout from './TempoReadout.svelte'

/** A one-cell GoldenGrid whose leaf is a size container holding the readout, as the grid Stage gives it. */
function inCell(args: ComponentProps<typeof TempoReadout>) {
  return createRawSnippet(() => ({
    render: () => '<div style="container-type: size; width: 100%; height: 100%"></div>',
    setup: (root: Element) => {
      const tempo = mount(TempoReadout, { target: root, props: args })
      return () => {
        void unmount(tempo)
      }
    },
  }))
}

/**
 * The display's tempo block: the number at the section's size (drag it, scroll on it, or use the
 * arrow keys; double-click for the style's tempo), "BPM" small on its baseline, and + over − at its
 * right, as tall as the number.
 */
const meta = {
  title: 'Primitives/TempoReadout',
  component: TempoReadout,
  parameters: { layout: 'centered' },
  args: { tipAction: fn(), ontempo: fn(), onplus: fn(), onminus: fn(), onreset: fn() },
  argTypes: {
    bpm: { control: { type: 'number', min: 5, max: 500, step: 1 } },
    unit: { control: 'text' },
    min: { control: { type: 'number', min: 5, max: 500, step: 1 } },
    max: { control: { type: 'number', min: 5, max: 500, step: 1 } },
    cells: { control: 'boolean' },
  },
} satisfies Meta<typeof TempoReadout>

export default meta
type Story = StoryObj<typeof meta>

/** The board: 104 BPM. Dragging up 8px asks for 106; − held calls with `true`, released with `false`. */
export const Board: Story = {
  args: { bpm: 104, unit: 'BPM', min: 5, max: 500 },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    const number = c.getByRole('spinbutton')
    await fireEvent.pointerDown(number, { pointerId: 1, button: 0, clientY: 300 })
    await fireEvent.pointerMove(number, { pointerId: 1, clientY: 292 })
    await fireEvent.pointerUp(number, { pointerId: 1 })
    await expect(args.ontempo).toHaveBeenLastCalledWith(106)
    const minus = c.getByRole('button', { name: 'Tempo down (Function)' })
    await fireEvent.pointerDown(minus, { button: 0 })
    await fireEvent.pointerUp(minus)
    await expect(args.onminus).toHaveBeenNthCalledWith(1, true)
    await expect(args.onminus).toHaveBeenNthCalledWith(2, false)
  },
}

/** At the top of its range: ↑ asks for nothing more. */
export const AtMax: Story = {
  args: { bpm: 500, unit: 'BPM', min: 5, max: 500 },
  play: async ({ canvasElement, args }) => {
    await fireEvent.keyDown(within(canvasElement).getByRole('spinbutton'), { key: 'ArrowUp' })
    await expect(args.ontempo).not.toHaveBeenCalled()
  },
}

/**
 * In cells (`cells`): it fills a 360 × 80 size container of the grid Stage; "104 BPM" flush left
 * on its foot, + over − as one column right beside it, on its baseline, exactly the number's cap
 * height: two outlined squares with a hard fib-8 gap between them, + and − at the numeral's weight.
 */
export const Cells: Story = {
  args: { bpm: 104, unit: 'BPM', min: 5, max: 500, cells: true },
  parameters: { sample: { width: 360, height: 80 } },
  render: (args) => ({
    // GoldenGrid hosts the story; Storybook types `Component` and `props` as TempoReadout's.
    Component: GoldenGrid as unknown as typeof TempoReadout,
    props: { columns: 1, overlay: true, name: 'Tempo', children: inCell(args) } as unknown as typeof args,
  }),
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    const tempo = canvasElement.querySelector('[data-cells]') as HTMLElement
    await expect(tempo).toHaveClass('cells')
    const plus = c.getByRole('button', { name: 'Tempo up (Scene Launch)' })
    const minus = c.getByRole('button', { name: 'Tempo down (Function)' })
    const whole = tempo.getBoundingClientRect()
    // Real layout only (jsdom has none): one column right beside the reading, standing on the
    // container's foot (the number's baseline): + over −, each a square, a hard fib-8 gap between.
    if (whole.height > 0) {
      const reading = (tempo.querySelector('.reading') as HTMLElement).getBoundingClientRect()
      for (const step of [plus, minus]) {
        const box = step.getBoundingClientRect()
        await expect(Math.abs(box.width - box.height)).toBeLessThan(1.5)
        await expect(box.left - reading.right).toBeLessThan(14)
        await expect(box.height).toBeLessThan(whole.height / 2)
      }
      await expect(Math.abs(minus.getBoundingClientRect().bottom - whole.bottom)).toBeLessThan(1)
      const gap = minus.getBoundingClientRect().top - plus.getBoundingClientRect().bottom
      await expect(Math.round(gap)).toBe(8)
    }
    await fireEvent.pointerDown(plus, { button: 0 })
    await fireEvent.pointerUp(plus)
    await expect(args.onplus).toHaveBeenNthCalledWith(1, true)
    await expect(args.onplus).toHaveBeenNthCalledWith(2, false)
  },
}

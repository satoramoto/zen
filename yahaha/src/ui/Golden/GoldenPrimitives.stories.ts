import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, waitFor } from 'storybook/test'
import GoldenSample from './GoldenSample.svelte'

const INTERVALS = [
  'unison',
  'minor-third',
  'major-third',
  'fourth',
  'root2',
  'fifth',
  'phi',
  'major-sixth',
  'octave',
  'phi2',
  'double-octave',
  'phi3',
]
const RATIOS = [...INTERVALS, 'knob', 'fader', 'pad', 'button', 'steps']
const SIDES = ['top', 'right', 'bottom', 'left']
const FIBS = ['fib-2', 'fib-3', 'fib-5', 'fib-8', 'fib-13', 'fib-21', 'fib-34', 'fib-55', 'fib-89', 'fib-144']

/**
 * Each Golden primitive on its own, its slots filled with numbered leaves, in a 610 × 377 box (a
 * phi rectangle in fib steps), with GoldenOverlay drawing the cuts and the report under it. Switch
 * the Tuning toolbar (Phi, Just, Root-two) to see the shapes and the steps change.
 */
const meta = {
  title: 'Golden/Primitives',
  component: GoldenSample,
  parameters: { layout: 'centered', sample: { width: 610, height: 377 } },
  args: { primitive: 'box', onreport: fn() },
  argTypes: {
    primitive: { control: 'select', options: ['box', 'split', 'steps', 'spiral', 'row', 'column', 'grid', 'band'] },
    count: { control: { type: 'range', min: 1, max: 8, step: 1 } },
    shape: { control: 'select', options: RATIOS },
    orient: { control: 'inline-radio', options: ['wide', 'tall'] },
    take: { control: 'select', options: ['square', 'major', 'minor', ...RATIOS] },
    from: { control: 'inline-radio', options: SIDES },
    step: { control: 'select', options: RATIOS },
    cells: { control: 'object' },
    columns: { control: { type: 'range', min: 1, max: 12, step: 1 } },
    rows: { control: { type: 'range', min: 1, max: 6, step: 1 } },
    cell: { control: 'select', options: RATIOS },
    size: {
      control: 'select',
      options: ['bar-height', 'group-header-height', 'control-height', 'control-height-compact', 'tab-block', 'keys-height', 'chip-height-display'],
    },
    times: { control: 'select', options: INTERVALS },
    boxes: { control: { type: 'range', min: 1, max: 6, step: 1 } },
    gap: { control: 'select', options: FIBS },
    inset: { control: 'select', options: FIBS },
    weights: { control: 'object' },
    spiralFrom: { control: 'inline-radio', options: SIDES },
    spiralTurn: { control: 'inline-radio', options: ['ccw', 'cw'] },
  },
} satisfies Meta<typeof GoldenSample>

export default meta
type Story = StoryObj<typeof meta>

/** The slots element of the primitive shown. */
const slotsOf = (canvas: HTMLElement) => canvas.querySelector<HTMLElement>('[data-golden-slots]')

/** GoldenBox: a knob's shape (tall, the tuning's interval) fitted into the box; the room left over is spare. */
export const Box: Story = {
  args: { primitive: 'box', shape: 'knob', inset: 'fib-8' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-golden-fit][data-shape="knob"]')?.getAttribute('data-orient')).toBe('tall')
  },
}

/** GoldenSplit: a square taken off the left; the rest is a phi box again. */
export const Split: Story = {
  args: { primitive: 'split', take: 'square', from: 'left', inset: 'fib-8' },
  play: async ({ canvasElement }) => {
    const slots = slotsOf(canvasElement)
    await expect(slots?.dataset.take).toBe('square')
    await expect(slots?.children.length).toBe(2)
  },
}

/** GoldenSteps: three steps from the top, each the step's major part of what is left (phi: 61.8, 23.6, 14.6 %). */
export const Steps: Story = {
  args: { primitive: 'steps', count: 3, from: 'top', inset: 'fib-5' },
  play: async ({ canvasElement }) => {
    await expect(slotsOf(canvasElement)?.children.length).toBe(3)
  },
}

/** GoldenSpiral: five square cuts turning round the box, the sixth leaf in the remainder. The overlay draws the spiral. */
export const Spiral: Story = {
  args: { primitive: 'spiral', count: 6, inset: 'fib-3' },
  play: async ({ canvasElement }) => {
    await expect(slotsOf(canvasElement)?.children.length).toBe(6)
  },
}

/** GoldenRow: the Stage's display row, square, square, 1:phi, 1:phi, square, in a phi³ box: it adds up. */
export const Row: Story = {
  args: { primitive: 'row', cells: ['unison', 'unison', '1:phi', '1:phi', 'unison'], shape: 'phi3', inset: 'fib-8' },
  play: async ({ canvasElement, args }) => {
    await expect(slotsOf(canvasElement)?.dataset.goldenAdds).toBe('yes')
    await waitFor(() => expect(args.onreport).toHaveBeenCalled())
    await expect(canvasElement.querySelector('[data-golden="overlay"]')?.getAttribute('data-rows-off')).toBe('0')
  },
}

/** A row that doesn't add up: three squares in a phi³ box. The cells keep their true size, and the overlay draws the row red and reports it. */
export const RowOff: Story = {
  name: 'Row that does not add up',
  args: { primitive: 'row', cells: ['unison', 'unison', 'unison'], shape: 'phi3', inset: 'fib-8' },
  play: async ({ canvasElement, args }) => {
    await expect(slotsOf(canvasElement)?.dataset.goldenAdds).toBe('no')
    await waitFor(() => expect(canvasElement.querySelector('[data-golden="overlay"]')?.getAttribute('data-rows-off')).toBe('1'))
    const reports = (args.onreport as ReturnType<typeof fn>).mock.calls
    await expect(reports.at(-1)?.[0].rowsOff).toEqual(['row'])
  },
}

/** GoldenColumn: a square over a phi strip (1:phi) in a tall phi² box. */
export const Column: Story = {
  args: { primitive: 'column', cells: ['unison', '1:phi'], shape: 'phi', orient: 'tall', inset: 'fib-8' },
  play: async ({ canvasElement }) => {
    await expect(slotsOf(canvasElement)?.dataset.goldenAdds).toBe('yes')
  },
}

/** GoldenGrid: eight cells across one row, each leaf fitted to the knob's shape. */
export const Grid: Story = {
  args: { primitive: 'grid', columns: 8, rows: 1, cell: 'knob', inset: 'fib-2' },
  play: async ({ canvasElement }) => {
    const slots = slotsOf(canvasElement)
    await expect(slots?.children.length).toBe(8)
    await expect(slots?.dataset.orient).toBe('tall')
  },
}

/**
 * GoldenGrid with `weights`: each column's share an interval, here a phi² column, three phi
 * columns and two unison ones (a live fader strip next to parked ones would be `octave` next to
 * `unison`). The rows stay equal.
 */
export const WeightedGrid: Story = {
  name: 'Grid with weighted columns',
  args: { primitive: 'grid', weights: ['phi2', 'phi', 'phi', 'phi', 'unison', 'unison'], rows: 1, inset: 'fib-5' },
  play: async ({ canvasElement }) => {
    const slots = slotsOf(canvasElement)
    await expect(slots?.dataset.weights).toBe('phi2 phi phi phi unison unison')
    await expect(slots?.dataset.cell).toBeUndefined()
    await expect(slots?.getAttribute('style')).toContain('--golden-tracks: minmax(0, 2.618034fr)')
    await expect(slots?.children.length).toBe(6)
  },
}

/**
 * A phi box whose spiral is turned: cut from the right, clockwise (right, bottom, left, top), so its
 * pole sits left of centre, high up. The overlay rings the pole where the eye lands.
 */
export const SpiralTurned: Story = {
  name: 'Spiral turned cw from the right',
  args: { primitive: 'box', shape: 'phi', spiralFrom: 'right', spiralTurn: 'cw', inset: 'fib-8' },
  play: async ({ canvasElement }) => {
    const slots = slotsOf(canvasElement)
    await expect(slots?.dataset.spiralFrom).toBe('right')
    await expect(slots?.dataset.spiralTurn).toBe('cw')
    await waitFor(() => expect(canvasElement.querySelector('[data-golden="overlay"] [data-golden-pole]')).not.toBeNull())
  },
}

/** GoldenBand: the way out of the ratios, a header row as deep as --group-header-height; the rest keeps its proportions. */
export const Band: Story = {
  args: { primitive: 'band', size: 'group-header-height', from: 'top', gap: 'fib-8' },
  play: async ({ canvasElement }) => {
    await expect(slotsOf(canvasElement)?.dataset.band).toBe('group-header-height')
  },
}

/** GoldenBand with `times`: a control-height band one golden step deeper (32 × phi = 52), the golden Stage's controls row. */
export const BandTimes: Story = {
  name: 'Band a golden step deeper',
  args: { primitive: 'band', size: 'control-height', times: 'phi', from: 'top' },
  play: async ({ canvasElement }) => {
    const slots = slotsOf(canvasElement)
    await expect(slots?.dataset.times).toBe('phi')
    const band = slots?.firstElementChild?.getBoundingClientRect()
    if (band && band.height > 0) await expect(band.height).toBeCloseTo(32 * 1.618034, 0)
  },
}

/** GoldenSplit with `boxes`: a strip as deep as three phi boxes side by side across it (the golden Stage's display), a fib-21 before the rest. */
export const SplitBoxes: Story = {
  name: 'Split of three phi boxes',
  args: { primitive: 'split', take: 'phi', boxes: 3, from: 'top', gap: 'fib-21' },
  play: async ({ canvasElement }) => {
    const slots = slotsOf(canvasElement)
    await expect(slots?.dataset.boxes).toBe('3')
    const [part, rest] = [...(slots?.children ?? [])].map((c) => c.getBoundingClientRect())
    if (part && part.height > 0) {
      await expect(part.width / part.height).toBeCloseTo(3 * 1.618034, 1)
      await expect(Math.round(rest.top - part.bottom)).toBe(21)
    }
  },
}

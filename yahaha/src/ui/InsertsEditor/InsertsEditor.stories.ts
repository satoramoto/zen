import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { effectsInserts } from '../Effects/Effects.fixtures'
import InsertsEditor from './InsertsEditor.svelte'

/**
 * The Effects page's editor for the style's insertion effects (~944 × 288): the "Style inserts"
 * header with On / Off from the mix switch, then a two-column grid of hairline rows, the left column
 * first: each Style part's On lamp, its XG type and what plays it, and its amount when something
 * does. A row whose insert doesn't play, or every row while the inserts are off, is faded and still
 * settable. Each change goes out through `onchange`.
 */
const meta = {
  title: 'Components/InsertsEditor',
  component: InsertsEditor,
  parameters: { layout: 'padded' },
  args: { inserts: effectsInserts, tipAction: fn(), onchange: fn() },
  argTypes: { inserts: { control: 'object' } },
} satisfies Meta<typeof InsertsEditor>

export default meta
type Story = StoryObj<typeof meta>

/** The board's style: Chord 1 and Chord 2 play their inserts, Phrase 1's Ring Modulator plays dry. */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: /^Style inserts\s*· On$/ })).toBeInTheDocument()
    const lamp = canvas.getByRole('button', { name: 'Chord 1 insert' })
    await expect(lamp).toHaveAttribute('data-tip', 'fx.insert_part')
    await userEvent.click(lamp)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'on', part: 3, on: false })
    const amount = canvas.getByRole('slider', { name: 'Chord 1 insert amount' })
    amount.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'amount', part: 3, amount: 65 })
    await expect(canvas.queryByRole('slider', { name: 'Phrase 1 insert amount' })).toBeNull()
  },
}

/** The mix switch off: every row faded, still settable. */
export const AllOff: Story = {
  args: { inserts: { ...effectsInserts, on: false } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: /^Style inserts\s*· Off$/ })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Chord 2 insert' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'on', part: 4, on: false })
  },
}

/** A style with no insertion effects: one caption line. */
export const None: Story = {
  args: { inserts: { on: true, rows: [] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('This style has no insertion effects.')).toBeInTheDocument()
    await expect(canvas.queryAllByRole('button')).toHaveLength(0)
  },
}

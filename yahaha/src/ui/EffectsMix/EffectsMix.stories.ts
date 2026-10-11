import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import EffectsMix from './EffectsMix.svelte'
import { effectsMix } from '../Effects/Effects.fixtures'

/**
 * The Effects page's mix switches, 120 × 288, always in view: Style inserts and Rotary fast, a
 * hairline, then Master comp and Master EQ. Neutral lamps, outline at rest and solid when on.
 * Controlled: a click calls `onchange` with the change asked for and moves nothing itself.
 */
const meta = {
  title: 'Components/EffectsMix',
  component: EffectsMix,
  parameters: { layout: 'centered' },
  args: { mix: effectsMix, tipAction: fn(), onchange: fn() },
  argTypes: {
    mix: { control: 'object' },
  },
} satisfies Meta<typeof EffectsMix>

export default meta
type Story = StoryObj<typeof meta>

/** The board's moment: the style's inserts on, rotary slow, the compressor on, the EQ off. */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('region', { name: 'Mix switches' })).toBeInTheDocument()
    await expect(canvas.getByRole('heading', { name: 'Mix' })).toBeInTheDocument()
    const inserts = canvas.getByRole('button', { name: 'Style insertion effects' })
    const rotary = canvas.getByRole('button', { name: 'Rotary speaker fast' })
    const comp = canvas.getByRole('button', { name: 'Master Compressor' })
    const eq = canvas.getByRole('button', { name: 'Master EQ' })
    await expect(inserts).toHaveAttribute('aria-pressed', 'true')
    await expect(rotary).toHaveAttribute('aria-pressed', 'false')
    await expect(comp).toHaveAttribute('aria-pressed', 'true')
    await expect(eq).toHaveAttribute('aria-pressed', 'false')
    await expect(inserts).toHaveAttribute('data-tip', 'fx.inserts')
    await expect(args.tipAction).toHaveBeenCalledWith(eq, 'fx.master_eq')

    await userEvent.click(inserts)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'insertsOn', on: false })
    await userEvent.click(rotary)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'rotaryFast' })
    await userEvent.click(comp)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'compOn', on: false })
    await userEvent.click(eq)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'eqOn', on: true })
    await expect(inserts).toHaveAttribute('aria-pressed', 'true')
  },
}

/** Every switch off: four outlined lamps. */
export const AllOff: Story = {
  args: { mix: { insertsOn: false, rotaryFast: false, compOn: false, eqOn: false } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    for (const button of canvas.getAllByRole('button')) await expect(button).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(canvas.getByRole('button', { name: 'Style insertion effects' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'insertsOn', on: true })
  },
}

import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test'
import MasterEditor from './MasterEditor.svelte'
import { effectsMaster, effectsMasterLoudness } from '../Effects/Effects.fixtures'

/**
 * The Effects page's Master editor (about 944 × 288): the compressor's type and its three settings,
 * the EQ's type, its response curve and its eight bands. The on/off lamps sit in the page's Mix
 * column, not here; an EQ that is off draws its curve faded and says "Off". Every change is one
 * `MasterChange` through onchange; a band edit reports the whole band.
 */
const meta = {
  title: 'Components/MasterEditor',
  component: MasterEditor,
  args: { master: effectsMaster, tipAction: fn(), onchange: fn() },
  argTypes: {
    master: { control: 'object' },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MasterEditor>

export default meta
type Story = StoryObj<typeof meta>

/** The board's moment: the compressor on (Natural), the EQ off (Flat), its curve faded. */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const picker = canvas.getByRole('combobox', { name: 'Master compressor type' })
    await expect(picker).toHaveValue('natural')
    await userEvent.selectOptions(picker, 'punchy')
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'compType', preset: 'punchy' })
    await expect(picker).toHaveValue('natural')

    await fireEvent.keyDown(canvas.getByRole('slider', { name: 'Compression' }), { key: 'ArrowRight' })
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'compParam', id: 'compression', value: 31 })

    await userEvent.click(within(canvas.getByRole('tablist', { name: 'Master EQ type' })).getByRole('tab', { name: 'Loudness' }))
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'eqType', preset: 'loudness' })

    await fireEvent.keyDown(canvas.getByRole('slider', { name: 'EQ band 1 gain' }), { key: 'ArrowRight' })
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'eqBand', band: 0, gain: 1, freq: 80, q: 7, shelf: true })

    // Any whole Hz: an arrow key steps off the XG frequencies, typed digits and Enter set one exactly.
    await fireEvent.keyDown(canvas.getByRole('slider', { name: 'EQ band 1 frequency' }), { key: 'ArrowRight' })
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'eqBand', band: 0, gain: 0, freq: 82, q: 7, shelf: true })
    const band2 = canvas.getByRole('slider', { name: 'EQ band 2 frequency' })
    for (const key of ['1', '2', '3', '4']) await fireEvent.keyDown(band2, { key })
    await expect(band2).toHaveTextContent('1234')
    await fireEvent.keyDown(band2, { key: 'Enter' })
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'eqBand', band: 1, gain: 0, freq: 1234, q: 7, shelf: false })

    const shelf = canvas.getByRole('button', { name: 'EQ band 8 shelf' })
    await expect(shelf).toHaveAttribute('aria-pressed', 'true')
    await expect(shelf).toHaveTextContent('High')
    await userEvent.click(shelf)
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'eqBand', band: 7, gain: 0, freq: 8000, q: 7, shelf: false })

    await expect(canvas.getByRole('img', { name: 'Master EQ response, off' })).toBeInTheDocument()
    await expect(canvas.getByRole('slider', { name: 'EQ band 1 Q' })).toHaveAttribute('aria-disabled', 'true')
  },
}

/** The board's variant: the EQ on at Loudness, lows and highs lifted. */
export const Loudness: Story = {
  args: { master: effectsMasterLoudness },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('img', { name: 'Master EQ response' })).toBeInTheDocument()
    await expect(within(canvas.getByRole('tablist', { name: 'Master EQ type' })).getByRole('tab', { name: 'Loudness' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(canvas.getByRole('slider', { name: 'EQ band 1 gain' })).toHaveTextContent('+4')
  },
}

/** Both edited from their types: the picker says "(edited)", the EQ tabs an "edited" caption. */
export const Edited: Story = {
  args: { master: { ...effectsMasterLoudness, compEdited: true, eqEdited: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('option', { name: 'Natural (edited)' })).toBeInTheDocument()
    await expect(canvas.getByText('edited')).toBeInTheDocument()
  },
}

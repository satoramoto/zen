import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import SettingsPedals from './SettingsPedals.svelte'
import { pedalsBoard, pedalsHeld, pedalsLearning, pedalsPitchBend } from './SettingsPedals.fixtures'

/**
 * The Pedals page of the Settings screen (the Screen draws its header). The pedals table: each
 * pedal's CC, function, Control type (switch functions only), Reverse, Range (Pitch Bend only),
 * Try and Learn; then which controllers reach each part, in the part's hue, and each part's bend
 * range. Controlled: every edit is reported through `onchange` as a `PedalsChange`.
 */
const meta = {
  title: 'Components/SettingsPedals',
  component: SettingsPedals,
  parameters: { layout: 'centered' },
  args: { data: pedalsBoard, onchange: fn(), tipAction: fn() },
  argTypes: {
    data: { control: 'object' },
  },
} satisfies Meta<typeof SettingsPedals>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The board: P1 CC 64 Sustain, P2 CC 66 Sostenuto (both Hold A), P3 CC 67 Fill Up (no Control
 * type); no Range shown. Choosing P3's function, typing a CC, a reach lamp and bend + each report
 * their change and leave the page as `data` says.
 */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('table', { name: 'Pedals' })).toBeInTheDocument()
    await expect(canvas.getAllByRole('combobox', { name: /control type/ })).toHaveLength(2)
    await expect(canvas.queryByRole('combobox', { name: /range/ })).toBeNull()

    // P3's function: Fill Up, chosen Fill Down; reported, and the picker stays on data's Fill Up.
    const fn3 = canvas.getByRole<HTMLSelectElement>('combobox', { name: 'Pedal 3 function' })
    await expect(fn3.value).toBe('fillUp')
    await expect(fn3).toHaveAttribute('data-tip', 'pedal.function')
    await expect(args.tipAction).toHaveBeenCalledWith(fn3, 'pedal.function')
    await userEvent.selectOptions(fn3, 'fillDown')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'function', pedal: 2, fn: 'fillDown' })
    await expect(fn3.value).toBe('fillUp')

    // P1's CC: type 70 and Enter, reported once (the blur after it doesn't report again).
    const cc1 = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Pedal 1 CC' })
    await expect(cc1.value).toBe('64')
    await expect(cc1).toHaveAttribute('data-tip', 'pedal.cc')
    await userEvent.clear(cc1)
    await userEvent.type(cc1, '70{Enter}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'cc', pedal: 0, cc: 70 })
    await userEvent.tab()
    await expect(changesOf(args.onchange, 'cc')).toBe(1)

    // Not a CC: nothing reported, the field goes back to data's value.
    const cc2 = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Pedal 2 CC' })
    await userEvent.clear(cc2)
    await userEvent.type(cc2, '200{Enter}')
    await expect(changesOf(args.onchange, 'cc')).toBe(1)
    await expect(cc2.value).toBe('66')

    // A reach lamp: Sustain doesn't reach Left; a press asks for it.
    const reach = canvas.getByRole('button', { name: 'Sustain reaches Left' })
    await expect(reach).toHaveAttribute('aria-pressed', 'false')
    await expect(reach).toHaveAttribute('data-tip', 'pedal.part_sustain')
    await userEvent.click(reach)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'reach', part: 3, controller: 'sustain', on: true })
    await expect(canvas.getByRole('button', { name: 'Modulation reaches Right 2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    // Bend range: Right 1 at 2 steps up; Right 3 at 12 can't go up.
    await userEvent.click(canvas.getByRole('button', { name: 'Right 1 bend range up' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'bendStep', part: 0, delta: 1 })
    const up3 = canvas.getByRole('button', { name: 'Right 3 bend range up' })
    await expect(up3).toHaveAttribute('aria-disabled', 'true')
    const calls = (args.onchange as ReturnType<typeof fn>).mock.calls.length
    await userEvent.click(up3)
    await expect(args.onchange).toHaveBeenCalledTimes(calls)

    // Try and Learn report their pedal.
    await userEvent.click(canvas.getByRole('button', { name: 'Try pedal 3' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'try', pedal: 2 })
    await userEvent.click(canvas.getByRole('button', { name: 'Learn pedal 1' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'learn', pedal: 0 })
  },
}

/** How many reported changes were of `type`. */
function changesOf(mock: unknown, type: string): number {
  return (mock as ReturnType<typeof fn>).mock.calls.filter(([c]) => (c as { type: string }).type === type).length
}

/**
 * P3 on Pitch Bend: its Range shows (Lower), no Control type, Reverse lit, and Try is shown, not
 * pressable (Pitch Bend follows the pedal). Left's bend range is at 0: − is disabled.
 */
export const PitchBend: Story = {
  args: { data: pedalsPitchBend },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const range = canvas.getByRole<HTMLSelectElement>('combobox', { name: 'Pedal 3 range' })
    await expect(range.value).toBe('lower')
    await expect(range).toHaveAttribute('data-tip', 'pedal.range')
    await expect(canvas.queryByRole('combobox', { name: 'Pedal 3 control type' })).toBeNull()
    await userEvent.selectOptions(range, 'full')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'range', pedal: 2, value: 'full' })
    await expect(range.value).toBe('lower')

    const reverse = canvas.getByRole('button', { name: 'Pedal 3 reverse' })
    await expect(reverse).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(reverse)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'reverse', pedal: 2, on: false })

    await expect(canvas.getByRole('button', { name: 'Try pedal 3' })).toHaveAttribute('aria-disabled', 'true')
    await expect(canvas.getByRole('button', { name: 'Left bend range down' })).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(canvas.getByRole('button', { name: 'Left bend range up' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'bendStep', part: 3, delta: 1 })
  },
}

/** Pedal 2 waiting for a press: Learn's waiting face, "Learning…", its CC empty. A press stops it. */
export const Learning: Story = {
  args: { data: pedalsLearning },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const learn = canvas.getByRole('button', { name: 'Learning pedal 2: press to stop' })
    await expect(learn).toHaveTextContent('Learning…')
    await expect(learn).toHaveAttribute('data-face', 'waiting')
    await expect(learn).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole<HTMLInputElement>('textbox', { name: 'Pedal 2 CC' }).value).toBe('')
    await userEvent.click(learn)
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'learn', pedal: 1 })

    // An empty CC is "none": typing one into it reports the number.
    const cc2 = canvas.getByRole('textbox', { name: 'Pedal 2 CC' })
    await userEvent.type(cc2, '66{Enter}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'cc', pedal: 1, cc: 66 })
  },
}

/** Pedal 1 held down: its name lit. Its Control type is Toggle; choosing Hold B reports it. */
export const Held: Story = {
  args: { data: pedalsHeld },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const p1 = canvas.getByRole('cell', { name: 'P1, held' })
    await expect(p1).toHaveAttribute('data-down')
    await expect(canvas.getByRole('cell', { name: 'P2' })).not.toHaveAttribute('data-down')
    const type1 = canvas.getByRole<HTMLSelectElement>('combobox', { name: 'Pedal 1 control type' })
    await expect(type1.value).toBe('toggle')
    await expect(type1).toHaveAttribute('data-tip', 'pedal.control_type')
    await userEvent.selectOptions(type1, 'holdB')
    await expect(args.onchange).toHaveBeenLastCalledWith({ type: 'controlType', pedal: 0, value: 'holdB' })
  },
}

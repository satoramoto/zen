import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import SettingsStyle from './SettingsStyle.svelte'
import { styleBoard, styleBusy, styleDynamicsOff, styleSyncStopUnavailable } from './SettingsStyle.fixtures'

/**
 * The Style page of the Settings screen: three columns (Sections, Timing & feel, Playing with its
 * Dynamics group) of settings rows. Choices are compact tab runs, switches On/Off lamps, amounts
 * line sliders. Controlled: every control reports `{ key, value }` through `onchange` and the page
 * moves only when `data` does; the Accent row's More (Accent mode and source) is its own state.
 */
const meta = {
  title: 'Components/SettingsStyle',
  component: SettingsStyle,
  parameters: { layout: 'centered' },
  args: { data: styleBoard, onchange: fn(), tipAction: fn() },
  argTypes: {
    data: { control: 'object' },
  },
} satisfies Meta<typeof SettingsStyle>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The board: Next bar timing, Stop Accomp on Style, Section set Off, Dynamics on. Each control
 * reports its key and the value asked for, and draws only what `data` says.
 */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const main = within(canvas.getByRole('tablist', { name: 'Main timing' }))
    await expect(main.getByRole('tab', { name: 'Next bar' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(main.getByRole('tab', { name: 'Immediate' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ key: 'mainTiming', value: 'immediate' })
    await expect(main.getByRole('tab', { name: 'Next bar' })).toHaveAttribute('aria-selected', 'true')

    const set = within(canvas.getByRole('tablist', { name: /^Section set/ }))
    await expect(set.getByRole('tab', { name: 'Off' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(set.getByRole('tab', { name: 'Main B' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ key: 'sectionSet', value: 1 })
    await userEvent.click(set.getByRole('tab', { name: 'Off' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ key: 'sectionSet', value: null })

    const stop = within(canvas.getByRole('tablist', { name: 'Stop Accompaniment' }))
    await expect(stop.getByRole('tab', { name: 'Fixed' })).toHaveAttribute('data-tip', 'settings.stop_acmp_fixed')
    await userEvent.click(stop.getByRole('tab', { name: 'Fixed' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ key: 'stopAcmp', value: 'fixed' })

    const rate = within(canvas.getByRole('tablist', { name: 'Retrigger rate' }))
    await expect(rate.getByRole('tab', { name: '1/8' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(rate.getByRole('tab', { name: '1/32' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ key: 'retriggerRate', value: 32 })

    const reset = canvas.getByRole('button', { name: 'Section reset' })
    await expect(reset).toHaveAttribute('aria-pressed', 'true')
    await expect(reset).toHaveTextContent('On')
    await userEvent.click(reset)
    await expect(args.onchange).toHaveBeenLastCalledWith({ key: 'sectionReset', value: false })
    await expect(reset).toHaveAttribute('aria-pressed', 'true')

    const fadeIn = canvas.getByRole('slider', { name: 'Fade in time' })
    await expect(fadeIn).toHaveAttribute('aria-valuetext', '5.0 s')
    const window_ = canvas.getByRole('slider', { name: 'Synchro Stop window' })
    await expect(window_).toHaveAttribute('aria-valuetext', '300 ms')
    window_.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenLastCalledWith({ key: 'syncStopWindowMs', value: 400 })

    await expect(canvas.getByRole('slider', { name: 'Dynamics level' })).not.toHaveAttribute('aria-disabled')
    await expect(canvas.queryByRole('tablist', { name: 'Accent mode' })).toBeNull()
    await expect(args.tipAction).toHaveBeenCalledWith(reset, 'settings.section_reset')
  },
}

/**
 * More on the Accent row reveals Accent mode and source inline, and closes them again; it is the
 * page's own state and sends nothing.
 */
export const AccentMore: Story = {
  args: { data: styleBusy },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const more = canvas.getByRole('button', { name: 'More accent settings' })
    await expect(more).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(more)
    await expect(more).toHaveAttribute('aria-pressed', 'true')
    await expect(args.onchange).not.toHaveBeenCalled()

    const mode = within(canvas.getByRole('tablist', { name: 'Accent mode' }))
    await expect(mode.getByRole('tab', { name: 'Fill' })).toHaveAttribute('aria-selected', 'true')
    await expect(mode.getByRole('tab', { name: 'Hits' })).toHaveAttribute('data-tip', 'dynamics.accent_mode_hits')
    await userEvent.click(mode.getByRole('tab', { name: 'Hits' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ key: 'accentMode', value: 'hits' })

    const source = within(canvas.getByRole('tablist', { name: 'Accent source' }))
    await expect(source.getByRole('tab', { name: 'Both hands' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(source.getByRole('tab', { name: 'Left hand' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ key: 'accentSource', value: 'left' })

    await userEvent.click(more)
    await expect(canvas.queryByRole('tablist', { name: 'Accent mode' })).toBeNull()
    await expect(canvas.queryByRole('tablist', { name: 'Accent source' })).toBeNull()
  },
}

/** Dynamics Control off: Level is shown faded and doesn't move; Control still switches. */
export const DynamicsOff: Story = {
  args: { data: styleDynamicsOff },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const level = canvas.getByRole('slider', { name: 'Dynamics level' })
    await expect(level).toHaveAttribute('aria-disabled', 'true')
    level.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).not.toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Dynamics control' }))
    await expect(args.onchange).toHaveBeenLastCalledWith({ key: 'dynamicsControl', value: true })
  },
}

/** Sync Stop unavailable (Full Keyboard fingering in Lower): shown, not pressable; the window reads Off. */
export const SyncStopUnavailable: Story = {
  args: { data: styleSyncStopUnavailable },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const sync = canvas.getByRole('button', { name: 'Sync Stop' })
    await expect(sync).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(sync)
    await expect(args.onchange).not.toHaveBeenCalled()
    await expect(canvas.getByRole('slider', { name: 'Synchro Stop window' })).toHaveAttribute('aria-valuetext', 'Off')
  },
}

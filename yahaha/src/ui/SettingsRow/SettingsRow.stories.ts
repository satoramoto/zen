import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { createRawSnippet, mount, unmount } from 'svelte'
import { expect, fn, userEvent, within } from 'storybook/test'
import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
import LampButton from '../LampButton/LampButton.svelte'
import LineSlider from '../LineSlider/LineSlider.svelte'
import SettingsRow from './SettingsRow.svelte'

type Control = 'lamp' | 'tabs' | 'slider' | 'none'
type Tab = { id: string; label: string; tip?: string }

/** The story's args: SettingsRow's own props plus the control's, mapped into `children`. */
type Args = {
  label: string
  hint?: string
  labelWidth?: number
  control: Control
  lampLabel: string
  lampOn: boolean
  lampDisabled: boolean
  lampTip?: string
  ontoggle: (on: boolean) => void
  tabs: Tab[]
  tabsChosen: string
  tabsLabel: string
  onchoose: (id: string) => void
  sliderValue: number
  sliderMax: number
  sliderUnit: string
  sliderTip?: string
  onchange: (value: number) => void
  tipAction: (node: HTMLElement, key: string) => void
}

const MAIN_TIMING: Tab[] = [
  { id: 'immediate', label: 'Immediate', tip: 'settings.section_timing' },
  { id: 'nextBar', label: 'Next bar', tip: 'settings.section_timing' },
]

/** The `children` snippet for a story's `control`, mounting the real LampButton, ChosenTabs or LineSlider. */
function children(args: Args) {
  if (args.control === 'none') return undefined
  return createRawSnippet(() => ({
    render: () => '<span style="display: contents"></span>',
    setup: (root: Element) => {
      const target = root
      const instance =
        args.control === 'lamp'
          ? mount(LampButton, {
              target,
              props: {
                label: args.lampLabel,
                on: args.lampOn,
                disabled: args.lampDisabled,
                size: 'sm',
                width: 64,
                name: args.label,
                tip: args.lampTip,
                tipAction: args.tipAction,
                ontoggle: args.ontoggle,
              },
            })
          : args.control === 'tabs'
            ? mount(ChosenTabs, {
                target,
                props: {
                  size: 'compact',
                  label: args.tabsLabel,
                  tabs: args.tabs,
                  chosen: args.tabsChosen,
                  tipAction: args.tipAction,
                  onchoose: args.onchoose,
                },
              })
            : mount(LineSlider, {
                target,
                props: {
                  name: args.label,
                  value: args.sliderValue,
                  max: args.sliderMax,
                  unit: args.sliderUnit,
                  tip: args.sliderTip,
                  tipAction: args.tipAction,
                  onchange: args.onchange,
                },
              })
      return () => {
        void unmount(instance)
      }
    },
  }))
}

/**
 * One setting on a Settings page: its name in the fixed label column (`--value-ink`), then the
 * control, then an optional hint in the caption ink, all at the one text size and with no box. The
 * stories mount real controls into `children` (a LampButton, a ChosenTabs run or a LineSlider,
 * picked by `control`); their args are grouped by child in the Controls panel.
 */
const meta: Meta<Args> = {
  title: 'Primitives/SettingsRow',
  component: SettingsRow,
  parameters: { layout: 'centered' },
  render: (args: Args) => ({
    Component: SettingsRow,
    props: {
      label: args.label,
      hint: args.hint,
      labelWidth: args.labelWidth,
      children: children(args),
      // The story's args map onto SettingsRow's props here; Storybook types `props` as the args.
    } as unknown as Args,
  }),
  args: {
    label: 'Upper',
    hint: 'Chords from the right hand',
    labelWidth: 120,
    control: 'lamp',
    lampLabel: 'On',
    lampOn: true,
    lampDisabled: false,
    ontoggle: fn(),
    tabs: MAIN_TIMING,
    tabsChosen: 'nextBar',
    tabsLabel: 'Main timing',
    onchoose: fn(),
    sliderValue: 10,
    sliderMax: 30,
    sliderUnit: 'ms',
    sliderTip: 'settings.chord_settle',
    onchange: fn(),
    tipAction: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    labelWidth: { control: 'number' },
    control: {
      control: 'inline-radio',
      options: ['lamp', 'tabs', 'slider', 'none'],
      table: { category: 'children' },
    },
    lampLabel: { control: 'text', table: { category: 'LampButton' } },
    lampOn: { control: 'boolean', table: { category: 'LampButton' } },
    lampDisabled: { control: 'boolean', table: { category: 'LampButton' } },
    lampTip: { control: 'text', table: { category: 'LampButton' } },
    ontoggle: { table: { category: 'LampButton' } },
    tabs: { control: 'object', table: { category: 'ChosenTabs' } },
    tabsChosen: { control: 'select', options: ['immediate', 'nextBar'], table: { category: 'ChosenTabs' } },
    tabsLabel: { control: 'text', table: { category: 'ChosenTabs' } },
    onchoose: { table: { category: 'ChosenTabs' } },
    sliderValue: { control: 'number', table: { category: 'LineSlider' } },
    sliderMax: { control: 'number', table: { category: 'LineSlider' } },
    sliderUnit: { control: 'text', table: { category: 'LineSlider' } },
    sliderTip: { control: 'text', table: { category: 'LineSlider' } },
    onchange: { table: { category: 'LineSlider' } },
    tipAction: { table: { category: 'children' } },
  },
}

export default meta
type Story = StoryObj<Args>

/**
 * The Chord page's Upper row: "Upper", its On lamp lit, and the hint "Chords from the right hand".
 * A click on the lamp asks for off through the lamp's `ontoggle`.
 */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Upper')).toBeInTheDocument()
    await expect(canvas.getByText('Chords from the right hand')).toBeInTheDocument()
    const lamp = await canvas.findByRole('button', { name: 'Upper' })
    await expect(lamp).toHaveAttribute('aria-pressed', 'true')
    const text = canvasElement.textContent ?? ''
    await expect(text.indexOf('Upper')).toBeLessThan(text.indexOf('On'))
    await expect(text.indexOf('On')).toBeLessThan(text.indexOf('Chords from the right hand'))
    await userEvent.click(lamp)
    await expect(args.ontoggle).toHaveBeenCalledWith(false)
  },
}

/** Manual Bass, shown but not pressable while Upper is off: the lamp disabled, the hint says why. */
export const DisabledLamp: Story = {
  args: { label: 'Manual Bass', hint: 'Works with Upper on', lampOn: false, lampDisabled: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const lamp = await canvas.findByRole('button', { name: 'Manual Bass' })
    await expect(lamp).toHaveAttribute('aria-disabled', 'true')
    await expect(canvas.getByText('Works with Upper on')).toBeInTheDocument()
    await userEvent.click(lamp)
    await expect(args.ontoggle).not.toHaveBeenCalled()
  },
}

/** The Style page's Main timing: a run of tabs, Next bar chosen; no hint. */
export const Tabs: Story = {
  args: { label: 'Main timing', hint: '', control: 'tabs' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Main timing', { selector: 'span' })).toBeInTheDocument()
    await expect(await canvas.findByRole('tab', { name: 'Next bar' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(canvas.getByRole('tab', { name: 'Immediate' }))
    await expect(args.onchoose).toHaveBeenCalledWith('immediate')
    await expect(canvas.queryByText('Chords from the right hand')).toBeNull()
  },
}

/** The Chord page's Chord settle: a LineSlider at 10 ms of 30. */
export const Slider: Story = {
  args: { label: 'Chord settle', hint: '', control: 'slider' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const slider = await canvas.findByRole('slider', { name: 'Chord settle' })
    await expect(slider).toHaveAttribute('aria-valuetext', '10 ms')
    slider.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenCalledWith(11)
  },
}

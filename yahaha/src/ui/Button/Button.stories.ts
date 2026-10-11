import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test'
import Button from './Button.svelte'

const NONE = 'none'
const SIZES = ['icon', 'md', 'band', 'pair', 'cell', 'caret']
/** The hues that draw a distinct look (the deprecated `t2` and `m` draw as `t`, so they're left out). */
const HUES = ['t', 'a','lamp', 'rec', 'ok', 'r1', 'r2', 'r3', 'l', 'intro', 'main', 'ending', 'brk', 'fill']
const SYMBOLS = ['prev', 'next', 'up', 'down', 'plus', 'minus', 'caret']
/** A select whose first option is `none` (undefined), so the control can go back to "no value". */
const optional = (options: string[]) => ({ control: 'select' as const, options: [NONE, ...options], mapping: { [NONE]: undefined } })
/** none / false / true, for a boolean whose undefined means "no attribute". */
const threeWay = {
  control: 'select' as const,
  options: [NONE, 'false', 'true'],
  mapping: { [NONE]: undefined, false: false, true: true },
}

/**
 * The plain button: does one thing when pressed (Panic, Stop, a page step, a One Touch), and shows
 * when that thing is chosen, switched on or waiting, in the state language: at rest a 1px outline
 * and label in its `hue`, no fill; on or chosen a solid fill in the hue, label in `--on-ink`;
 * waiting a 2px ring over a faint fill of the hue; disabled a 1px outline and the label in its own
 * hue at reduced strength, no fill. No button is grey.
 * Every face is a prop; the parent acts on `onpress`, `onhold`, `onlongpress` and `onlongrelease`.
 */
const meta = {
  title: 'Primitives/Button',
  component: Button,
  parameters: { layout: 'centered' },
  args: { onpress: fn(), onhold: fn(), onlongpress: fn(), onlongrelease: fn(), tipAction: fn() },
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
    controls: { control: 'text' },
    tip: { control: 'text' },
    compact: { control: 'boolean' },
    strong: { control: 'boolean' },
    on: { control: 'boolean' },
    chosen: { control: 'boolean' },
    waiting: { control: 'boolean' },
    expanded: { control: 'boolean' },
    disabled: { control: 'boolean' },
    hold: { control: 'boolean' },
    size: { control: 'select', options: SIZES },
    hue: { control: 'select', options: HUES },
    symbol: optional(SYMBOLS),
    join: optional(['start', 'end']),
    popup: optional(['dialog', 'menu']),
    bar: threeWay,
    pressed: threeWay,
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/** A primary-button pointer event's init (L4: jsdom has no pointer capture). */
const pointer = (pointerId: number) => ({ pointerId, button: 0, clientX: 0, clientY: 0 })
/** Real time, longer than `--long-press` (350 ms). */
const pastLongPress = () => new Promise((resolve) => setTimeout(resolve, 500))

/** The first Button on the Stage board: the Metronome ▾ caret, joined to its lamp, closed. */
export const Board: Story = {
  args: {
    symbol: 'caret',
    size: 'caret',
    join: 'end',
    popup: 'dialog',
    expanded: false,
    name: 'Metronome settings',
    tip: 'metronome.settings',
  },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Metronome settings' })
    await expect(button).toHaveAttribute('aria-haspopup', 'dialog')
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await expect(button).not.toHaveAttribute('aria-pressed')
    await expect(button).not.toHaveAttribute('aria-disabled')
    await expect(button).toHaveAttribute('data-face', 'off')
    await expect(button).toHaveAttribute('data-tip', 'metronome.settings')
    await expect(args.tipAction).toHaveBeenCalledWith(button, 'metronome.settings')
    await userEvent.click(button)
    await expect(args.onpress).toHaveBeenCalledTimes(1)
  },
}

/** Help mode's ?: a 32 × 32 button at rest (neutral outline and label), a switch that is off. */
export const Icon: Story = {
  args: { label: '?', size: 'icon', pressed: false, name: 'Help mode' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Help mode' })
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await expect(button).toHaveAttribute('data-face', 'off')
  },
}

/** A band button switched on: Fade while fading, the solid neutral fill. */
export const BandOn: Story = {
  args: { label: 'Fade', size: 'band', on: true, pressed: true },
}

/** The on face: help mode switched on, the solid neutral fill with the "?" in `--on-ink`. */
export const On: Story = {
  args: { label: '?', size: 'icon', on: true, pressed: true, name: 'Help mode' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Help mode' })
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(button).toHaveAttribute('data-face', 'on')
  },
}

/** The chosen face, a solid fill in the hue with the label in `--on-ink`: the applied One Touch. */
export const Chosen: Story = {
  args: { label: '2', size: 'icon', chosen: true, pressed: true, name: 'One Touch 2, applied' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'One Touch 2, applied' })
    await expect(button).toHaveAttribute('data-face', 'chosen')
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  },
}

/** A band button: 88 × 32, the label left at 8px (Stop). */
export const Band: Story = {
  args: { label: 'Stop', size: 'band', name: 'Stop (fade with hold)' },
}

/** Start / Stop running (`bar`): the on face in `--ok`, solid green with the label in `--on-ink`. */
export const Running: Story = {
  args: {
    label: 'Start / Stop',
    size: 'band',
    compact: true,
    strong: true,
    bar: true,
    pressed: true,
    name: 'Start / Stop, running',
    tip: 'transport.start_stop',
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Start / Stop, running' })
    await expect(button).toHaveAttribute('data-bar')
    await expect(button).toHaveAttribute('data-face', 'on')
    await expect(button).toHaveAttribute('data-hue', 'ok')
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  },
}

/** Start / Stop stopped (`bar: false`): the rest face, a neutral outline and label. */
export const Stopped: Story = {
  args: { ...Running.args, bar: false, pressed: false, name: 'Start / Stop' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Start / Stop' })
    await expect(button).not.toHaveAttribute('data-bar')
    await expect(button).toHaveAttribute('data-face', 'off')
    await expect(button).toHaveAttribute('data-hue', 't')
    await expect(button).toHaveAttribute('aria-pressed', 'false')
  },
}

/** The waiting face: Fade armed, a 2px neutral ring over a faint neutral fill, the label in `--neutral`. */
export const Waiting: Story = {
  args: {
    label: 'Fade',
    size: 'pair',
    waiting: true,
    pressed: false,
    name: 'Fade, armed',
    tip: 'transport.fade',
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Fade, armed' })
    await expect(button).toHaveAttribute('data-face', 'waiting')
    await expect(button).toHaveAttribute('data-hue', 't')
  },
}

/** Shown, not pressable: the neutral hue at reduced strength (`--absent-neutral`) for the outline and label, no fill. No press, hold or long press. */
export const Disabled: Story = {
  args: { label: 'Audition', size: 'md', compact: true, disabled: true, name: 'Audition (stop the band first)' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Audition (stop the band first)' })
    await expect(button).toHaveAttribute('aria-disabled', 'true')
    await expect(button).toHaveAttribute('data-face', 'disabled')
    await expect(button).toHaveAttribute('data-contrast', 'dim')
    await userEvent.click(button)
    button.focus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onpress).not.toHaveBeenCalled()
    await fireEvent.pointerDown(button, pointer(1))
    await pastLongPress()
    await fireEvent.pointerUp(button, pointer(1))
    await expect(args.onlongpress).not.toHaveBeenCalled()
    await expect(args.onhold).not.toHaveBeenCalled()
  },
}

/**
 * A hued button, absent: disabled draws its own hue at reduced strength (here `--absent-fill`) for
 * the outline, label and glyph, no fill; fainter than the rest face, never grey.
 */
export const DisabledHue: Story = {
  args: { label: 'Fill', symbol: 'up', size: 'pair', hue: 'fill', disabled: true, name: 'Fill up (none in this style)' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Fill up (none in this style)' })
    await expect(button).toHaveAttribute('data-face', 'disabled')
    await expect(button).toHaveAttribute('data-hue', 'fill')
    await expect(button).toHaveAttribute('data-contrast', 'dim')
  },
}

/**
 * Repeat-while-held (Tempo +): pointer down and up call `onhold`, following only the pointer that
 * started the hold; a pointer click doesn't press, a keyboard click does; no long press.
 */
export const Hold: Story = {
  args: { label: 'Tempo', symbol: 'plus', size: 'band', hold: true, name: 'Tempo up (Scene Launch)', tip: 'tempo.up' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Tempo up (Scene Launch)' })
    await fireEvent.pointerDown(button, pointer(1))
    await expect(args.onhold).toHaveBeenCalledTimes(1)
    await expect(args.onhold).toHaveBeenLastCalledWith(true)
    await fireEvent.pointerDown(button, pointer(2))
    await fireEvent.pointerUp(button, pointer(2))
    await expect(args.onhold).toHaveBeenCalledTimes(1)
    await fireEvent.pointerUp(button, pointer(1))
    await expect(args.onhold).toHaveBeenCalledTimes(2)
    await expect(args.onhold).toHaveBeenLastCalledWith(false)
    await fireEvent.pointerUp(button, pointer(1))
    await expect(args.onhold).toHaveBeenCalledTimes(2)
    await fireEvent.pointerDown(button, pointer(3))
    await fireEvent.pointerCancel(button, pointer(3))
    await expect(args.onhold).toHaveBeenCalledTimes(4)
    await expect(args.onhold).toHaveBeenLastCalledWith(false)

    await fireEvent.click(button, { detail: 1 })
    await expect(args.onpress).not.toHaveBeenCalled()
    button.focus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onpress).toHaveBeenCalledTimes(1)

    await fireEvent.pointerDown(button, pointer(4))
    await pastLongPress()
    await expect(args.onlongpress).not.toHaveBeenCalled()
    await fireEvent.pointerUp(button, pointer(4))
    await expect(args.onlongrelease).not.toHaveBeenCalled()
  },
}

/**
 * The long press: held past `--long-press` it calls `onlongpress`, its release `onlongrelease`, and
 * the click that ends it is swallowed. A short click still presses; a right-click long-presses.
 */
export const LongPress: Story = {
  args: { label: 'Stop', size: 'band', tip: 'transport.stop' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Stop' })
    await fireEvent.pointerDown(button, pointer(1))
    await expect(args.onlongpress).not.toHaveBeenCalled()
    await waitFor(() => expect(args.onlongpress).toHaveBeenCalledTimes(1), { timeout: 1000 })
    await fireEvent.pointerUp(button, pointer(1))
    await expect(args.onlongrelease).toHaveBeenCalledTimes(1)
    await fireEvent.click(button)
    await expect(args.onpress).not.toHaveBeenCalled()
    await userEvent.click(button)
    await expect(args.onpress).toHaveBeenCalledTimes(1)
    await fireEvent.contextMenu(button)
    await expect(args.onlongpress).toHaveBeenCalledTimes(2)
  },
}

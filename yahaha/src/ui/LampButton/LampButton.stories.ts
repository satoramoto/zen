import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test'
import LampButton from './LampButton.svelte'

/**
 * The on/off control the whole canvas uses: Accomp, Metronome, part On, Sound, Looper, in the
 * state language. Off is a 1px outline and label in its `hue`, no fill; lit is a solid fill in the
 * hue with the label in `--on-ink`; armed is a 2px ring over a faint fill of the hue; disabled is
 * a 1px outline and the label in the lamp's own hue at reduced strength, no fill. No lamp is grey:
 * the deprecated `m` hue draws exactly as the neutral `t`. Controlled: a click asks for `!on` through `ontoggle`.
 * A long press (or right-click) calls `onlongpress` / `onlongrelease` and never toggles.
 */
const meta = {
  title: 'Primitives/LampButton',
  component: LampButton,
  parameters: { layout: 'centered' },
  args: { ontoggle: fn(), onlongpress: fn(), onlongrelease: fn(), tipAction: fn() },
  argTypes: {
    label: { control: 'text' },
    code: { control: 'text' },
    name: { control: 'text' },
    tip: { control: 'text' },
    on: { control: 'boolean' },
    disabled: { control: 'boolean' },
    rec: { control: 'boolean' },
    waiting: { control: 'boolean' },
    size: { control: 'select', options: ['md', 'sm', 'cell'] },
    hue: { control: 'select', options: ['t', 'r1', 'r2', 'r3', 'l', 'ok', 'lamp'] },
    join: { control: 'select', options: ['none', 'start', 'end'], mapping: { none: undefined } },
    width: { control: 'number' },
  },
} satisfies Meta<typeof LampButton>

export default meta
type Story = StoryObj<typeof meta>

/** The first LampButton on the Stage board: Accomp, lit, with its Genos code (section row). */
export const Board: Story = {
  args: { label: 'Accomp', code: 'ACMP', on: true, tip: 'transport.acmp' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Accomp ACMP' })
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(button).toHaveAttribute('data-face', 'on')
    await expect(button).toHaveAttribute('data-tip', 'transport.acmp')
    await expect(args.tipAction).toHaveBeenCalledWith(button, 'transport.acmp')
  },
}

/** Lit: the solid neutral fill, the label and the small code in `--on-ink`. */
export const On: Story = {
  args: { label: 'Accomp', code: 'ACMP', on: true },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Accomp ACMP' })
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(button).toHaveAttribute('data-face', 'on')
  },
}

/**
 * Controlled: a click, Space or Enter asks for `!on` through `ontoggle` and changes nothing itself;
 * the parent moves `on`. A short press never long-presses.
 */
export const Toggles: Story = {
  args: { label: 'Unison' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Unison' })
    await userEvent.click(button)
    await expect(args.ontoggle).toHaveBeenCalledTimes(1)
    await expect(args.ontoggle).toHaveBeenLastCalledWith(true)
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await expect(button).toHaveAttribute('data-face', 'off')
    button.focus()
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{Enter}')
    await expect(args.ontoggle).toHaveBeenCalledTimes(3)
    for (const n of [1, 2, 3]) await expect(args.ontoggle).toHaveBeenNthCalledWith(n, true)
    await expect(args.onlongpress).not.toHaveBeenCalled()
  },
}

/** Shown, not pressable: the neutral hue at reduced strength (`--absent-neutral`) for the outline and label, 64 × 28 (a settings row's On/Off). */
export const Disabled: Story = {
  args: { label: 'Off', size: 'sm', width: 64, disabled: true, name: 'Manual Bass, works with Upper on' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Manual Bass, works with Upper on' })
    await expect(button).toHaveAttribute('aria-disabled', 'true')
    await expect(button).toHaveAttribute('data-face', 'disabled')
    await expect(button).toHaveAttribute('data-contrast', 'dim')
    await userEvent.click(button)
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await expect(args.ontoggle).not.toHaveBeenCalled()
    const init = { pointerId: 1, button: 0, clientX: 0, clientY: 0 }
    await fireEvent.pointerDown(button, init)
    await new Promise((resolve) => setTimeout(resolve, 500))
    await expect(args.onlongpress).not.toHaveBeenCalled()
    await fireEvent.pointerUp(button, init)
    await expect(args.onlongrelease).not.toHaveBeenCalled()
  },
}

/** Off: a 1px neutral outline and label, no fill (Metronome, Unison). Off keeps its colour. */
export const Off: Story = {
  args: { label: 'Metronome' },
}

/** A part lamp, lit: the solid fill in the part's hue (Right 1 "On"). */
export const PartOn: Story = {
  args: { label: 'On', size: 'cell', on: true, hue: 'r1', name: 'Right 1 on' },
  parameters: { layout: 'padded' },
}

/** A part lamp, lit, in Right 2's pink. */
export const PartOnR2: Story = {
  args: { label: 'On', size: 'cell', on: true, hue: 'r2', name: 'Right 2 on' },
  parameters: { layout: 'padded' },
}

/** A part lamp, off: the outline and label in the part's hue, no fill (Right 3 "Off"). */
export const PartOff: Story = {
  args: { label: 'Off', size: 'cell', hue: 'r3', name: 'Right 3 off' },
  parameters: { layout: 'padded' },
}

/** The Left part lamp, lit, in teal. */
export const LeftOn: Story = {
  args: { label: 'On', size: 'cell', on: true, hue: 'l', name: 'Left on' },
  parameters: { layout: 'padded' },
}

/**
 * A part lamp, absent: disabled draws Right 1's own blue at reduced strength (`--absent-r1`) for
 * the outline and label, no fill, clearly fainter than `PartOff`, never grey.
 */
export const PartDisabled: Story = {
  args: { label: 'On', size: 'cell', hue: 'r1', disabled: true, name: 'Right 1 on (no sound loaded)' },
  parameters: { layout: 'padded' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Right 1 on (no sound loaded)' })
    await expect(button).toHaveAttribute('data-face', 'disabled')
    await expect(button).toHaveAttribute('data-hue', 'r1')
    await expect(button).toHaveAttribute('data-contrast', 'dim')
  },
}

/** A function lamp, off: the neutral outline and label (Harm/Arp, L Hold, Looper). */
export const FunctionOff: Story = {
  args: { label: 'Harm/Arp', size: 'cell' },
  parameters: { layout: 'padded' },
}

/** A function lamp, latched: the solid neutral fill, the label in `--on-ink` (Sound). */
export const FunctionOn: Story = {
  args: { label: 'Sound', size: 'cell', on: true },
  parameters: { layout: 'padded' },
}

/** The running lamp: the solid `--ok` fill (Start / Stop). */
export const Running: Story = {
  args: { label: 'Start / Stop', on: true, hue: 'ok' },
}

/** The record lamp, lit: the solid `--rec` fill. */
export const Recording: Story = {
  args: { label: 'Looper', size: 'cell', on: true, rec: true, name: 'Looper, recording' },
  parameters: { layout: 'padded' },
}

/** The Looper looping: the solid lime `--lamp` fill, the label in `--lamp-ink`. */
export const Looping: Story = {
  args: { label: 'Looper', size: 'cell', on: true, hue: 'lamp', name: 'Looper, looping' },
  parameters: { layout: 'padded' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Looper, looping' })
    await expect(button).toHaveAttribute('data-face', 'on')
    await expect(button).toHaveAttribute('data-hue', 'lamp')
  },
}

/** Loop armed: a 2px lime ring (`--lamp-line`) over a faint lime fill, the label in `--lamp-line`. */
export const ArmedLoop: Story = {
  args: { label: 'Looper', size: 'cell', waiting: true, hue: 'lamp', name: 'Looper, loop armed' },
  parameters: { layout: 'padded' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Looper, loop armed' })
    await expect(button).toHaveAttribute('data-face', 'waiting')
    await expect(button).toHaveAttribute('data-hue', 'lamp')
  },
}

/**
 * Looper's Rec armed in the lamp row: a 2px `--rec` ring over a faint `--rec` fill. A click asks
 * to toggle; the parent, not the click, lights it.
 */
export const Armed: Story = {
  args: {
    label: 'Looper',
    size: 'cell',
    waiting: true,
    rec: true,
    name: 'Looper, rec armed. Long press: loop rec',
    tip: 'looper.rec',
  },
  parameters: { layout: 'padded' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Looper, rec armed. Long press: loop rec' })
    await expect(button).toHaveAttribute('data-face', 'waiting')
    await expect(button).toHaveAttribute('data-hue', 'rec')
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(button)
    await expect(args.ontoggle).toHaveBeenCalledTimes(1)
    await expect(args.ontoggle).toHaveBeenLastCalledWith(true)
    await expect(button).toHaveAttribute('data-face', 'waiting')
  },
}

import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fireEvent, fn, within } from 'storybook/test'
import Keys from './Keys.svelte'
import { boardKeys, range49, range61 } from './Keys.fixtures'
import { layout } from './keys'

/**
 * The 56px OLED key strip: dark keys over the keyboard's range. With a split, the left zone is
 * tinted under a teal top line and a 2px white line marks the split; at a black key the line steps
 * round it the way the keys' edges do. Held keys fill with their part's hue and glow (no glow in
 * light). Notes are MIDI numbers, C3 = 60.
 *
 * With `onsplit` the split is set here: drag the handle on the split line (or focus it and use the
 * arrows); click it to arm a pick (`onpick`), and while `picking` (a 2px teal ring) the key pressed
 * becomes the split. Unarmed, pressing a key does nothing. `splitLocked` fades the handle and
 * nothing moves the split.
 */
const meta = {
  title: 'Primitives/Keys',
  component: Keys,
  parameters: { layout: 'centered' },
  args: { ...boardKeys, splitMin: 24, splitMax: 96, splitLocked: false, picking: false, tipAction: fn(), onsplit: fn(), onpick: fn() },
  argTypes: {
    range: { control: 'object' },
    split: { control: { type: 'number', min: 0, max: 127, step: 1 } },
    heldLeft: { control: 'object' },
    heldRight: { control: 'object' },
    rightPart: { control: 'inline-radio', options: ['r1', 'r2', 'r3'] },
    width: { control: { type: 'number', min: 200, step: 1 } },
    splitMin: { control: { type: 'number', min: 0, max: 127, step: 1 } },
    splitMax: { control: { type: 'number', min: 0, max: 127, step: 1 } },
    splitLocked: { control: 'boolean' },
    picking: { control: 'boolean' },
  },
} satisfies Meta<typeof Keys>

export default meta
type Story = StoryObj<typeof meta>

/** A pointer event's client point for a point `x`, `y` px from the strip's inner top left, at whatever scale it is drawn. */
function at(strip: HTMLElement, width: number, x: number, y: number) {
  const box = strip.getBoundingClientRect()
  const scale = box.width > 0 ? box.width / width : 1
  return { clientX: box.left + (x + 1) * scale, clientY: box.top + (y + 1) * scale, button: 0, pointerId: 1 }
}

/** The Stage board: 61 keys, split F#2, the left hand's Am7 in teal, E4 and A4 in Right 1's blue. */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const handle = canvas.getByRole('slider', { name: /^Split point/ })
    await expect(handle).toHaveAttribute('aria-valuetext', 'F#2')
    await expect(handle).toHaveAttribute('data-tip', 'settings.split_strip')
    await expect(args.tipAction).toHaveBeenCalledWith(handle, 'settings.split_strip')
    // Arrows step one semitone, black keys included; PageUp an octave.
    handle.focus()
    await fireEvent.keyDown(handle, { key: 'ArrowRight' })
    await expect(args.onsplit).toHaveBeenLastCalledWith(55)
    await fireEvent.keyDown(handle, { key: 'ArrowLeft' })
    await expect(args.onsplit).toHaveBeenLastCalledWith(53)
    await fireEvent.keyDown(handle, { key: 'PageUp' })
    await expect(args.onsplit).toHaveBeenLastCalledWith(66)
    // Unarmed, pressing on the keys picks nothing: there is no pick surface to press.
    await expect(canvasElement.querySelector('.pick')).toBeNull()
  },
}

/** Nothing held: the split and the left zone's tint only. */
export const Idle: Story = {
  args: { heldLeft: [], heldRight: [] },
}

/**
 * A split on a black key, C#3: the left zone takes C#3, and the split line runs up C#3's right edge
 * beside the black keys, then steps across to the C|D white edge below them.
 */
export const BlackKeySplit: Story = {
  args: { split: 61, heldLeft: [], heldRight: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('img', { name: /^Keys: split C#3/ })).toBeInTheDocument()
    await expect(canvasElement.querySelector('.split')).toHaveAttribute('data-step', '1')
    await expect(canvasElement.querySelector('.split .join')).not.toBeNull()
    await expect(canvas.getByRole('slider', { name: /^Split point/ })).toHaveAttribute('aria-valuetext', 'C#3')
  },
}

/**
 * Dragging the split line: past a few px the key under the pointer (at the black keys' height, so
 * black keys by position) becomes the split. Here from C3 to F#2, a black key.
 */
export const Drag: Story = {
  args: { split: 60, heldLeft: [], heldRight: [] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const handle = canvas.getByRole('slider', { name: /^Split point/ })
    const strip = canvas.getByRole('img', { name: /^Keys:/ })
    const width = args.width ?? 1392
    const keys = layout(args.range ?? range61, width - 2, 60, [], [], 'r1')
    const fs2 = keys.blacks.find((key) => key.note === 54)?.x ?? 0
    const c3 = keys.splitX ?? 0
    await fireEvent.pointerDown(handle, at(strip, width, c3, 40))
    await fireEvent.pointerMove(handle, at(strip, width, fs2, 40))
    await fireEvent.pointerUp(handle, at(strip, width, fs2, 40))
    await expect(args.onsplit).toHaveBeenLastCalledWith(54)
    // A drag is not a click: it doesn't arm the pick.
    await expect(args.onpick).not.toHaveBeenCalled()
    // A click on the handle (no movement) arms it.
    await fireEvent.pointerDown(handle, at(strip, width, c3, 40))
    await fireEvent.pointerUp(handle, at(strip, width, c3, 40))
    await expect(args.onpick).toHaveBeenLastCalledWith(true)
  },
}

/**
 * Armed (`picking`): a 2px teal ring round the keys and a crosshair. Pressing a key makes it the
 * split (F#2 here, a black key, pressed up top; G2 below it, its white key) and lifting disarms.
 * Esc disarms too.
 */
export const Armed: Story = {
  args: { split: 60, picking: true, heldLeft: [], heldRight: [] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const strip = canvas.getByRole('img', { name: /^Keys:/ })
    const pick = canvasElement.querySelector('.pick') as HTMLElement
    await expect(pick).not.toBeNull()
    await expect(canvas.getByRole('slider', { name: /click a key to set it/ })).toBeInTheDocument()
    const width = args.width ?? 1392
    const keys = layout(args.range ?? range61, width - 2, 60, [], [], 'r1')
    const fs2 = keys.blacks.find((key) => key.note === 54)?.x ?? 0
    await fireEvent.pointerDown(pick, at(strip, width, fs2, 10))
    await expect(args.onsplit).toHaveBeenLastCalledWith(54)
    await fireEvent.pointerUp(pick, at(strip, width, fs2, 10))
    await expect(args.onpick).toHaveBeenLastCalledWith(false)
    await fireEvent.pointerDown(pick, at(strip, width, fs2 + 2, 48))
    await expect(args.onsplit).toHaveBeenLastCalledWith(55)
    await fireEvent.keyDown(window, { key: 'Escape' })
    await expect(args.onpick).toHaveBeenLastCalledWith(false)
  },
}

/** Locked: the handle is faded, the arrows and a drag ask for nothing, and the pick won't arm. */
export const Locked: Story = {
  args: { splitLocked: true, picking: true, heldLeft: [], heldRight: [] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const handle = canvas.getByRole('slider', { name: 'Split point (locked)' })
    await expect(handle).toHaveAttribute('aria-disabled', 'true')
    await expect(canvasElement.querySelector('.pick')).toBeNull()
    handle.focus()
    await fireEvent.keyDown(handle, { key: 'ArrowRight' })
    await fireEvent.keyDown(handle, { key: 'Enter' })
    await expect(args.onsplit).not.toHaveBeenCalled()
    await expect(args.onpick).not.toHaveBeenCalled()
  },
}

/** No split: one zone, every held key in the right part's hue (here Right 2, with a black key). */
export const NoSplit: Story = {
  args: { split: null, heldLeft: [], heldRight: [60, 63, 67], rightPart: 'r2' },
}

/** A 49-key keyboard at a narrower width, split B2, held black keys in both zones. */
export const Keys49: Story = {
  args: { range: range49, split: 59, heldLeft: [49, 54, 58], heldRight: [73, 78], rightPart: 'r3', width: 960 },
}

/** The full 61 keys with Right 1 playing high, split at C3. */
export const HighSplit: Story = {
  args: { range: range61, split: 60, heldLeft: [48, 52, 55], heldRight: [84, 88, 91] },
}

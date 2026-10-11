import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { createRawSnippet, type ComponentProps } from 'svelte'
import { expect, fn } from 'storybook/test'
import FaderCell from './FaderCell.svelte'
import KnobCell from './KnobCell.svelte'

/**
 * The band's controls as Golden trees, each at the size the Stage gives one cell; each fills its
 * cell. A knob: the name and the value in two label-height bands off its foot (one line each), the
 * dial in all the rest. A fader grows like a stem: the
 * track takes everything the foot doesn't, the value tight under it (fib-3), then the name (fib-5);
 * as a whole Stage strip it also takes the part's sound in a band off its top, and optionally its
 * lamp in a band off its foot (fib-8). The overlay draws the cuts and reports what doesn't fit.
 */
const meta = {
  title: 'Golden/Controls',
  component: KnobCell,
  parameters: { layout: 'centered' },
  args: {
    tipAction: fn(),
    onpress: fn(),
    onstep: fn(),
  },
} satisfies Meta<typeof KnobCell>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One knob cell, its cuts drawn: two label-height bands off its foot (the name, then the value
 * over it) and the dial in the rest, as big as the cell allows. The name is one line: when
 * "Retrig rate" doesn't fit, the knob's code ("RtgRate") is shown, the full name in its title.
 */
export const Knob: Story = {
  args: {
    label: 'Retrig rate',
    code: 'RtgRate',
    value: '1/8',
    unit: '',
    fraction: 0.4,
    unused: false,
    tip: 'knob.style.retrigRate',
    overlay: true,
  },
  argTypes: {
    label: { control: 'text' },
    code: { control: 'text' },
    value: { control: 'text' },
    unit: { control: 'text' },
    fraction: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    unused: { control: 'boolean' },
    tip: { control: 'text' },
    overlay: { control: 'boolean' },
  },
  play: async ({ canvasElement }) => {
    // The cell fills its slot: no box fitted to a shape.
    await expect(canvasElement.querySelector('[data-golden-fit][data-shape]')).toBeNull()
    // Two label-height bands off the foot: the name, then the value; the dial takes the rest.
    const [outer, inner] = canvasElement.querySelectorAll('[data-golden-slots="cut"][data-band="label-height"][data-from="bottom"]')
    await expect(outer?.children.length).toBe(2)
    await expect(inner?.children.length).toBe(2)
    await expect(inner?.children[0]?.textContent?.trim()).toBe('1/8')
    await expect(inner?.children[1]?.querySelector('button svg')).not.toBeNull()
    // The name is one line: the full name, or (when it doesn't fit) the short code with the full
    // name in its title.
    const name = outer?.children[0] as HTMLElement
    const shown = name.querySelector('span')?.textContent?.trim()
    await expect(['Retrig rate', 'RtgRate']).toContain(shown)
    if (shown === 'RtgRate') await expect(name).toHaveAttribute('title', 'Retrig rate')
    const overlay = canvasElement.querySelector('[data-golden="overlay"]')
    await expect(overlay).not.toBeNull()
  },
}

/**
 * One knob cell as the golden Stage draws it (round 8: `dial="fib"`, `shorten="word"`): the dial as
 * big as the cell allows less a fib-13 gutter, the name and value lines a fib-5 short of the
 * neighbours; a name that doesn't fit shows its first word ("Retrig rate" → "Retrig"), the full
 * name in its title, never the code and never a word cut short with a full stop.
 */
export const KnobStage: Story = {
  name: 'Knob › Stage dial, short name',
  args: { ...Knob.args, label: 'Retrig rate', code: 'RtgRate', value: '1/16', fraction: 0.6, dial: 'fib', shorten: 'word' },
  argTypes: {
    ...Knob.argTypes,
    dial: { control: 'inline-radio', options: ['fill', 'phi', 'fib'] },
    shorten: { control: 'inline-radio', options: ['code', 'word'] },
  },
  play: async ({ canvasElement }) => {
    const [outer] = canvasElement.querySelectorAll('[data-golden-slots="cut"][data-band="label-height"][data-from="bottom"]')
    const name = outer?.children[0] as HTMLElement
    const shown = name.querySelector('span')?.textContent?.trim() ?? ''
    // Never the code, never a full stop: the name, or its first word.
    await expect(['Retrig rate', 'Retrig']).toContain(shown)
    if (shown === 'Retrig') await expect(name).toHaveAttribute('title', 'Retrig rate')
  },
}

/**
 * One knob cell as the golden Stage draws it (`lines={2}`, `valueInside`): the name in a band two
 * lines deep, wrapping onto the second line rather than shortening to its code, and the value in
 * the ring's hollow, so the dial grows into the value's band.
 */
export const KnobTwoLines: Story = {
  name: 'Knob › two lines, value inside',
  args: { ...Knob.args, lines: 2, valueInside: true },
  argTypes: { ...Knob.argTypes, lines: { control: 'inline-radio', options: [1, 2] }, valueInside: { control: 'boolean' } },
  play: async ({ canvasElement }) => {
    // One band off the foot, two lines deep: the name; the dial takes all the rest.
    const band = canvasElement.querySelector('[data-golden-slots="cut"][data-band="label-lines-2"][data-from="bottom"]')
    await expect(band?.children.length).toBe(2)
    await expect(canvasElement.querySelector('[data-band="label-height"]')).toBeNull()
    // The full name, never the code: two lines hold "Retrig rate".
    const name = band?.children[0] as HTMLElement
    await expect(name.querySelector('span')?.textContent?.trim()).toBe('Retrig rate')
    await expect(name).not.toHaveAttribute('title')
    // The value sits in the dial, with the ring.
    const dial = band?.children[1] as HTMLElement
    await expect(dial.querySelector('.ring-value')?.textContent?.trim()).toBe('1/8')
    await expect(dial.querySelector('button svg')).not.toBeNull()
  },
}

/** One fader cell, its cuts drawn: a stem of the track, then the value and the strip's name close under it. */
export const Fader: StoryObj<typeof FaderCell> = {
  // The meta's knob actions (onpress, onstep) aren't the fader's.
  render: (args) => {
    const { onpress: _press, onstep: _step, ...props } = args as Record<string, unknown>
    return { Component: FaderCell, props: props as ComponentProps<typeof FaderCell> }
  },
  args: {
    name: 'Right 1 · Stage Grand, level 90',
    label: 'R1 Piano',
    value: '90',
    level: 90,
    meter: 0.62,
    meter2: 0.58,
    peak: 0.7,
    kind: 'part',
    hue: 'r1',
    layered: false,
    tip: 'mixer.panel.right1',
    overlay: true,
    onlevel: fn(),
  },
  argTypes: {
    name: { control: 'text' },
    label: { control: 'text' },
    value: { control: 'text' },
    level: { control: { type: 'range', min: 0, max: 127, step: 1 } },
    meter: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    meter2: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    peak: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    kind: { control: 'select', options: ['part', 'group', 'master', 'off', 'parked'] },
    hue: { control: 'select', options: ['r1', 'r2', 'r3', 'l', 'a', 't2', 't'] },
    layered: { control: 'boolean' },
    tip: { control: 'text' },
    overlay: { control: 'boolean' },
  },
  play: async ({ canvasElement }) => {
    const stem = expectStem(canvasElement)
    // No sound, no lamp: the stem is the whole cell, and it draws the overlay.
    await expect(stem.closest('[data-golden="overlay"]')).not.toBeNull()
    await expect(canvasElement.querySelector('[data-band="tab-block"]')).toBeNull()
    await expect(canvasElement.querySelector('[data-band="control-height"]')).toBeNull()
  },
}

/**
 * Asserts the strip's stem: the name and the value in label-height bands off the foot, with
 * internodes of fib-5 and fib-3, and the track (the Fader) taking the rest. No phi steps and no
 * fitted fader box: those left the dead bands. Returns the name band's slots.
 */
function expectStem(canvasElement: HTMLElement): Element {
  expect(canvasElement.querySelector('[data-golden-slots="steps"]')).toBeNull()
  expect(canvasElement.querySelector('[data-golden-fit][data-shape]')).toBeNull()
  const stem = canvasElement.querySelector('[data-golden-slots="cut"][data-band="label-height"][data-from="bottom"]')
  expect(stem).not.toBeNull()
  expect(stem?.getAttribute('style')).toContain('--fib-5')
  expect(stem?.children[0]?.classList.contains('name')).toBe(true)
  const value = stem?.children[1]?.querySelector(':scope > * > [data-golden-slots="cut"][data-band="label-height"]')
  expect(value).not.toBeNull()
  expect(value?.getAttribute('style')).toContain('--fib-3')
  expect(value?.children[0]?.textContent?.trim()).toBe('90')
  expect(value?.children[1]?.querySelector('[data-kind]')).not.toBeNull()
  return stem as Element
}

/**
 * A whole Stage strip, as the golden Stage draws it (Option C): the part's sound in a tab-block
 * band off the top (it opens the part's sound list), the track running long under it, the value
 * and the name button (it opens Channel) close under the track, and the strip's lamp in a
 * control-height band off the foot, fib-8 below the name.
 */
export const Strip: StoryObj<typeof FaderCell> = {
  // The lamp is content (a snippet), not an arg: a plain lamp button stands in for the LampButton.
  render: (args) => {
    const { onpress: _press, onstep: _step, ...props } = args as Record<string, unknown>
    const lamp = createRawSnippet(() => ({ render: () => '<button type="button" aria-pressed="true">On</button>' }))
    return { Component: FaderCell, props: { ...props, lamp } as ComponentProps<typeof FaderCell> }
  },
  args: {
    ...Fader.args,
    label: 'Right 1',
    sound: 'Stage Grand',
    soundName: 'Right 1 sound: Stage Grand. Opens the quick sound list',
    soundTip: 'launchkey.fader_sound',
    openName: 'Right 1, Stage Grand: open Channel',
    openTip: 'mixer.strip.select',
    edited: true,
    onsound: fn(),
    onopen: fn(),
  },
  argTypes: {
    ...Fader.argTypes,
    sound: { control: 'text' },
    soundName: { control: 'text' },
    soundTip: { control: 'text' },
    openName: { control: 'text' },
    openTip: { control: 'text' },
    edited: { control: 'boolean' },
  },
  play: async ({ args, canvasElement }) => {
    // sound (top) → lamp (bottom, fib-8) → the stem, each the rest of the band before it.
    const top = canvasElement.querySelector('[data-golden-slots="cut"][data-band="tab-block"][data-from="top"]')
    await expect(top?.closest('[data-golden="overlay"]')).not.toBeNull()
    const foot = top?.children[1]?.querySelector(':scope > * > [data-golden-slots="cut"][data-band="control-height"]')
    await expect(foot?.getAttribute('data-from')).toBe('bottom')
    await expect(foot?.getAttribute('style')).toContain('--fib-8')
    await expect(foot?.children[0]?.querySelector('button[aria-pressed]')).not.toBeNull()
    const stem = expectStem(canvasElement)
    await expect(foot?.children[1]?.contains(stem)).toBe(true)
    const sound = canvasElement.querySelector<HTMLButtonElement>('button[aria-label^="Right 1 sound"]')
    sound?.click()
    await expect(args.onsound).toHaveBeenCalled()
    canvasElement.querySelector<HTMLButtonElement>('button[aria-label="Right 1, Stage Grand: open Channel"]')?.click()
    await expect(args.onopen).toHaveBeenCalled()
  },
}

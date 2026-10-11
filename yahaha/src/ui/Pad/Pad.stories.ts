import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, within } from 'storybook/test'
import Pad from './Pad.svelte'

/**
 * One band pad in the state language: the label centred in the pad in its hue, inside a 1px outline
 * of it; no pad number on the face (`index` only feeds the default accessible name). Faces: idle
 * (the outline), dark (absent: the pad's own hue at reduced strength, no fill), playing and running
 * (solid fill, `--on-ink` label), next and armed (2px ring, faint fill, the label in `--t`, a small
 * NEXT or ARMED tag at the top). `lit` is the flash phase of next and armed.
 */
const meta = {
  title: 'Primitives/Pad',
  component: Pad,
  parameters: { layout: 'centered' },
  args: {
    label: 'Main B',
    index: '10',
    family: 'main',
    state: 'playing',
    lit: true,
    tip: 'section.lamps',
    onpress: fn(),
    tipAction: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    index: { control: 'text' },
    family: { control: 'select', options: ['intro', 'main', 'ending', 'brk', 'fill', 'util', 'start', 'r1', 'r2', 'r3', 'l'] },
    state: { control: 'select', options: ['idle', 'dark', 'playing', 'next', 'armed', 'running'] },
    lit: { control: 'boolean' },
    tagCorner: { control: 'boolean' },
    transport: { control: 'boolean' },
    name: { control: 'text' },
    tip: { control: 'text' },
  },
} satisfies Meta<typeof Pad>

export default meta
type Story = StoryObj<typeof meta>

/** Main B on the board, playing: a solid fill of the Main hue, the label centred in `--on-ink`. */
export const Board: Story = {
  args: { name: 'Main B, playing' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Main B')).toBeInTheDocument()
    await expect(canvas.queryByText('10')).toBeNull()
  },
}

/** An idle section pad: Intro I in its hue, inside a 1px outline of it, on no fill. */
export const Idle: Story = { args: { label: 'Intro I', index: '1', family: 'intro', state: 'idle' } }

/**
 * A pad the style lacks: Intro III, a 1px outline and the label in the Intro hue at reduced
 * strength (`--absent-intro`), no fill: a faded yellow pad, fainter than `Idle`, never grey.
 */
export const Dark: Story = {
  args: { label: 'Intro III', index: '3', family: 'intro', state: 'dark', name: 'Intro III (not in this style)' },
  play: async ({ canvasElement }) => {
    const pad = within(canvasElement).getByRole('button', { name: 'Intro III (not in this style)' })
    await expect(pad).toHaveAttribute('data-hue', 'absent-intro')
    await expect(pad).toHaveAttribute('data-contrast', 'dim')
  },
}

/** An absent utility pad: the neutral hue at reduced strength (`--absent-neutral`). */
export const DarkUtility: Story = {
  args: { label: 'Auto Fill', index: '12', family: 'util', state: 'dark', name: 'Auto Fill (unavailable)' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-hue', 'absent-neutral')
  },
}

/** Queued: Main C, a 2px ring and a faint fill of the hue, a small NEXT tag at the top; the label stays centred. */
export const Next: Story = {
  args: { label: 'Main C', index: '11', state: 'next', name: 'Main C, queued after bar 4 (flashing)' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('NEXT')).toBeInTheDocument()
    await expect(canvas.queryByText('11')).toBeNull()
  },
}

/**
 * Queued with `tagCorner` (the golden Stage): NEXT is a small solid tag in the pad's top-right
 * corner, so the pad reads one line, "Main C", not NEXT stacked over it.
 */
export const NextCorner: Story = {
  args: { label: 'Main C', index: '11', state: 'next', tagCorner: true, name: 'Main C, queued after bar 4 (flashing)' },
  play: async ({ canvasElement }) => {
    const tag = within(canvasElement).getByText('NEXT')
    await expect(tag).toHaveClass('corner')
  },
}

/** Queued, the flash's off phase: the fill gone, the 1px outline; the words stay. */
export const NextUnlit: Story = {
  args: { label: 'Main C', index: '11', state: 'next', lit: false, name: 'Main C, queued after bar 4 (flashing)' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('NEXT')).toBeInTheDocument()
  },
}

/** Armed: Ending I, the 2px ring and faint fill with a glow, ARMED. */
export const Armed: Story = {
  args: { label: 'Ending I', index: '5', family: 'ending', state: 'armed', name: 'Ending I, armed (pulsing)' },
}

/** A utility pad: Sync Start, neutral outline and label. */
export const Utility: Story = {
  args: { label: 'Sync Start', index: '4', family: 'util', state: 'idle' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-hue', 'neutral')
  },
}

/** A lit utility pad: Auto Fill on, a solid neutral fill with the label in `--on-ink`. */
export const UtilityOn: Story = { args: { label: 'Auto Fill', index: '12', family: 'util', state: 'playing' } }

/** Start / Stop running: a solid `--ok` fill. */
export const Running: Story = {
  args: { label: 'Start / Stop', index: '16', family: 'start', state: 'running', name: 'Start / Stop, running (pad 16)' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-hue', 'ok')
  },
}

/**
 * A transport pad (`transport`, the golden Stage's Sections bank): Start / Stop running in the hue
 * of time, as its twin on the screen's transport, not green.
 */
export const TransportRunning: Story = {
  args: {
    label: 'Start / Stop',
    index: '16',
    family: 'start',
    state: 'running',
    transport: true,
    name: 'Start / Stop, running (pad 16)',
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-hue', 'transport')
  },
}

/** Sync Start armed on a transport pad: the hue of time's 2px ring and faint fill, ARMED. */
export const TransportArmed: Story = {
  args: { label: 'Sync Start', index: '4', family: 'util', state: 'armed', transport: true, name: 'Sync Start, armed' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-hue', 'transport')
  },
}

/** A pad the engine lights blue (a stored Quick Rack): the `r1` hue, solid when on; part hues
 * have no glow token, so none. */
export const PartHue: Story = {
  args: { label: 'QUICK 1', index: '1', family: 'r1', state: 'playing', tip: 'padpage.racks' },
  play: async ({ canvasElement }) => {
    const pad = within(canvasElement).getByRole('button')
    await expect(pad).toHaveAttribute('data-hue', 'r1')
    await expect(pad.style.getPropertyValue('--glow')).toBe('none')
  },
}

/** A part-hue pad that isn't available: the hue's absent token. */
export const PartHueDark: Story = {
  args: { label: 'BANK -', index: '13', family: 'r3', state: 'dark', tip: 'padpage.racks' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('data-hue', 'absent-r3')
  },
}

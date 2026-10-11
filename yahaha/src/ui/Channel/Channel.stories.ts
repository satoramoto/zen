import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import Channel from './Channel.svelte'
import { channelBoard, channelStylePart } from './Channel.fixtures'
import ChannelPlayground from './ChannelPlayground.svelte'

/**
 * The Channel page: one part's channel, in the Stage's display box (1392 × 288). The parts list on
 * the left (the open part the solid block in its hue); on the right the part's name, the group tabs
 * (Mix, EQ & Tone, Compressor, Inserts), the part's CPU and ◀ ▶; under them the chosen group. The
 * right side takes the open part's hue; a Style part draws in the neutral ink, with no pan, tone or
 * play. Bars drag sideways (Shift for fine), scroll, step with the arrows and reset with a
 * double-click. The `Stage` and `Playground` stories show the page on the Stage at 1440 × 900.
 */
const meta = {
  title: 'Screens/Channel',
  component: Channel,
  parameters: { layout: 'padded' },
  args: {
    data: channelBoard,
    tipAction: fn(),
    onchange: fn(),
    onpart: fn(),
    ontab: fn(),
    onsound: fn(),
    onedit: fn(),
  },
  argTypes: {
    data: { control: 'object' },
  },
} satisfies Meta<typeof Channel>

export default meta
type Story = StoryObj<typeof meta>

/** Right 1 open on the Mix tab: Stage Grand on the fake plugin, sends 1–4 there, 5 and 6 not. */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Right 1' })).toBeTruthy()
    const level = canvas.getByRole('slider', { name: 'Level' })
    await expect(level.getAttribute('aria-valuetext')).toBe('Level 90')
    level.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onchange).toHaveBeenCalledWith({ type: 'level', value: 91 })
    await userEvent.click(canvas.getByRole('button', { name: 'Next part (R2)' }))
    await expect(args.onpart).toHaveBeenCalledWith(1)
    await userEvent.click(canvas.getByRole('button', { name: 'Previous part (Phrase 2)' }))
    await expect(args.onpart).toHaveBeenCalledWith(11)
    await userEvent.click(canvas.getByRole('tab', { name: 'Compressor' }))
    await expect(args.ontab).toHaveBeenCalledWith('comp')
    await userEvent.click(canvas.getByRole('button', { name: /^Part 2 of 12/ }))
    await expect(args.onpart).toHaveBeenCalledWith(1)
  },
}

/** The EQ & Tone tab: the EQ, the tone offsets and how the part plays. */
export const EqTone: Story = {
  name: 'EQ & Tone',
  args: { data: { ...channelBoard, tab: 'eqTone' } },
}

/** The Compressor tab: Punchy, edited. */
export const Compressor: Story = {
  args: { data: { ...channelBoard, tab: 'comp' } },
}

/** The Inserts tab: a rotary in slot 1, slot 2 empty, Rotary fast on. */
export const Inserts: Story = {
  args: { data: { ...channelBoard, tab: 'inserts' } },
}

/** Rhythm 1 open: a Style part, in the neutral ink; no pan, tone or play; the style's insert. */
export const StylePart: Story = {
  args: { data: channelStylePart },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Rhythm 1' })).toBeTruthy()
    await expect(canvas.getByRole('slider', { name: 'Pan' }).getAttribute('aria-disabled')).toBe('true')
  },
}

/** No synth: the CPU reads "—". */
export const NoSynth: Story = {
  args: { data: { ...channelBoard, cpu: null } },
}

/** The page on the Stage at 1440 × 900, the Channel tab chosen; the band and keys as on the Stage. */
export const Stage: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => ({ Component: ChannelPlayground, props: args }),
}

/**
 * The page on the Stage, interactive: tabs, parts (◀ ▶ and the list), bars, lamps, the compressor
 * type, insert kinds and + Add send all respond (a story-only wrapper keeps the state).
 */
export const Playground: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => ({ Component: ChannelPlayground, props: { ...args, live: true } }),
}

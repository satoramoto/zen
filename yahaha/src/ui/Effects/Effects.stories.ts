import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import Effects from './Effects.svelte'
import EffectsPlayground from './EffectsPlayground.svelte'
import { chorusBus, effectsBoard, effectsMasterLoudness, phaserBus, reverbBus } from './Effects.fixtures'

const CALLBACKS: Record<string, string[]> = {
  SendList: ['onopen', 'onadd'],
  BusEditor: ['onbus'],
  MasterEditor: ['onmaster'],
  InsertsEditor: ['oninserts'],
  EffectsMix: ['onmix'],
}
const actions = Object.fromEntries(Object.values(CALLBACKS).flatMap((names) => names.map((name) => [name, fn()])))
const on = (category: string, names: string[]) => Object.fromEntries(names.map((name) => [name, { table: { category } }]))

/**
 * The Effects page in the Stage's display box (1392 × 288): the list at the left (the sends with
 * their type and return, Add send, then the style's inserts and the Master), the open one's editor
 * in the middle, the mix switches at the right. A send's editor: its source and type in the
 * header, its switches and parameters at the left, its return, band and pad sends and each
 * keyboard part's send at the right, a note on what moves it. Every value is a readout: drag it
 * sideways, scroll it or step it with the arrow keys; a double-click puts it back.
 */
const meta = {
  title: 'Screens/Effects',
  component: Effects,
  parameters: { layout: 'centered' },
  args: { data: effectsBoard, tipAction: fn(), ...actions },
  argTypes: {
    data: { control: 'object', table: { category: 'Effects' } },
    ...Object.assign({}, ...Object.entries(CALLBACKS).map(([category, names]) => on(category, names))),
  },
} satisfies Meta<typeof Effects>

export default meta
type Story = StoryObj<typeof meta>

/** The board's moment: send 3, the Delay, open, tempo sync on; the chorus kept by the rack; a Phaser added. */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('region', { name: 'Effects page' })).toBeInTheDocument()
    await expect(canvas.getByRole('region', { name: 'Delay, send 3' })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /^Send 1, Reverb/ }))
    await expect(args.onopen).toHaveBeenCalledWith(0)
    await userEvent.click(within(canvas.getByRole('navigation', { name: 'Effects' })).getByRole('button', { name: /^Master/ }))
    await expect(args.onopen).toHaveBeenCalledWith('master')
    await userEvent.click(canvas.getByRole('button', { name: /^Add a send effect/ }))
    await expect(args.onadd).toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: /Rotary speaker fast/ }))
    await expect(args.onmix).toHaveBeenCalledWith({ type: 'rotaryFast' })
  },
}

/** Send 1, the Reverb, following the style. */
export const Reverb: Story = { args: { data: { ...effectsBoard, bus: 0, editor: reverbBus } } }

/** Send 2, the Chorus, its type kept by the rack. */
export const Chorus: Story = { args: { data: { ...effectsBoard, bus: 1, editor: chorusBus } } }

/** Send 4, an added Phaser: a kind picker and Remove, no source, no band or pad sends, no knob codes. */
export const AddedSend: Story = { args: { data: { ...effectsBoard, bus: 3, editor: phaserBus } } }

/** The Master Compressor and EQ (the EQ on, Loudness). */
export const Master: Story = {
  args: { data: { ...effectsBoard, bus: 'master', editor: null, master: effectsMasterLoudness, mix: { ...effectsBoard.mix, eqOn: true } } },
}

/** The style's insertion effects, each Style part's on/off and amount. */
export const Inserts: Story = { args: { data: { ...effectsBoard, bus: 'inserts', editor: null } } }

/** Interactive: open any row, move any value, add and remove sends, switch the mix. */
export const Playground: Story = {
  render: (args) => ({ Component: EffectsPlayground, props: args }),
}

/** The page in the app's place: the Stage at 1440 × 900 with Effects in its display box, interactive. */
export const OnStage: Story = {
  name: 'On stage',
  parameters: { layout: 'fullscreen' },
  render: (args) => ({ Component: EffectsPlayground, props: { ...args, stage: true } }),
}

import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { stageBoard } from '../Stage/Stage.fixtures'
import {
  looperBoard,
  looperEmpty,
  looperLoopArmed,
  looperLong,
  looperLongStopped,
  looperRecArmed,
  looperRecording,
  looperStopped,
} from './Looper.fixtures'
import LooperScreen from './LooperScreen.svelte'

/** The Stage's callbacks, as actions (they log in the Actions panel), grouped under their component. */
const STAGE_CALLBACKS: Record<string, string[]> = {
  AppBar: ['onchoose', 'onhealth'],
  SectionRow: ['onstartstop', 'onaccomp', 'onsyncstart', 'onreset', 'onfillup', 'onfilldown', 'onfade', 'onmetronome', 'onpanic', 'onhelp'],
  FaderBank: ['onchoosePage', 'onchooseLayer', 'onlevel', 'onlamp', 'onlamplong'],
  KnobBank: ['onknobpage', 'onknobpress', 'onstep'],
  PadBank: ['onpadbank', 'onpadpress'],
  StatusLine: ['onclear'],
  Looper: ['onlooper'],
}

const actions = Object.fromEntries(Object.values(STAGE_CALLBACKS).flatMap((names) => names.map((name) => [name, fn()])))

const STAGE_CONTROLS = ['appBar', 'sectionRow', 'faders', 'knobs', 'pads', 'status', 'keys']

/**
 * The Looper page tab at the app's 1440 × 900: the Stage with the Chord Looper in its display box
 * (1392 × 288); the app bar (Looper chosen), the section row, the band, the status line and the keys
 * stay. No now-playing block: the section row and the app bar carry what plays.
 *
 * - **Header:** "Chord Looper", the bank's name, New bank, Load… (the bank files) and Save as… (an
 *   inline name field; Overwrite when another bank has the name).
 * - **Lane:** the loop bar by bar, eight at a time: each bar's number over a 2px line, its chords
 *   at the large size. The current bar and its playhead wear the state's face.
 * - **Rec / Stop and On / Off** with their Launchkey buttons under them, the five-state readout and
 *   a line saying what happens next.
 * - **Memories 1–8:** the loaded one the white chosen block, the one taking over at the next bar a
 *   lime ring. Memory and Clear latch (lime), then a number stores or clears.
 *
 * One face per state everywhere: recording red, playing lime, armed an outline in the hue it waits
 * for, stopped white, empty plain off. `looper` is the page's data; every press goes out through
 * `onlooper` as a change.
 */
const meta = {
  title: 'Screens/Looper',
  component: LooperScreen,
  parameters: { layout: 'fullscreen' },
  args: {
    ...stageBoard,
    appBar: { ...stageBoard.appBar, chosen: 'looper' },
    looper: looperBoard,
    tipAction: fn(),
    ...actions,
  },
  argTypes: {
    looper: { control: 'object', table: { category: 'Looper' } },
    ...Object.fromEntries(STAGE_CONTROLS.map((name) => [name, { control: 'object', table: { category: 'Stage' } }])),
    ...Object.fromEntries(
      Object.entries(STAGE_CALLBACKS).flatMap(([category, names]) => names.map((name) => [name, { table: { category } }])),
    ),
  },
} satisfies Meta<typeof LooperScreen>

export default meta
type Story = StoryObj<typeof meta>

/** The board: looping bar 3 of 8, lime current bar and playhead; memory 1 loaded. */
export const Looping: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Chord Looper' })).toBeInTheDocument()
    const lane = canvas.getByRole('list', { name: /The loop/ })
    await expect(within(lane).getAllByRole('listitem')).toHaveLength(8)
    await expect(within(lane).getByRole('listitem', { current: true })).toHaveAccessibleName('Bar 3: Am7')
    await expect(within(lane).getByRole('listitem', { name: /^Bar 7/ })).toHaveAccessibleName('Bar 7: Dm7, G on beat 3')
    await expect(canvas.getByRole('button', { name: 'On / Off' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(canvas.getByRole('button', { name: 'Rec / Stop' }))
    await expect(args.onlooper).toHaveBeenCalledWith({ type: 'rec' })
    await userEvent.click(canvas.getByRole('button', { name: /^Memory 2: CLD_002/ }))
    await expect(args.onlooper).toHaveBeenCalledWith({ type: 'memory', index: 1 })
    await userEvent.click(canvas.getByRole('button', { name: /^Memory: store/ }))
    await expect(args.onlooper).toHaveBeenCalledWith({ type: 'pick', pick: 'store' })
  },
}

/** Recording bar 3 while the band plays: Rec / Stop solid red, the current bar red. */
export const Recording: Story = {
  args: { looper: looperRecording },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Rec / Stop' })).toHaveAttribute('aria-pressed', 'true')
    const lane = canvas.getByRole('list', { name: /The loop/ })
    await expect(within(lane).getByRole('listitem', { current: true })).toHaveTextContent('Rec')
    // While recording, a memory can't be loaded.
    await expect(canvas.getByRole('button', { name: /^Memory 1:/ })).toHaveAttribute('aria-disabled', 'true')
  },
}

/** Rec / Stop pressed: a red ring on it and around bar 1 until the next bar line. */
export const RecArmed: Story = {
  name: 'Rec armed',
  args: { looper: looperRecArmed },
}

/** On / Off pressed: a lime ring on it and around bar 1 until the next bar line. */
export const LoopArmed: Story = {
  name: 'Loop armed',
  args: { looper: looperLoopArmed },
}

/** A loop in it, not playing, the band stopped: every bar white. */
export const Stopped: Story = {
  args: { looper: looperStopped, sectionRow: { ...stageBoard.sectionRow, running: false } },
}

/** Nothing recorded and a new bank with no file: dashes in the lane, every memory empty. */
export const Empty: Story = {
  args: { looper: looperEmpty, sectionRow: { ...stageBoard.sectionRow, running: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('not saved to a file')).toBeInTheDocument()
    const readout = canvas.getByRole('list', { name: 'Loop state' })
    await expect(within(readout).getByText('Empty')).toHaveAttribute('aria-current', 'true')
    await expect(canvas.queryByRole('listitem', { current: true, name: /^Bar/ })).toBeNull()
  },
}

/** Sixteen bars, playing bar 11: the lane shows the window of bars 9–16. */
export const Long: Story = {
  name: 'Sixteen bars',
  args: { looper: looperLong },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/bars 9–16 of 16/)).toBeInTheDocument()
  },
}

/** Twelve bars, stopped, paged to bars 9–12 with ▶; ◀ pages back to bars 1–8. */
export const LongStopped: Story = {
  name: 'Twelve bars, stopped',
  args: { looper: looperLongStopped, sectionRow: { ...stageBoard.sectionRow, running: false } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/bars 9–12 of 12/)).toBeInTheDocument()
    const lane = canvas.getByRole('list', { name: /The loop/ })
    await expect(within(lane).getAllByRole('listitem')[0]).toHaveAccessibleName('Bar 9: Fmaj7')
    await expect(within(lane).getByRole('listitem', { name: 'Bar 13: empty' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Later bars' })).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(canvas.getByRole('button', { name: 'Earlier bars' }))
    await expect(args.onlooper).toHaveBeenCalledWith({ type: 'lanePage', first: 1 })
  },
}

/** Load… open: the bank files, the one in use the white block, then From a file… for a bank anywhere. */
export const Load: Story = {
  args: { looper: { ...looperBoard, loadOpen: true } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const menu = canvas.getByRole('menu', { name: 'Bank files' })
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Ballads' }))
    await expect(args.onlooper).toHaveBeenCalledWith({ type: 'load', path: looperBoard.banks[1].path })
    const fromFile = within(menu).getByRole('menuitem', { name: 'From a file…' })
    await expect(fromFile).toHaveAttribute('data-tip', 'looper.load_file')
    await userEvent.click(fromFile)
    await expect(args.onlooper).toHaveBeenLastCalledWith({ type: 'loadFile' })
  },
}

/** Save as… with a name another bank has: Overwrite replaces it. */
export const SaveAs: Story = {
  name: 'Save as',
  args: { looper: { ...looperBoard, saveAs: { name: 'Ballads', clash: true } } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Overwrite' }))
    await expect(args.onlooper).toHaveBeenCalledWith({ type: 'save', overwrite: true })
  },
}

/**
 * Play with the page: a story-only wrapper (`LooperPlayground.svelte`) keeps what you change and
 * runs the looper on a beat ticker (120 BPM, 4/4). Rec / Stop arms and records from the next bar
 * line; On / Off loops from the next bar line; Memory then a number stores the loop; a memory
 * picked while looping takes over at the next bar line; Load… and Save as… change the bank. Each
 * change still logs in the Actions panel.
 */
export const Playground: Story = {
  args: { playground: true } as Partial<Story['args']>,
  argTypes: { playground: { control: 'boolean', table: { category: 'Looper' } } } as Story['argTypes'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /^Clear a memory/ }))
    await userEvent.click(canvas.getByRole('button', { name: /^Clear memory 3: CLD_003/ }))
    await expect(canvas.getByRole('button', { name: /^Memory 3: empty/ })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'On / Off' }))
    await expect(canvas.getByRole('button', { name: 'On / Off' })).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(canvas.getByRole('button', { name: 'Save the bank as' }))
    await userEvent.keyboard('Ballads')
    await expect(canvas.getByRole('button', { name: 'Overwrite' })).toBeInTheDocument()
  },
}

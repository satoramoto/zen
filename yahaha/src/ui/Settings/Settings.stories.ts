import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test'
import Settings from './Settings.svelte'
import { settingsBoard } from './Settings.fixtures'
import SettingsPlayground from './SettingsPlayground.svelte'

/** Groups a callback's control under its component. */
const on = (category: string, names: string[]) =>
  Object.fromEntries(names.map((name) => [name, { table: { category } }]))

const CALLBACKS: Record<string, string[]> = {
  AppBar: ['onchoose', 'onhealth'],
  PageList: ['onpage'],
  Helpers: ['onpanic', 'onhelp'],
  SettingsChord: ['onchord'],
  SettingsStyle: ['onstyle'],
  SettingsKeyboard: ['onkeyboard'],
  SettingsPedals: ['onpedals'],
  SettingsSystem: ['onsystem'],
  SettingsLaunchkey: ['onlaunchkey'],
  StatusLine: ['onclear'],
}

const actions = Object.fromEntries(Object.values(CALLBACKS).flatMap((names) => names.map((name) => [name, fn()])))

const PAGES = ['chord', 'style', 'keyboard', 'pedals', 'system', 'launchkey']

/**
 * The Settings page at the app's 1440 × 900, in place of the Stage: the app bar (Settings chosen),
 * no transport row; the compact now-playing block over the six pages as a list (names only) with
 * Panic and help mode's ? at its foot; the open page, its sections starting at the top, each in its
 * own hue; the status line and the keys, where the split is set. Each region's data is one object
 * control; each page's changes go out through its own callback, an action grouped under its
 * component. The Controller page is the Launchkey's pad page order (its id stays `launchkey`).
 */
const meta = {
  title: 'Screens/Settings',
  component: Settings,
  parameters: { layout: 'fullscreen' },
  args: { ...settingsBoard, tipAction: fn(), ...actions },
  argTypes: {
    appBar: { control: 'object', table: { category: 'AppBar' } },
    help: { control: 'boolean', table: { category: 'Helpers' } },
    pages: { control: 'object', table: { category: 'PageList' } },
    page: { control: 'select', options: PAGES, table: { category: 'PageList' } },
    chord: { control: 'object', table: { category: 'SettingsChord' } },
    style: { control: 'object', table: { category: 'SettingsStyle' } },
    keyboard: { control: 'object', table: { category: 'SettingsKeyboard' } },
    pedals: { control: 'object', table: { category: 'SettingsPedals' } },
    system: { control: 'object', table: { category: 'SettingsSystem' } },
    launchkey: { control: 'object', table: { category: 'SettingsLaunchkey' } },
    status: { control: 'object', table: { category: 'StatusLine' } },
    keys: { control: 'object', table: { category: 'Keys' } },
    ...Object.assign({}, ...Object.entries(CALLBACKS).map(([category, names]) => on(category, names))),
  },
} satisfies Meta<typeof Settings>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The Chord & Split page: Fingered, split F#2 (locked). No transport row and no page header: the
 * chosen page in the list names it, and the page's own sections start at the top. No page keyboard
 * either: the split is set on the keys at the foot. Panic and ? sit under the page list.
 */
export const Chord: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const list = canvas.getByRole('navigation', { name: 'Settings pages' })
    await expect(within(list).getByRole('button', { name: /Chord & Split/ })).toHaveAttribute('aria-current', 'page')
    await expect(canvas.queryByRole('heading', { name: 'Chord & Split' })).toBeNull()
    await expect(canvas.queryByRole('toolbar', { name: /Transport/ })).toBeNull()
    await expect(canvas.queryByRole('button', { name: /Start/ })).toBeNull()
    await expect(canvas.getByRole('heading', { name: 'Fingering' })).toBeInTheDocument()
    await expect(canvas.getAllByRole('img', { name: /^Keys:/ })).toHaveLength(1)
    await userEvent.click(within(list).getByRole('button', { name: /System/ }))
    await expect(args.onpage).toHaveBeenCalledWith('system')
    await userEvent.click(canvas.getByRole('button', { name: /^Upper/ }))
    await expect(args.onchord).toHaveBeenCalledWith({ type: 'upper', on: true })
    await userEvent.click(canvas.getByRole('button', { name: 'Panic: all notes off' }))
    await expect(args.onpanic).toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: /Help mode/ }))
    await expect(args.onhelp).toHaveBeenCalledWith(true)
  },
}

/** The Style page open. */
export const Style: Story = {
  args: { page: 'style' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Sections' })).toBeInTheDocument()
    await userEvent.click(within(canvas.getByRole('tablist', { name: /Main timing/ })).getByRole('tab', { name: 'Immediate' }))
    await expect(args.onstyle).toHaveBeenCalledWith({ key: 'mainTiming', value: 'immediate' })
  },
}

/** The Keyboard page open: Transpose and Parameter lock. */
export const Keyboard: Story = {
  args: { page: 'keyboard' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Keyboard transpose up a semitone' }))
    await expect(args.onkeyboard).toHaveBeenCalledWith({ type: 'keyboardStep', delta: 1 })
  },
}

/** The Pedals page open. */
export const Pedals: Story = {
  args: { page: 'pedals' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('table', { name: 'Pedals' })).toBeVisible()
  },
}

/** The System page open: Audio, MIDI, Library and the theme. */
export const System: Story = {
  args: { page: 'system' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('tab', { name: 'Light' }))
    await expect(args.onsystem).toHaveBeenCalledWith({ type: 'theme', theme: 'light' })
  },
}

/** The Controller page open: the Launchkey's pad page order. */
export const Controller: Story = {
  args: { page: 'launchkey' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const list = canvas.getByRole('navigation', { name: 'Settings pages' })
    await expect(within(list).getByRole('button', { name: 'Controller' })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(canvas.getByRole('button', { name: 'Move Racks down' }))
    await expect(args.onlaunchkey).toHaveBeenCalledWith({ type: 'move', id: 'racks', delta: 1 })
  },
}

/**
 * Play with the screen: every control responds. A story-only wrapper (`SettingsPlayground.svelte`)
 * keeps what you change, seeded from the args; each change still logs in the Actions panel. The
 * split moves with − + on the page, or on the keys at the foot: drag the split line, or press "Set
 * on the keys" (or click the line) and click a key, black keys included. The lock link opens the
 * Keyboard page, where locking the split stops the keys moving it; the theme tabs switch the theme.
 */
export const Playground: Story = {
  args: { chord: { ...settingsBoard.chord, splitLocked: false } },
  render: (args) => ({ Component: SettingsPlayground, props: args }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const list = canvas.getByRole('navigation', { name: 'Settings pages' })
    await userEvent.click(canvas.getByRole('button', { name: 'Split point one key up' }))
    await expect(canvas.getByRole('img', { name: /^Keys: split G2/ })).toBeInTheDocument()
    const handle = canvas.getByRole('slider', { name: /^Split point/ })
    await expect(handle).toHaveAttribute('aria-valuetext', 'G2')
    handle.focus()
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    await expect(handle).toHaveAttribute('aria-valuetext', 'F2')
    await userEvent.click(canvas.getByRole('button', { name: /Set on the keys/ }))
    await expect(canvas.getByRole('button', { name: /Set on the keys/ })).toHaveAttribute('aria-pressed', 'true')
    await fireEvent.keyDown(window, { key: 'Escape' })
    await expect(canvas.getByRole('button', { name: /Set on the keys/ })).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(within(list).getByRole('button', { name: /Keyboard/ }))
    await expect(within(list).getByRole('button', { name: /Keyboard/ })).toHaveAttribute('aria-current', 'page')
    await expect(canvas.getByRole('heading', { name: 'Transpose' })).toBeInTheDocument()
  },
}

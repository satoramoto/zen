import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import Library from './Library.svelte'
import { instrumentsPage, libraryBoard, racksPage, soundsPage, stylesPage } from './Library.fixtures'
import LibraryPlayground from './LibraryPlayground.svelte'

/** Groups a callback's control under its component. */
const on = (category: string, names: string[]) =>
  Object.fromEntries(names.map((name) => [name, { table: { category } }]))

const CALLBACKS: Record<string, string[]> = {
  AppBar: ['onchoose', 'onhealth'],
  Library: ['onpage', 'onpanic', 'onhelp'],
  QuickRacksBar: ['onquickbank', 'onquickstore', 'onquickclear', 'onquickslot', 'onquickslotlong'],
  StatusLine: ['onclear'],
}

/** Each page's callbacks, as actions inside its object (they log in the Actions panel). */
const PAGE_CALLBACKS = {
  styles: ['onview', 'onfolder', 'onquery', 'onselect', 'onload', 'onpreview', 'onstar', 'onautopreview', 'oncancel', 'onopenfile'],
  sounds: [
    'onquery',
    'onsource',
    'onpart',
    'onclearinstrument',
    'oncategory',
    'onselect',
    'onstar',
    'onsave',
    'onsaveasopen',
    'onsaveasedit',
    'onsaveas',
    'onsaveascancel',
    'onaudition',
    'onuse',
    'oncopy',
    'onduplicate',
    'onmove',
    'onaskdelete',
    'oncanceldelete',
    'ondelete',
    'onsetcategory',
  ],
  instruments: ['onshow', 'onchoose', 'onrescan', 'onbrowse', 'onnewsound', 'onedit', 'onreplace', 'onshowracks', 'oninprocess'],
  racks: [
    'onquery',
    'onattention',
    'onnew',
    'onsave',
    'onsaveasopen',
    'onsaveasname',
    'onsaveas',
    'onsaveascancel',
    'onselect',
    'onload',
    'onrename',
    'onduplicate',
    'onaskdelete',
    'oncanceldelete',
    'ondelete',
    'onotsrack',
    'onotslink',
    'onotstiming',
  ],
}
const pageActions = (names: string[]) => Object.fromEntries(names.map((name) => [name, fn()]))

const actions = Object.fromEntries(Object.values(CALLBACKS).flatMap((names) => names.map((name) => [name, fn()])))

/**
 * The Library page at the app's 1440 × 900: the app bar (Library chosen), the section row, the page
 * (a "Library" header whose tabs pick Styles, Sounds, Instruments, Racks or Style map, over the
 * left column's compact now-playing block and Quick Racks bar, a hairline, and the chosen page),
 * the status line and the keys. Each page's data and callbacks are one object control; the frame's
 * callbacks are actions grouped under their component.
 */
const meta = {
  title: 'Screens/Library',
  component: Library,
  parameters: { layout: 'fullscreen' },
  args: {
    ...libraryBoard,
    styles: { ...stylesPage, ...pageActions(PAGE_CALLBACKS.styles) },
    sounds: { ...soundsPage, ...pageActions(PAGE_CALLBACKS.sounds) },
    instruments: { ...instrumentsPage, ...pageActions(PAGE_CALLBACKS.instruments) },
    racks: { ...racksPage, ...pageActions(PAGE_CALLBACKS.racks) },
    tipAction: fn(),
    ...actions,
  },
  argTypes: {
    appBar: { control: 'object', table: { category: 'AppBar' } },
    help: { control: 'boolean', table: { category: 'Library' } },
    pages: { control: 'object', table: { category: 'Library' } },
    page: { control: 'inline-radio', options: ['styles', 'sounds', 'instruments', 'racks', 'map'], table: { category: 'Library' } },
    quickRacks: { control: 'object', table: { category: 'QuickRacksBar' } },
    styles: { control: 'object', table: { category: 'LibraryStyles' } },
    sounds: { control: 'object', table: { category: 'LibrarySounds' } },
    instruments: { control: 'object', table: { category: 'LibraryInstruments' } },
    racks: { control: 'object', table: { category: 'LibraryRacks' } },
    status: { control: 'object', table: { category: 'StatusLine' } },
    keys: { control: 'object', table: { category: 'Keys' } },
    ...Object.assign({}, ...Object.entries(CALLBACKS).map(([category, names]) => on(category, names))),
  },
} satisfies Meta<typeof Library>

export default meta
type Story = StoryObj<typeof meta>

/** Library › Styles (Browser-Dark): Pop & Rock, Coastal Highway queued for the next bar. */
export const Styles: Story = {
  args: { page: 'styles' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('region', { name: 'Library: Styles' })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('tab', { name: 'Racks, 9' }))
    await expect(args.onpage).toHaveBeenLastCalledWith('racks')
  },
}

/** Library › Sounds (LibrarySounds-Dark): Strings, Right 2 the target, playing 41 Silk Strings. */
export const Sounds: Story = { args: { page: 'sounds' } }

/** Library › Instruments (LibraryInstruments-Dark): Sampler Deluxe chosen. */
export const Instruments: Story = { args: { page: 'instruments' } }

/** Library › Racks (LibraryRacks-Dark): Organ chosen, Sunday drive loaded and modified. */
export const Racks: Story = {
  args: { page: 'racks' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Quick Rack A2, Organ' }))
    await expect(args.onquickslot).toHaveBeenLastCalledWith(1)
  },
}

/** Style map without its page: the placeholder line (the app passes today's Style map). */
export const StyleMap: Story = { args: { page: 'map' } }

/**
 * Play with the screen: the controls respond (a story-only wrapper, `LibraryPlayground.svelte`,
 * keeps what you change; editing a control re-seeds it; every press still logs in Actions).
 *
 * - The Library page tabs switch the page.
 * - Styles: folders and the view tabs narrow the list, the filter narrows it by name or folder, a
 *   click or ↑ ↓ moves the cursor, Load (or Enter) loads it: the compact block and ● follow.
 * - Sounds: search, Source and Loads into respond; a click plays the sound on the target part.
 * - Instruments: Show filters the list; a click chooses an instrument.
 * - Racks: search narrows the list; a click chooses a rack; Load makes it the loaded rack.
 * - Quick Racks: a slot loads, Store arms, ◀ ▶ step the bank.
 */
export const Playground: Story = {
  args: { page: 'styles' },
  render: (args) => ({ Component: LibraryPlayground, props: args }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const filter = canvas.getByRole('searchbox', { name: 'Filter styles' })
    const before = canvas.getAllByRole('option').length
    await userEvent.type(filter, 'zzzz-no-such-style')
    await expect(canvas.queryAllByRole('option').length).toBeLessThan(before)
    await userEvent.click(canvas.getByRole('tab', { name: 'Sounds, 886' }))
    await expect(canvas.getByRole('region', { name: 'Library: Sounds' })).toBeInTheDocument()
  },
}

import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fireEvent, fn, within } from 'storybook/test'
import Display from './Display.svelte'
import {
  displayBoard,
  displayLongChord,
  displayLongFingering,
  displayLongStyle,
  displayPartOff,
  displayStopped,
  displaySyncStart,
  displayThreeFour,
} from './Display.fixtures'

/**
 * The Stage's display, 1392 × 300, "Poster, in thirds": harmony on the left (‹ style ›, the chord,
 * its notes and fingering), the song in the middle (the section, what's next, the tempo with + and
 * −), the parts and One Touch on the right, and the beat bar under all three. Three type sizes;
 * no boxes: every control is plain text that brightens on hover.
 */
const meta = {
  title: 'Components/Display',
  component: Display,
  parameters: { layout: 'centered' },
  args: {
    ...displayBoard,
    tipAction: fn(),
    onprev: fn(),
    onnext: fn(),
    onbrowse: fn(),
    ononetouch: fn(),
    ontempoup: fn(),
    ontempodown: fn(),
    onstyletempo: fn(),
    ontempo: fn(),
    onsound: fn(),
  },
  argTypes: {
    styleLine: { control: 'object', table: { category: 'StyleLine' } },
    nowPlaying: { control: 'object', table: { category: 'NowPlaying' } },
    soundRow: { control: 'object', table: { category: 'SoundRow' } },
  },
} satisfies Meta<typeof Display>

export default meta
type Story = StoryObj<typeof meta>

/** The board: Am7 in Main B, Main C next with the fill after bar 4, 104 BPM on beat 2, One Touch 2. */
export const Board: Story = {
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    // Each third's controls call back with what was pressed.
    await fireEvent.click(c.getByRole('button', { name: 'Next style (Track right)' }))
    await expect(args.onnext).toHaveBeenCalledOnce()
    await fireEvent.click(c.getByRole('button', { name: 'Sunday Drive Pop: open the Browser' }))
    await expect(args.onbrowse).toHaveBeenCalledOnce()
    await fireEvent.click(c.getByRole('button', { name: /^Left sound: 33 Finger Bass/ }))
    await expect(args.onsound).toHaveBeenCalledWith('left')
    await fireEvent.click(c.getByRole('button', { name: /^Apply One Touch 3/ }))
    await expect(args.ononetouch).toHaveBeenCalledWith(3)
    // Tempo: + from the keyboard is one step; the number's arrow keys, scroll and double-click.
    await fireEvent.click(c.getByRole('button', { name: 'Tempo up (Scene Launch)' }), { detail: 0 })
    await expect(args.ontempoup).toHaveBeenNthCalledWith(1, true)
    await expect(args.ontempoup).toHaveBeenNthCalledWith(2, false)
    const tempo = c.getByRole('spinbutton')
    await expect(tempo).toHaveAttribute('aria-valuenow', '104')
    await fireEvent.keyDown(tempo, { key: 'ArrowUp' })
    await expect(args.ontempo).toHaveBeenLastCalledWith(105)
    await fireEvent.wheel(tempo, { deltaY: 100 })
    await expect(args.ontempo).toHaveBeenLastCalledWith(103)
    await fireEvent.dblClick(tempo)
    await expect(args.onstyletempo).toHaveBeenCalledOnce()
    // The beat bar: a segment per beat, beat 2 lit.
    const beats = canvasElement.querySelectorAll('[data-state]')
    await expect([...beats].map((b) => b.getAttribute('data-state'))).toEqual(['past', 'current', 'future', 'future'])
    await expect(c.getByText('then Main C · fill after bar 4')).toBeTruthy()
  },
}

/** Stopped with the last chord held, Coastal Highway queued, a clean rack: "Stopped", the beat bar dim. */
export const Stopped: Story = {
  args: { ...displayStopped },
  play: async ({ canvasElement }) => {
    const states = [...canvasElement.querySelectorAll('[data-state]')].map((b) => b.getAttribute('data-state'))
    await expect(states).toEqual(['future', 'future', 'future', 'future'])
    await expect(within(canvasElement).getByText('Stopped')).toBeTruthy()
  },
}

/** Sync Start armed, Intro II armed: the band starts on the first chord. */
export const SyncStartArmed: Story = {
  args: { ...displaySyncStart },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Sync Start armed · then Intro II')).toBeTruthy()
  },
}

/** A long chord name: the hero size steps down until it fits its third. */
export const LongChord: Story = { args: { ...displayLongChord } }

/** A long style name: it ends in an ellipsis (the full name in its title), the metre keeps its place. */
export const LongStyleName: Story = { args: { ...displayLongStyle } }

/** A long fingering: the small line wraps to a second line, nothing is cut off. */
export const LongFingering: Story = {
  args: { ...displayLongFingering },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('AI Full Keyboard · played Cm7 (Keyboard transpose −3)')).toBeTruthy()
  },
}

/** Right 1 and Right 3 off: their dots dim, "· off" after the part's name. */
export const PartOff: Story = {
  args: { ...displayPartOff },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Right 1 · off')).toBeTruthy()
  },
}

/** A waltz in 3/4: three beat segments, on beat 3. */
export const ThreeFour: Story = {
  args: { ...displayThreeFour },
  play: async ({ canvasElement }) => {
    const states = [...canvasElement.querySelectorAll('[data-state]')].map((b) => b.getAttribute('data-state'))
    await expect(states).toEqual(['past', 'past', 'current'])
  },
}

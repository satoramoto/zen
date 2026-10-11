import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, within } from 'storybook/test'
import NowPlaying from './NowPlaying.svelte'
import {
  nowPlayingBoard,
  nowPlayingFill,
  nowPlayingLooping,
  nowPlayingStopped,
  nowPlayingSyncStart,
} from './NowPlaying.fixtures'

const HUES = ['intro', 'main', 'ending', 'brk', 'fill']

/**
 * The display's middle third, the song: the playing section large in its hue, one small line with
 * what comes next and when, and the tempo at the section's size with + and − stacked at its right.
 * A third of the display wide.
 */
const meta = {
  title: 'Components/NowPlaying',
  component: NowPlaying,
  parameters: { layout: 'centered' },
  args: {
    ...nowPlayingBoard,
    tipAction: fn(),
    ontempoup: fn(),
    ontempodown: fn(),
    onstyletempo: fn(),
    ontempo: fn(),
  },
  argTypes: {
    playing: { control: 'text', table: { category: 'SectionName' } },
    hue: { control: 'select', options: HUES, table: { category: 'SectionName' } },
    next: { control: 'text' },
    fill: { control: 'text' },
    bar: { control: { type: 'number', min: 1, step: 1 } },
    bars: { control: { type: 'number', min: 1, max: 16, step: 1 } },
    bpm: { control: { type: 'number', min: 5, max: 500, step: 1 }, table: { category: 'TempoReadout' } },
    running: { control: 'boolean' },
    syncStart: { control: 'boolean' },
    show: { control: { type: 'inline-radio' }, options: ['all', 'section', 'next', 'tempo'] },
  },
} satisfies Meta<typeof NowPlaying>

export default meta
type Story = StoryObj<typeof meta>

/** The board: Main B, then Main C · fill after bar 4, 104 BPM. */
export const Board: Story = {}

/** Stopped on Main A: the section muted, "Stopped". */
export const Stopped: Story = { args: { ...nowPlayingStopped } }

/** Sync Start armed with Intro II armed. */
export const SyncStartArmed: Story = { args: { ...nowPlayingSyncStart } }

/** Main D looping, nothing queued: "bar 2 of 8". */
export const Looping: Story = { args: { ...nowPlayingLooping } }

/** A fill with Ending II waiting. */
export const FillToEnding: Story = { args: { ...nowPlayingFill } }

/**
 * One part alone (`show` section; `next` and `tempo` likewise), for a Golden layout that gives the
 * section, the small line and the tempo each a cell: its container's width, no top margin, named
 * for what it shows.
 */
export const SectionAlone: Story = {
  args: { show: 'section' },
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByRole('group', { name: 'Section' })
    await expect(block).toHaveClass('alone')
    await expect(block.children).toHaveLength(1)
    await expect(within(block).queryByRole('button')).toBeNull()
    await expect(block.querySelector('.line')).toBeNull()
  },
}

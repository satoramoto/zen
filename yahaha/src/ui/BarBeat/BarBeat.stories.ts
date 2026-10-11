import type { Meta, StoryObj } from '@storybook/svelte-vite'
import BarBeat from './BarBeat.svelte'

const HUES = ['intro', 'main', 'ending', 'brk', 'fill']

/**
 * The display's beat bar: one thin line, a segment per beat of the bar in the playing section's
 * hue: past beats solid, the current beat lit, the rest dim; stopped, every segment dim. As wide as
 * the display's content.
 */
const meta = {
  title: 'Primitives/BarBeat',
  component: BarBeat,
  parameters: { layout: 'centered' },
  argTypes: {
    beat: { control: { type: 'range', min: 0, max: 12, step: 1 } },
    beats: { control: { type: 'number', min: 1, max: 12, step: 1 } },
    hue: { control: 'select', options: HUES },
  },
} satisfies Meta<typeof BarBeat>

export default meta
type Story = StoryObj<typeof meta>

/** The board: beat 2 of 4 in Main C. */
export const Board: Story = { args: { beat: 2, beats: 4, hue: 'main' } }

/** Counting in on an intro, beat 1. */
export const Intro: Story = { args: { beat: 1, beats: 4, hue: 'intro' } }

/** Stopped: every segment dim. */
export const Stopped: Story = { args: { beat: 0, beats: 4, hue: 'main' } }

/** A 3/4 ending on its last beat. */
export const ThreeFour: Story = { args: { beat: 3, beats: 3, hue: 'ending' } }

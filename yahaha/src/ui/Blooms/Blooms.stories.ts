import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { fn } from 'storybook/test'
import Blooms from './Blooms.svelte'
import BloomsStory from './BloomsStory.svelte'

/**
 * A few soft coloured blooms behind the whole screen (the Stage, Library, Settings) that breathe
 * with the band: while it plays they swell and drift very slowly, one breath per `barsPerBreath`
 * bars, phase-locked to the clock, and lift a little with the overall level; stopped, they settle
 * dimmer and hold still. Only `transform` and `opacity` animate, on the compositor: no repaints and
 * no frame loop. Nothing moves under `prefers-reduced-motion`.
 *
 * Three options for the owner (a taste call), each behind the Stage board at 1440 × 900:
 *
 * - **Aurora** (the app's default): the accent violet at top right, where the display art's glow
 *   was, with blue, magenta and plum low and wide. Cool and calm; one breath per 4 bars.
 * - **Parts**: the accent and the four part hues (R1 blue, R2 pink, L teal, R3 orange). The most
 *   colour; one breath per 4 bars.
 * - **Section**: the accent and the playing section's own hue (Main green here), so the backdrop
 *   changes colour with the section. Livelier: a deeper swell, one breath per 2 bars.
 *
 * Every text role keeps AA on the brightest spot the blooms make (Blooms/contrast.test.ts).
 */
const meta = {
  title: 'Screens/Blooms',
  component: Blooms,
  parameters: { layout: 'fullscreen' },
  render: (args) => ({ Component: BloomsStory, props: args }),
  args: {
    palette: 'aurora',
    section: 'main',
    motion: 'calm',
    playing: true,
    bpm: 104,
    beatsPerBar: 4,
    barsPerBreath: 4,
    level: 0.6,
    beat: fn(),
  },
  argTypes: {
    palette: { control: 'inline-radio', options: ['aurora', 'parts', 'section'] },
    section: { control: 'select', options: ['intro', 'main', 'ending', 'brk', 'fill'] },
    motion: { control: 'inline-radio', options: ['calm', 'lively'] },
    playing: { control: 'boolean' },
    bpm: { control: { type: 'range', min: 40, max: 280, step: 1 } },
    beatsPerBar: { control: { type: 'range', min: 2, max: 7, step: 1 } },
    barsPerBreath: { control: { type: 'range', min: 1, max: 8, step: 1 } },
    level: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
} satisfies Meta<typeof Blooms>

export default meta
type Story = StoryObj<typeof meta>

/** Recommended: the accent at top right with blue, magenta and plum; calm, one breath per 4 bars. */
export const Aurora: Story = {}

/** The accent and the four part hues; calm, one breath per 4 bars. */
export const Parts: Story = { args: { palette: 'parts' } }

/** The accent and the playing section's hue (Main); lively, one breath per 2 bars. */
export const Section: Story = { args: { palette: 'section', motion: 'lively', barsPerBreath: 2 } }

/** Stopped: the blooms settle dimmer and hold still. */
export const Stopped: Story = { args: { playing: false } }

/**
 * Play with every control: the palette and section, the motion, the tempo and metre, bars per
 * breath, the level, and `stage` to see the blooms alone.
 */
export const Playground: Story = {
  args: { stage: true } as Story['args'],
  argTypes: { stage: { control: 'boolean' } } as Story['argTypes'],
}

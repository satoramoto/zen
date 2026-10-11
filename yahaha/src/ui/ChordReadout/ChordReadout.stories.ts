import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { fn } from 'storybook/test'
import { chordBoard, chordLong, chordLongFingering, chordStopped } from '../NowPlaying/NowPlaying.fixtures'
import ChordReadout from './ChordReadout.svelte'

/**
 * The display's chord: the hero chord in the accent with its extension, then one small line with
 * the notes and the fingering (wrapping rather than cut off). Long chords step down the hero sizes
 * to fit the third. Held dims it to muted grey and says "held".
 */
const meta = {
  title: 'Primitives/ChordReadout',
  component: ChordReadout,
  parameters: { layout: 'centered' },
  args: { tip: 'fingering.select', tipAction: fn() },
  argTypes: {
    chord: { control: 'text' },
    extension: { control: 'text' },
    notes: { control: 'object' },
    fingering: { control: 'text' },
    held: { control: 'boolean' },
    label: { control: 'text' },
  },
} satisfies Meta<typeof ChordReadout>

export default meta
type Story = StoryObj<typeof meta>

/** The board: Am7, A · C · E · G, Fingered On Bass. */
export const Board: Story = { args: { ...chordBoard, label: 'Chord' } }

/** Held: detection is unsure, so the last chord stays, muted, with "held" on the small line. */
export const Held: Story = { args: { ...chordStopped } }

/** A long chord (C♯mmaj9(♯11)/G♯) steps down the hero sizes until it fits. */
export const Long: Story = { args: { ...chordLong } }

/** A long fingering with Keyboard transpose: the small line wraps to a second line. */
export const LongFingering: Story = { args: { ...chordLongFingering } }

/** No chord yet: a dim dash, no notes. */
export const Empty: Story = { args: { chord: '', notes: [], fingering: 'Fingered' } }

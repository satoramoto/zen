import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, waitFor } from 'storybook/test'
import { panelStrips } from '../FaderBank/FaderBank.fixtures'
import { styleKnobs } from '../KnobBank/KnobBank.fixtures'
import GoldenCompare from './GoldenCompare.svelte'

/**
 * The knob group and the fader group under each tuning, side by side, at the size the Stage gives
 * them at 1440 × 900 (knobs 699 × 174, faders 699 × 456: the band halved, round 8), each with its overlay and report line.
 * The Style knob page has "Retrig rate", the longest name, to show where names are cut short.
 */
const meta = {
  title: 'Golden/Compare',
  component: GoldenCompare,
  parameters: { layout: 'fullscreen' },
  args: {
    knobs: styleKnobs,
    strips: panelStrips,
    tunings: ['phi', 'just', 'root2'],
    tipAction: fn(),
    onreport: fn(),
    onpress: fn(),
    onstep: fn(),
    onlevel: fn(),
  },
  argTypes: {
    knobs: { control: 'object' },
    strips: { control: 'object' },
    tunings: { control: 'check', options: ['phi', 'just', 'root2'] },
  },
} satisfies Meta<typeof GoldenCompare>

export default meta
type Story = StoryObj<typeof meta>

/** Phi, Just and Root-two, one section each: the knobs block and the faders block, with their reports. */
export const Tunings: Story = {
  play: async ({ args, canvasElement }) => {
    const sections = [...canvasElement.querySelectorAll<HTMLElement>('section[data-tuning]')]
    await expect(sections.map((s) => s.dataset.tuning)).toEqual(['phi', 'just', 'root2'])
    for (const section of sections) {
      await expect(section.querySelectorAll('[data-golden="overlay"]').length).toBe(2)
    }
    await waitFor(() => expect(args.onreport).toHaveBeenCalled())
  },
}

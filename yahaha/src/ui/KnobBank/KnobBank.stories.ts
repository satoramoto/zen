import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import KnobBank from './KnobBank.svelte'
import { knobPages, styleKnobs } from './KnobBank.fixtures'

/**
 * The band's Knobs section: the knob page tabs after the title, and eight Knobs across the whole
 * column. A tab choice is a callback with the page's index; every knob change carries the knob's
 * position.
 */
const meta = {
  title: 'Components/KnobBank',
  component: KnobBank,
  parameters: { layout: 'centered' },
  args: {
    knobs: styleKnobs,
    pages: knobPages,
    page: 0,
    tipAction: fn(),
    onpage: fn(),
    onpress: fn(),
    onstep: fn(),
    // Deprecated, never called (the tabs replaced ▲ ▼); kept as actions for the story test.
    onpageup: fn(),
    onpagedown: fn(),
  },
  argTypes: {
    knobs: { control: 'object' },
    pages: { control: 'object' },
    page: { control: { type: 'number', min: 0, max: knobPages.length - 1, step: 1 } },
  },
} satisfies Meta<typeof KnobBank>

export default meta
type Story = StoryObj<typeof meta>

/** The board: the Style page chosen; knob 7 unused. A tab click asks for that page's index. */
export const Board: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('tab', { name: 'Style' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(canvas.getByRole('tab', { name: 'Reverb' }))
    await expect(args.onpage).toHaveBeenCalledWith(3)
  },
}

/** The Reverb page chosen. */
export const ReverbPage: Story = { args: { page: 3 } }

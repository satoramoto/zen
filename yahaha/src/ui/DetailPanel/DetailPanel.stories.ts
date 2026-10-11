import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { createRawSnippet } from 'svelte'
import { expect, fn, userEvent, within } from 'storybook/test'
import DetailPanel from './DetailPanel.svelte'
import { detailRack, detailSound } from './DetailPanel.fixtures'

const HUES = ['a', 'warn', 'ok', 'r1', 'r2', 'r3', 'l', 'm']

/** The page's extras for the Rack story: a line about where the rack is used. */
const rackExtras = createRawSnippet(() => ({
  render: () =>
    '<p style="margin: 0; font: var(--type-text); letter-spacing: var(--tracking-text); color: var(--t2)">Used by 2 styles in the Style map.</p>',
}))

/**
 * The details column beside a Library list: the head (number, title, badge), the subtitle, the
 * fields with their values in their hues, rows of action Buttons with an optional note, then the
 * page's extras. With no title, the empty text centred.
 */
const meta = {
  title: 'Components/DetailPanel',
  component: DetailPanel,
  parameters: { layout: 'centered' },
  args: { ...detailSound, tipAction: fn(), onaction: fn() },
  argTypes: {
    label: { control: 'text' },
    title: { control: 'text' },
    number: { control: 'text' },
    badge: { control: 'text' },
    badgeHue: { control: 'select', options: HUES },
    subtitle: { control: 'text' },
    fields: { control: 'object' },
    actions: { control: 'object', table: { category: 'Button' } },
    emptyText: { control: 'text' },
    width: { control: { type: 'number', min: 240, max: 640, step: 1 } },
  },
} satisfies Meta<typeof DetailPanel>

export default meta
type Story = StoryObj<typeof meta>

/** Library › Sounds: Silk Strings, playing on Right 2 and Left; Audition disabled while the band runs. */
export const Sound: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const panel = canvas.getByRole('region', { name: 'Sound details' })
    await expect(panel).toHaveTextContent('Right 2, Left')
    await expect(panel).toHaveTextContent('Stop the band to audition.')
    await userEvent.click(canvas.getByRole('button', { name: 'Audition' }))
    await expect(args.onaction).not.toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Use on Right 1' }))
    await expect(args.onaction).toHaveBeenCalledWith('use')
  },
}

/** Library › Racks: Sunday drive, modified, with Load, Save, Duplicate and Delete, and the page's extras. */
export const Rack: Story = {
  args: { ...detailRack, children: rackExtras },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Delete' }))
    await expect(args.onaction).toHaveBeenCalledWith('delete')
    await expect(canvas.getByText('Used by 2 styles in the Style map.')).toBeInTheDocument()
  },
}

/** The rack without extras. */
export const RackPlain: Story = { args: { ...detailRack } }

/** Nothing chosen: the empty text, centred. */
export const Empty: Story = {
  args: { label: 'Sound details', title: '', fields: [], actions: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('region', { name: 'Sound details' })).toHaveTextContent(
      'Choose a sound to see its details.',
    )
    await expect(canvas.queryByRole('button')).toBeNull()
  },
}

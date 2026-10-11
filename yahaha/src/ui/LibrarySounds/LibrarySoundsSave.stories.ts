import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import LibrarySoundsSave from './LibrarySoundsSave.svelte'
import { soundCategories } from './LibrarySounds.fixtures'

/**
 * Library › Sounds' header actions, at the Library header's right end while Sounds is chosen:
 * "edited", Save and Save as…, which opens the inline name field (.aupreset for a plugin part,
 * Save / Cancel, or Replace / Cancel when that preset exists).
 */
const meta = {
  title: 'Components/LibrarySoundsSave',
  component: LibrarySoundsSave,
  parameters: { layout: 'centered' },
  args: {
    partNames: ['Right 1', 'Right 2', 'Right 3', 'Left'],
    part: 1,
    edited: true,
    saveAs: null,
    canPreset: true,
    categories: soundCategories,
    tipAction: fn(),
    onsave: fn(),
    onsaveasopen: fn(),
    onsaveasedit: fn(),
    onsaveas: fn(),
    onsaveascancel: fn(),
  },
  argTypes: {
    partNames: { control: 'object' },
    part: { control: { type: 'number', min: 0, max: 3, step: 1 } },
    edited: { control: 'boolean' },
    saveAs: { control: 'object' },
    canPreset: { control: 'boolean' },
    categories: { control: 'object' },
  },
} satisfies Meta<typeof LibrarySoundsSave>

export default meta
type Story = StoryObj<typeof meta>

/** Right 2's sound edited: Save and Save as… */
export const Edited: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('edited')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: "Save Right 2's sound" }))
    await expect(args.onsave).toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: "Save Right 2's sound as a new sound" }))
    await expect(args.onsaveasopen).toHaveBeenCalled()
  },
}

/** The Save as… form open with .aupreset on. */
export const SaveAs: Story = {
  args: { saveAs: { name: 'Slow Strings 2', aupreset: true, category: 'strings', replace: false } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Save the new sound' }))
    await expect(args.onsaveas).toHaveBeenCalledWith(false)
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
    await expect(args.onsaveascancel).toHaveBeenCalled()
  },
}

/** A preset of that name exists: Replace or Cancel. */
export const Replace: Story = {
  args: { saveAs: { name: 'Slow Strings 2', aupreset: true, category: 'strings', replace: true } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Replace' }))
    await expect(args.onsaveas).toHaveBeenCalledWith(true)
  },
}

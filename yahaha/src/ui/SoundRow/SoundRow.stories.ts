import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { fn } from 'storybook/test'
import SoundRow from './SoundRow.svelte'
import { soundRowBoard, soundRowClean } from './SoundRow.fixtures'

/**
 * The display's right third: a row per keyboard part (its hue's dot, the sound and its marks, the
 * part's name at the right), then One Touch 1-4. Plain rows, no boxes. A third of the display wide.
 */
const meta = {
  title: 'Components/SoundRow',
  component: SoundRow,
  parameters: { layout: 'centered' },
  args: { ...soundRowBoard, tipAction: fn(), onsound: fn(), ononetouch: fn() },
  argTypes: {
    parts: { control: 'object' },
    oneTouch: { control: { type: 'inline-radio' }, options: [0, 1, 2, 3, 4], table: { category: 'OneTouchPicker' } },
    oneTouchCount: { control: { type: 'number', min: 0, max: 4, step: 1 }, table: { category: 'OneTouchPicker' } },
    showOneTouch: { control: 'boolean', table: { category: 'OneTouchPicker' } },
  },
} satisfies Meta<typeof SoundRow>

export default meta
type Story = StoryObj<typeof meta>

/** The board: R2 edited; R3 off with its plugin missing; One Touch 2. */
export const Board: Story = {}

/** Every part on, R2's plugin failed, Left playing the Style's bass, a long sound name; three One Touch settings. */
export const Clean: Story = { args: { ...soundRowClean } }

/** The rows alone (`showOneTouch` off), as in the golden Stage's parts block, where One Touch has a block of its own. */
export const RowsOnly: Story = { args: { showOneTouch: false } }

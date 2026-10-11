import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import SearchField from './SearchField.svelte'

/**
 * The underline search field of the Library pages: a magnifier, a borderless input and a 1px line
 * in `--m` that turns `--t` while the field has focus. Controlled: typing calls `oninput`, the
 * parent moves `value`. Esc clears a non-empty field and stops there; every other key reaches
 * `onkeydown`, so a page can drive its list from the field.
 */
const meta = {
  title: 'Primitives/SearchField',
  component: SearchField,
  parameters: { layout: 'centered' },
  args: {
    value: '',
    label: 'Search styles',
    placeholder: 'Search',
    width: 280,
    tip: 'library.search',
    oninput: fn(),
    onkeydown: fn(),
    tipAction: fn(),
  },
  argTypes: {
    value: { control: 'text' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    width: { control: { type: 'number', min: 80, step: 10 } },
    tip: { control: 'text' },
  },
} satisfies Meta<typeof SearchField>

export default meta
type Story = StoryObj<typeof meta>

/** Empty: the placeholder in `--m`. Typing calls `oninput` with the text; other keys reach `onkeydown`. */
export const Empty: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('searchbox', { name: 'Search styles' })
    await expect(input).toHaveAttribute('placeholder', 'Search')
    await expect(input).toHaveAttribute('autocomplete', 'off')
    await expect(input).toHaveAttribute('spellcheck', 'false')
    await expect(input).toHaveAttribute('data-tip', 'library.search')
    await expect(args.tipAction).toHaveBeenCalledWith(input, 'library.search')
    await userEvent.type(input, 'pop')
    await expect(args.oninput).toHaveBeenLastCalledWith('pop')
    await userEvent.keyboard('{ArrowDown}')
    await expect(args.onkeydown).toHaveBeenLastCalledWith(expect.objectContaining({ key: 'ArrowDown' }))
  },
}

/** With text: Esc clears it (`oninput('')`) and doesn't reach the page; on an empty field it does. */
export const Filled: Story = {
  args: { value: 'coastal' },
  play: async ({ canvasElement, args }) => {
    const spy = fn()
    window.addEventListener('keydown', spy)
    try {
      const canvas = within(canvasElement)
      const input = canvas.getByRole('searchbox', { name: 'Search styles' })
      await expect(input).toHaveValue('coastal')
      input.focus()
      await userEvent.keyboard('{Escape}')
      await expect(args.oninput).toHaveBeenLastCalledWith('')
      await expect(args.onkeydown).not.toHaveBeenCalled()
      await expect(spy).not.toHaveBeenCalled()
    } finally {
      window.removeEventListener('keydown', spy)
    }
  },
}

/** Esc on an empty field calls nothing of its own and bubbles on to the page. */
export const EscapeBubbles: Story = {
  args: { label: 'Search sounds', placeholder: 'Search sounds', width: 240 },
  play: async ({ canvasElement, args }) => {
    const spy = fn()
    window.addEventListener('keydown', spy)
    try {
      const canvas = within(canvasElement)
      canvas.getByRole('searchbox', { name: 'Search sounds' }).focus()
      await userEvent.keyboard('{Escape}')
      await expect(args.oninput).not.toHaveBeenCalled()
      await expect(args.onkeydown).toHaveBeenLastCalledWith(expect.objectContaining({ key: 'Escape' }))
      await expect(spy).toHaveBeenCalled()
    } finally {
      window.removeEventListener('keydown', spy)
    }
  },
}

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { SearchField, type SearchFieldProps } from './SearchField';

/** Plays the parent: typing moves `value`, and the story's action logs each edit. */
function Live(args: SearchFieldProps) {
  const [value, setValue] = useState(args.value ?? '');
  return (
    <SearchField
      {...args}
      value={value}
      onInput={(next) => {
        setValue(next);
        args.onInput?.(next);
      }}
    />
  );
}

/**
 * The search field of the Library pages, in the pack's input chrome. Controlled: typing calls
 * `onInput`, the parent moves `value`. Esc clears a non-empty field and stops there; every other
 * key reaches `onKeyDown`, so a page can drive its list from the field.
 */
const meta = {
  title: 'Library/Yahaha/Primitives/SearchField',
  component: SearchField,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  args: {
    value: '',
    label: 'Search styles',
    placeholder: 'Search',
    width: 280,
    tip: 'library.search',
    onInput: fn(),
    onKeyDown: fn(),
  },
  argTypes: {
    value: { control: 'text' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    width: { control: { type: 'number', min: 80, step: 10 } },
    tip: { control: 'text' },
  },
  render: (args) => <Live key={args.value} {...args} />,
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty: the placeholder in muted text. Typing calls `onInput`; other keys reach `onKeyDown`. */
export const Empty: Story = {};

/** With text: the magnifier steps up and a clear button appears; Esc clears it. */
export const Filled: Story = {
  args: { value: 'coastal' },
};

/** Esc on an empty field calls nothing of its own and bubbles on to the page. */
export const EscapeBubbles: Story = {
  args: { label: 'Search sounds', placeholder: 'Search sounds', width: 240 },
};

/** A long query in a narrow field: the text scrolls, the clear button stays reachable. */
export const LongQuery: Story = {
  args: { value: 'user styles on the external drive', width: 180 },
};

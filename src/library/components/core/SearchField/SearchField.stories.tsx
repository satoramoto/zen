import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { EveryPack, withLibraryTheme } from '../../../storybook';
import type { ModeChoice } from '../../../theme';
import { packs } from '../../../themes/packs';
import { Button } from '../Button/Button';
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
  title: 'Design OS/Components/Core/SearchField',
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

/** A page focusing the field from its own key (a ⌘F shortcut) through `ref`. */
function Focusable(args: SearchFieldProps) {
  const field = useRef<HTMLInputElement>(null);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <Live {...args} ref={field} />
      <Button label="Find" onPress={() => field.current?.focus()} />
    </div>
  );
}

/**
 * New: `ref`, `disabled` and `title`, in every pack. Each row: a live field with a hover hint whose
 * `ref` the Find key focuses, then the same field disabled (dashed edge, faint ink, not editable,
 * no clear button).
 */
export const RefDisabledTitle: Story = {
  args: { title: 'Search presets (⌘F)', label: 'Search presets', width: 200 },
  render: (args, { globals }) => (
    <EveryPack mode={globals.mode as ModeChoice}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
        <Focusable {...args} />
        <SearchField {...args} label="Search presets (disabled)" value="coastal" disabled title="Nothing to search" />
      </div>
    </EveryPack>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const fields = canvas.getAllByRole('searchbox', { name: 'Search presets' });
    await expect(fields).toHaveLength(packs.length);
    await expect(fields[0].closest('.yh-search-field')).toHaveAttribute('title', 'Search presets (⌘F)');
    await userEvent.click(canvas.getAllByRole('button', { name: 'Find' })[0]);
    await expect(fields[0]).toHaveFocus();
    await userEvent.keyboard('ab');
    await expect(args.onInput).toHaveBeenLastCalledWith('ab');
    const off = canvas.getAllByRole('searchbox', { name: 'Search presets (disabled)' })[0];
    await expect(off).toBeDisabled();
    await expect(off.closest('.yh-search-field')).toHaveAttribute('data-disabled', 'true');
    await expect(off.closest('.yh-search-field')!.querySelector('.yh-search-field__clear')).toBeNull();
  },
};

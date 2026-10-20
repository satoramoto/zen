import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Group } from '../../../layout/Group';
import { Stack } from '../../../primitives/Stack';
import { Text } from '../../../primitives/Text';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { Select, type SelectProps } from './Select';
import SelectSvelte from './Select.svelte';
import { SELECT_BLENDS as BLENDS, SELECT_MODES as MODES, selectArgTypes, selectStories as s } from './Select.fixtures';

// Every story but the live ones is built from Select.fixtures.ts (`story(s.Name)`), which the tree
// snapshot shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`. The plays are the behaviours.

const meta = {
  title: 'Design OS/Components/Core/Select',
  component: Select,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { ...(s.Closed.args as SelectProps), onChange: fn() },
  argTypes: selectArgTypes,
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Select, SelectSvelte);

/** Closed: the held member and a caret; ↓ picks the next straight away, without opening. */
export const Closed: Story = {
  ...story(s.Closed),
  play: async ({ canvasElement, args }) => {
    const field = within(canvasElement).getByRole('combobox', { name: 'Mode' });
    await expect(field).toHaveTextContent('neon');
    await expect(field).toHaveAttribute('aria-expanded', 'false');
    field.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(args.onChange).toHaveBeenLastCalledWith(1);
  },
};

/** Open: the menu is a float Layer at least the field's width; the held member is chosen, the pointer's row highlighted. Enter takes the highlight. */
export const Open: Story = {
  ...story(s.Open),
  play: async ({ canvasElement, args }) => {
    const field = within(canvasElement).getByRole('combobox', { name: 'Mode' });
    await userEvent.click(field);
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    const doc = within(canvasElement.ownerDocument.body);
    const list = await doc.findByRole('listbox', { name: 'Mode' });
    await expect(list).toHaveAttribute('data-layer', 'float');
    await expect(within(list).getAllByRole('option').map((o) => o.textContent)).toEqual(MODES);
    await userEvent.keyboard('{ArrowDown}');
    await expect(list.querySelector('[data-active]')).toHaveTextContent('band');
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenLastCalledWith(2);
    await waitFor(() => expect(field).toHaveAttribute('aria-expanded', 'false'));
  },
};

/** With a caption (`name`), which also names it when there's no `label`. */
export const Captioned: Story = {
  ...story(s.Captioned),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('combobox', { name: 'Mode' })).toBeInTheDocument();
  },
};

/** A long list: the menu scrolls inside the room left under the field, arriving scrolled to the held member. Type a letter to jump. */
export const LongList: Story = story(s.LongList);

/** A settled width, so a caller-owned list of labels can't resize the panel; long members truncate. */
export const FixedWidth: Story = story(s.FixedWidth);

/** Disabled: shown, not openable. */
export const Disabled: Story = {
  ...story(s.Disabled),
  play: async ({ canvasElement, args }) => {
    const field = within(canvasElement).getByRole('combobox', { name: 'Mode' });
    await expect(field).toBeDisabled();
    await userEvent.click(field);
    await expect(field).toHaveAttribute('aria-expanded', 'false');
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/** Live: controlled by its parent, the way a host uses it. Its own React `render` (live state), so it stays React-only. */
export const Live: Story = {
  render: function LiveSelect(args) {
    const [index, setIndex] = useState(args.index);
    return <Select {...args} items={BLENDS} label="Blend" name="Blend" index={index} onChange={(next) => (setIndex(next), args.onChange(next))} />;
  },
};

/**
 * Field vs. in a toolbar: the same Select, its look set by where it sits. On its own it is a
 * field (a key face, an edge); inside a toolbar `Group` (`ControlContext { quiet: true }`) it is
 * the value and a caret in the bar's ink, a faint wash only on hover and while open. Same size,
 * keys and menu. Its own React `render` (live state in a toolbar), so it stays React-only.
 */
export const FieldVsToolbar: Story = {
  render: function FieldVsToolbarStory(args) {
    const [field, setField] = useState(0);
    const [bar, setBar] = useState(0);
    return (
      <Stack direction="column" gap={5} align="start">
        <Select {...args} label="Field mode" index={field} onChange={(next) => (setField(next), args.onChange(next))} />
        <Group name="Toolbar" label={false} toolbar align="center" gap={4}>
          <Text weight="strong">Play</Text>
          <Select {...args} label="Toolbar mode" index={bar} onChange={(next) => (setBar(next), args.onChange(next))} />
          <Text>Mixer</Text>
        </Group>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Field mode' });
    const quiet = canvas.getByRole('combobox', { name: 'Toolbar mode' });
    await expect(field.closest('[data-part="root"]')).not.toHaveAttribute('data-quiet');
    await expect(quiet.closest('[data-part="root"]')).toHaveAttribute('data-quiet');
    await expect(canvas.getByRole('toolbar', { name: 'Toolbar' })).toContainElement(quiet);
    await expect(quiet.getBoundingClientRect().height).toBe(field.getBoundingClientRect().height);
  },
};

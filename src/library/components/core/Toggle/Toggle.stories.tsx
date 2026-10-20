import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { Toggle, type ToggleProps } from './Toggle';
import ToggleSvelte from './Toggle.svelte';
import { toggleArgTypes, toggleBase, toggleStories as s } from './Toggle.fixtures';

// Every story is built from Toggle.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React's or Svelte's `Tree`. The plays are the behaviours.
// The Switch's stories are in Switch.stories.tsx.

/** A Toggle that keeps its own `on`, so the story can be played with; `onChange` still hears each ask. */
function Live({ on: initial, onChange, ...props }: ToggleProps) {
  const [on, setOn] = useState(initial);
  return (
    <Toggle
      {...props}
      on={on}
      onChange={(next) => {
        setOn(next);
        onChange(next);
      }}
    />
  );
}

/**
 * A latching key (visual[flow]'s `Toggle`, Live's `live.toggle`), on the theme's key material:
 * stacked as a caption over a lit key, or inside a row with its state at the end.
 */
const meta = {
  title: 'Design OS/Components/Core/Toggle',
  component: Toggle,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { ...(toggleBase as ToggleProps), onChange: fn() },
  argTypes: toggleArgTypes,
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Toggle, ToggleSvelte);

/** Stacked: a caption over a key. A press asks for the other state; the key latches. Live (its own
 *  React `render` keeps `on`), so it stays React-only. */
export const Stacked: Story = {
  ...story(s.Stacked, { render: (args) => <Live {...args} /> }),
  play: async ({ canvasElement, args }) => {
    const key = within(canvasElement).getByRole('button', { name: 'sync' });
    await expect(key).toHaveAttribute('aria-pressed', 'false');
    await expect(key.closest('[data-part="root"]')).toHaveAttribute('data-hint', 'Follow the link’s tempo');
    await userEvent.click(key);
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    await expect(key).toHaveAttribute('aria-pressed', 'true');
    await expect(key).toHaveAttribute('data-on');
    await userEvent.keyboard(' ');
    await expect(args.onChange).toHaveBeenLastCalledWith(false);
    await expect(key).toHaveAttribute('aria-pressed', 'false');
  },
};

/** On, in another ink: the key pressed and lit. */
export const On: Story = story(s.On);

/** Inside a row: the name at the left, the state at the right; on, the reading lights. Live, in a
 *  240px row (its own React `render`), so it stays React-only. */
export const Inside: Story = {
  ...story(s.Inside, {
    render: (args) => (
      <div style={{ width: 240 }}>
        <Live {...args} />
      </div>
    ),
  }),
  play: async ({ canvasElement, args }) => {
    const key = within(canvasElement).getByRole('button', { name: 'invert' });
    // Inside, the face is empty; the reading sits beside it.
    await expect(key).toBeEmptyDOMElement();
    await expect(canvasElement.querySelector('[data-part="readout"]')).toHaveTextContent('Off');
    await userEvent.click(key);
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    await expect(key.closest('[data-part="root"]')).toHaveAttribute('data-on');
    await userEvent.click(key);
  },
};

/** Momentary: on while held, off on release or when the pointer leaves; no pressed state. Live
 *  (its own React `render`), so it stays React-only. */
export const Momentary: Story = {
  ...story(s.Momentary, { render: (args) => <Live {...args} /> }),
  play: async ({ canvasElement, args }) => {
    const key = within(canvasElement).getByRole('button', { name: 'tap' });
    await expect(key).not.toHaveAttribute('aria-pressed');
    await fireEvent.pointerDown(key);
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    await expect(key).toHaveAttribute('data-on');
    await fireEvent.pointerUp(key);
    await expect(args.onChange).toHaveBeenLastCalledWith(false);
    await fireEvent.pointerDown(key);
    await fireEvent.pointerLeave(key);
    await expect(args.onChange).toHaveBeenLastCalledWith(false);
  },
};

/** Disabled, off and on: shown, asks nothing. */
export const Disabled: Story = {
  ...story(s.Disabled),
  play: async ({ canvasElement, args }) => {
    const [off] = within(canvasElement).getAllByRole('button', { name: 'sync' });
    await expect(off).toBeDisabled();
    await userEvent.click(off, { pointerEventsCheck: 0 });
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

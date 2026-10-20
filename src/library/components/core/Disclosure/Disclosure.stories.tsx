import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { Disclosure, type DisclosureProps } from './Disclosure';
import DisclosureSvelte from './Disclosure.svelte';
import { disclosureArgTypes, disclosureStories as s } from './Disclosure.fixtures';

// Every story is built from Disclosure.fixtures.ts (`story(s.Name)`), which the tree snapshot
// shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`. The plays are the behaviours.

/** A disclosure button and the panel it opens. */
function Panel({ onChange, ...props }: DisclosureProps) {
  const [open, setOpen] = useState(props.defaultExpanded ?? false);
  return (
    <div style={{ color: 'var(--text-1)', fontFamily: 'var(--font-sans)' }}>
      <Disclosure
        {...props}
        onChange={(next) => {
          setOpen(next);
          onChange?.(next);
        }}
      />
      {open && <p id="advanced-panel">Advanced options</p>}
    </div>
  );
}

/**
 * A disclosure button: a square key with a chevron, down when what it shows is hidden and up when
 * shown. A button with `aria-expanded`.
 */
const meta = {
  title: 'Design OS/Components/Core/Disclosure',
  component: Disclosure,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { 'aria-label': 'Details' },
  argTypes: disclosureArgTypes,
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Disclosure, DisclosureSvelte);

/** One to try, showing and hiding what it controls. With the panel it opens (its own React
 *  `render`), so it stays React-only. */
export const Playground: Story = {
  ...story(s.Playground, { render: (args) => <Panel {...args} /> }),
  args: { ...s.Playground.args, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Advanced' });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toHaveAttribute('aria-controls', 'advanced-panel');
    await expect(canvas.queryByText('Advanced options')).toBeNull();
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    await expect(canvas.getByText('Advanced options')).toBeVisible();
    await userEvent.keyboard('{Enter}');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Closed, every size: the chevron down. A disabled one doesn't open. */
export const Closed: Story = {
  ...story(s.Closed),
  play: async ({ canvasElement }) => {
    const disabled = within(canvasElement).getByRole('button', { name: 'regular, disabled' });
    await userEvent.click(disabled, { pointerEventsCheck: 0 });
    await expect(disabled).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Open, every size: the chevron up. */
export const Open: Story = {
  ...story(s.Open),
  play: async ({ canvasElement }) => {
    const idle = within(canvasElement).getByRole('button', { name: 'small, idle' });
    await expect(idle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(idle);
    await expect(idle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(idle);
    await expect(idle).toHaveAttribute('aria-expanded', 'true');
  },
};

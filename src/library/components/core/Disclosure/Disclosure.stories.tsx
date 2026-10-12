import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { CONTROL_SIZES } from '../Toggle/useToggle';
import { Disclosure, type DisclosureProps } from './Disclosure';

/** Every size, enabled and disabled, closed or open. */
const sheet = (expanded: boolean) => () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto)', gap: 12, alignItems: 'center' }}>
    {CONTROL_SIZES.map((size) => [
      <Disclosure key={`${size}-idle`} aria-label={`${size}, idle`} size={size} defaultExpanded={expanded} />,
      <Disclosure key={`${size}-disabled`} aria-label={`${size}, disabled`} size={size} defaultExpanded={expanded} disabled />,
    ])}
  </div>
);

/** A disclosure button and the panel it opens. */
function Panel({ onChange, ...props }: DisclosureProps) {
  const [open, setOpen] = useState(props.defaultExpanded ?? false);
  return (
    <div style={{ color: 'var(--text-1)', fontFamily: 'var(--font-sans)' }}>
      <Disclosure
        {...props}
        controls="advanced-panel"
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
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { 'aria-label': 'Details' },
  argTypes: {
    size: { control: 'select', options: CONTROL_SIZES },
    disabled: { control: 'boolean' },
    defaultExpanded: { control: 'boolean' },
  },
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One to try, showing and hiding what it controls. */
export const Playground: Story = {
  args: { 'aria-label': 'Advanced', size: 'regular', defaultExpanded: false, disabled: false, onChange: fn() },
  render: (args) => <Panel {...args} />,
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

/** Closed: the chevron down. A disabled one doesn't open. */
export const Closed: Story = {
  render: sheet(false),
  play: async ({ canvasElement }) => {
    const disabled = within(canvasElement).getByRole('button', { name: 'regular, disabled' });
    await userEvent.click(disabled, { pointerEventsCheck: 0 });
    await expect(disabled).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Open: the chevron up. */
export const Open: Story = {
  render: sheet(true),
  play: async ({ canvasElement }) => {
    const idle = within(canvasElement).getByRole('button', { name: 'small, idle' });
    await expect(idle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(idle);
    await expect(idle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(idle);
    await expect(idle).toHaveAttribute('aria-expanded', 'true');
  },
};

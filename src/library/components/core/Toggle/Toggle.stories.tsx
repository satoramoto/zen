import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { CONTROL_SIZES, Switch, Toggle, type ToggleProps } from './Toggle';

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
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { on: false, onChange: fn(), name: 'sync', children: 'On' },
  argTypes: {
    on: { control: 'boolean' },
    disabled: { control: 'boolean' },
    momentary: { control: 'boolean' },
    label: { control: 'text' },
    name: { control: 'text' },
    width: { control: 'number' },
    layout: { control: 'inline-radio', options: ['stacked', 'inside'] },
    title: { control: 'text' },
    hint: { control: 'text' },
    ink: { control: 'text' },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stacked: a caption over a key. A press asks for the other state; the key latches. */
export const Stacked: Story = {
  args: { hint: 'Follow the link’s tempo', title: 'Sync to Link' },
  render: (args) => <Live {...args} />,
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
export const On: Story = {
  args: { on: true, ink: 'var(--hue-2)' },
  render: (args) => <Live {...args} />,
};

/** Inside a row: the name at the left, the state at the right; on, the reading lights. */
export const Inside: Story = {
  args: { layout: 'inside', name: 'invert', label: 'invert', title: 'Flip the colours (I)', children: 'Off' },
  render: (args) => (
    <div style={{ width: 240 }}>
      <Live {...args} />
    </div>
  ),
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

/** Momentary: on while held, off on release or when the pointer leaves; no pressed state. */
export const Momentary: Story = {
  args: { momentary: true, name: 'tap', children: 'Tap' },
  render: (args) => <Live {...args} />,
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
  args: { disabled: true },
  render: (args) => (
    <div style={{ display: 'flex', gap: 16 }}>
      <Toggle {...args} on={false} />
      <Toggle {...args} on />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const [off] = within(canvasElement).getAllByRole('button', { name: 'sync' });
    await expect(off).toBeDisabled();
    await userEvent.click(off, { pointerEventsCheck: 0 });
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

const switchMeta = { decorators: [withLibraryTheme], parameters: { layout: 'centered' } };

/** Switch: one to try. A click, Space or Enter flips it. */
export const SwitchPlayground: StoryObj<typeof Switch> = {
  ...switchMeta,
  name: 'Switch / Playground',
  args: { 'aria-label': 'Follow the beat', size: 'regular', defaultChecked: false, disabled: false, onChange: fn() },
  // Only the switch's own args: the file's meta args are the Toggle's.
  render: ({ 'aria-label': label, size, defaultChecked, disabled, onChange }) => (
    <Switch aria-label={label} size={size} defaultChecked={defaultChecked} disabled={disabled} onChange={onChange} />
  ),
  play: async ({ canvasElement, args }) => {
    const sw = within(canvasElement).getByRole('switch', { name: 'Follow the beat' });
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    await userEvent.keyboard(' ');
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.keyboard('{Enter}');
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard(' ');
    await expect(sw).toHaveAttribute('aria-checked', 'false');
  },
};

/** Every size, enabled and disabled, at one value. */
const sheet = (on: boolean) => () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto)', gap: 16, alignItems: 'center' }}>
    {CONTROL_SIZES.map((size) => [
      <Switch key={`${size}-idle`} aria-label={`${size}, idle`} size={size} defaultChecked={on} />,
      <Switch key={`${size}-disabled`} aria-label={`${size}, disabled`} size={size} defaultChecked={on} disabled />,
    ])}
  </div>
);

/** On: the track lit, the thumb at the trailing end. */
export const SwitchOn: StoryObj<typeof Switch> = {
  ...switchMeta,
  name: 'Switch / On',
  render: sheet(true),
  play: async ({ canvasElement }) => {
    const sw = within(canvasElement).getByRole('switch', { name: 'regular, idle' });
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute('aria-checked', 'true');
  },
};

/** Off: the track a well, the thumb at the leading end. A disabled one doesn't flip. */
export const SwitchOff: StoryObj<typeof Switch> = {
  ...switchMeta,
  name: 'Switch / Off',
  render: sheet(false),
  play: async ({ canvasElement }) => {
    const disabled = within(canvasElement).getByRole('switch', { name: 'regular, disabled' });
    await expect(disabled).toBeDisabled();
    await userEvent.click(disabled, { pointerEventsCheck: 0 });
    await expect(disabled).toHaveAttribute('aria-checked', 'false');
  },
};

/** Labelled (the app's `SwitchRow`): the name at the start of the line labels the switch at the end. */
export const SwitchLabelled: StoryObj<typeof Switch> = {
  ...switchMeta,
  name: 'Switch / Labelled',
  args: { size: 'small', onChange: fn(), title: 'Turns the motion down' },
  render: ({ size, onChange, title }) => (
    <div style={{ width: 280, display: 'grid', gap: 8 }}>
      <Switch size={size} onChange={onChange} title={title}>
        Reduced motion
      </Switch>
      <Switch size={size} title={title} disabled>
        Follow the system
      </Switch>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const sw = within(canvasElement).getByRole('switch', { name: 'Reduced motion' });
    await userEvent.click(within(canvasElement).getByText('Reduced motion'));
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await expect(args.onChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute('aria-checked', 'false');
  },
};

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Text } from '../../../primitives/Text';
import { NamePicker, type NamePickerProps } from './NamePicker';

const NAMES = ['Ada', 'Grace', 'Linus', 'Margaret', 'Tim'];

/** Plays the app: shows the picker until a name is picked, then who was picked. */
function App(args: NamePickerProps) {
  const [picked, setPicked] = useState<string | null>(null);
  if (picked !== null) {
    return (
      <Text as="p" role="display" size="heading" style={{ padding: 'var(--space-6)' }}>
        Hello, {picked}
      </Text>
    );
  }
  return (
    <NamePicker
      {...args}
      onPick={(name) => {
        args.onPick(name);
        setPicked(name);
      }}
    />
  );
}

/**
 * A full-screen step asking which of a known set of people you are, before the app shows
 * anything that depends on it. The app keeps the name `onPick` hands it.
 */
// Drawn by React only: the title, message and children are React nodes (snippets in Svelte), so
// there is no plain-data fixture for the Renderer toolbar to draw in Svelte.
const meta = {
  title: 'Design OS/Components/Core/NamePicker',
  component: NamePicker,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: {
    names: NAMES,
    value: null,
    title: 'Who are you?',
    message: 'Pick your name. This device will remember it.',
    onPick: fn(),
  },
  argTypes: {
    title: { control: 'text' },
    message: { control: 'text' },
    pickLabel: { control: 'text' },
  },
  render: (args) => <App {...args} />,
} satisfies Meta<typeof NamePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Nothing chosen: the key waits. A click chooses a name, the arrows move the choice, and Enter on
 * the list picks it.
 */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'Who are you?' });
    await expect(within(group).getAllByRole('radio')).toHaveLength(NAMES.length);
    const key = canvas.getByRole('button', { name: "That's me" });
    await expect(key).toBeDisabled();

    await userEvent.click(canvas.getByRole('radio', { name: 'Grace' }));
    await expect(canvas.getByRole('radio', { name: 'Grace' })).toBeChecked();
    await expect(key).toBeEnabled();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('radio', { name: 'Linus' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Grace' })).not.toBeChecked();
    await expect(args.onPick).not.toHaveBeenCalled();

    await userEvent.keyboard('{Enter}');
    await expect(args.onPick).toHaveBeenCalledTimes(1);
    await expect(args.onPick).toHaveBeenCalledWith('Linus');
    await expect(await canvas.findByText('Hello, Linus')).toBeInTheDocument();
  },
};

/** A remembered name starts chosen; the key picks it, with the app's own label. */
export const Remembered: Story = {
  args: { value: 'Margaret', pickLabel: 'Continue' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Margaret' })).toBeChecked();
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
    await expect(args.onPick).toHaveBeenCalledWith('Margaret');
  },
};

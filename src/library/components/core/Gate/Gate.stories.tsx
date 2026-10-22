import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { Text } from '../../../primitives/Text';
import { Gate, type GateProps } from './Gate';

/** The key the Default story's app accepts. */
const KEY = 'open-sesame';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Plays the app: shows the gate until `onSubmit` settles without throwing, then what it guards. */
function App(args: GateProps) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <Text as="p" role="display" size="heading" style={{ padding: 'var(--space-6)' }}>
        Inside
      </Text>
    );
  }
  return (
    <Gate
      {...args}
      onSubmit={async (key) => {
        await args.onSubmit?.(key);
        setOpen(true);
      }}
    />
  );
}

/**
 * A full-screen gate asking for one shared key before the app shows anything. The app checks the
 * key in `onSubmit`; a thrown error or rejected promise is the gate's error text, and the field
 * and keys wait while the promise is pending.
 */
// Drawn by React only: the title, message and children are React nodes (snippets in Svelte), so
// there is no plain-data fixture for the Renderer toolbar to draw in Svelte.
const meta = {
  title: 'Design OS/Components/Core/Gate',
  component: Gate,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Private preview',
    message: 'Enter the key you were given to continue.',
    label: 'Key',
    submitLabel: 'Enter',
  },
  argTypes: {
    title: { control: 'text' },
    message: { control: 'text' },
    error: { control: 'text' },
    label: { control: 'text' },
    submitLabel: { control: 'text' },
  },
  render: (args) => <App {...args} />,
} satisfies Meta<typeof Gate>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The app accepts `open-sesame` after a short check. A blank key never submits; a wrong one shows
 * the app's message; the right one, revealed first, opens the app.
 */
export const Default: Story = {
  args: {
    onSubmit: fn(async (key: string) => {
      await wait(300);
      if (key !== KEY) throw new Error('Keys are case-sensitive. Check yours and try again.');
    }),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByLabelText('Key');
    await waitFor(() => expect(field).toHaveFocus());
    await expect(field).toHaveAttribute('type', 'password');

    // Blank: Enter and the key do nothing.
    await userEvent.type(field, '   {Enter}');
    await userEvent.click(canvas.getByRole('button', { name: 'Enter' }));
    await expect(args.onSubmit).not.toHaveBeenCalled();
    await userEvent.clear(field);

    // Wrong: the app's message, announced, on the field.
    await userEvent.type(field, 'Open-Sesame{Enter}');
    await expect(args.onSubmit).toHaveBeenLastCalledWith('Open-Sesame');
    await expect(field).toBeDisabled();
    const error = await canvas.findByText('Keys are case-sensitive. Check yours and try again.');
    await expect(error).toHaveAttribute('aria-live', 'polite');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(field).toHaveFocus());

    // Right, revealed first: the button submits, and the app opens.
    await userEvent.clear(field);
    await userEvent.type(field, KEY);
    await userEvent.click(canvas.getByRole('button', { name: 'Show' }));
    await expect(field).toHaveAttribute('type', 'text');
    await expect(canvas.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Enter' }));
    await expect(args.onSubmit).toHaveBeenLastCalledWith(KEY);
    await expect(await canvas.findByText('Inside')).toBeInTheDocument();
  },
};

/**
 * The app's check fails without a message of its own: the gate says `That key did not work.`,
 * and the next edit clears it.
 */
export const ErrorFallback: Story = {
  args: {
    onSubmit: fn(() => Promise.reject(new Error(''))),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByLabelText('Key');
    await userEvent.type(field, 'guess');
    await userEvent.click(canvas.getByRole('button', { name: 'Enter' }));
    await expect(args.onSubmit).toHaveBeenCalledWith('guess');
    const error = await canvas.findByText('That key did not work.');
    await expect(error).toHaveAttribute('aria-live', 'polite');
    await waitFor(() => expect(field).toHaveFocus());
    await userEvent.type(field, '!');
    await expect(error).toHaveTextContent('');
    await expect(field).not.toHaveAttribute('aria-invalid');
  },
};

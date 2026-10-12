import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { StatusLine } from './StatusLine';

const meta = {
  title: 'Yahaha/Primitives/StatusLine',
  component: StatusLine,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  args: { onClear: fn(), tip: 'display.status' },
  argTypes: {
    text: { control: 'text' },
    error: { control: 'boolean' },
    seq: { control: 'number' },
    width: { control: 'number' },
    tip: { control: 'text' },
    hint: { control: 'object' },
  },
} satisfies Meta<typeof StatusLine>;

export default meta;
type Story = StoryObj<typeof meta>;

const ERROR = "Can't delete Sunday drive: it's the loaded rack.";

/** The Stage at the board fixture: no message, so an empty row that keeps its height. */
export const Board: Story = {
  args: { text: null, width: 1392 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole('status');
    await expect(status.textContent).toBe('');
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

/** A refusal: the error chip (mark and word), then the message in the primary text role. */
export const Error: Story = {
  args: { text: ERROR, error: true, seq: 4, width: 1392 },
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole('status');
    const button = within(status).getByRole('button', { name: `Error: ${ERROR}` });
    await expect(button).toHaveAttribute('data-tip', 'display.status');
    await expect(status.querySelector('svg[data-hue="warn"]')).toBeInTheDocument();
  },
};

/** A notice: the text alone, from the left edge. */
export const Notice: Story = {
  args: { text: 'Added SlowWalker.T552 to the library and loaded it.', seq: 5, width: 1392 },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Added SlowWalker.T552 to the library and loaded it.' });
    await expect(button).toHaveAttribute('data-tip', 'display.status');
    await expect(canvasElement.querySelector('[data-hue="warn"]')).toBeNull();
  },
};

/** A click, Enter or Space on the line asks the parent to clear it (`onClear`). */
export const Clears: Story = {
  args: { text: 'One Touch 3 applied · Recovered: Sunday drive', seq: 6, width: 1392 },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'One Touch 3 applied · Recovered: Sunday drive' });
    await expect(button).toHaveAttribute('data-tip', 'display.status');
    await userEvent.click(button);
    await expect(args.onClear).toHaveBeenCalledTimes(1);
    await expect(args.onClear).toHaveBeenLastCalledWith();
    button.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onClear).toHaveBeenCalledTimes(2);
    await userEvent.keyboard(' ');
    await expect(args.onClear).toHaveBeenCalledTimes(3);
  },
};

const HINT = {
  title: 'Sync Start',
  body: 'Arms the band to start on the first chord you play with your left hand.',
  keys: 'Y',
  launchkey: 'Shift + Play',
};

/** A hovered control's tooltip in the line's place: the title, what it does, its key and Launchkey place. */
export const Hint: Story = {
  args: { hint: HINT, text: null, width: 1392 },
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole('status');
    const hint = status.querySelector('.yh-status-line-hint')!;
    await expect(hint).toHaveAttribute('aria-hidden', 'true');
    await expect(hint.textContent).toContain('Sync Start');
    await expect(hint.textContent).toContain('Key Y');
    await expect(hint.textContent).toContain('Launchkey: Shift + Play');
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
  },
};

/** A hint over an error: the hint shows; the error stays in the live region, not drawn. */
export const HintOverMessage: Story = {
  args: {
    hint: { title: 'Accomp', body: 'Turns the accompaniment on or off.' },
    text: ERROR,
    error: true,
    seq: 4,
    width: 1392,
  },
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole('status');
    await expect(status.querySelector('.yh-status-line-hint')!.textContent).toContain('Accomp');
    const button = within(status).getByRole('button', { name: `Error: ${ERROR}` });
    await expect(button).toHaveClass('yh-status-line-under');
    await expect(button).toHaveAttribute('data-tip', 'display.status');
  },
};

const LONG_TEXT =
  'Rhodes Soft + Strings could not load: the plugin Sampler Deluxe is missing, so Right 1 plays its SoundFont voice until the plugin is installed and scanned again.';

/** A message too long for 600px: one line ending in "…", the row keeps its height; the whole text stays in the name. */
export const LongText: Story = {
  args: { text: LONG_TEXT, error: true, seq: 7, width: 600 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: `Error: ${LONG_TEXT}` });
    await expect(button).toHaveAttribute('data-tip', 'display.status');
    await expect(canvas.getByRole('status').style.width).toBe('600px');
  },
};

/** Keyboard focus: the ring in the accent role round the chip and text, and the clear mark shown. */
export const Focused: Story = {
  args: { text: ERROR, error: true, seq: 4, width: 1392 },
  parameters: { pseudo: { focusVisible: true } },
};

/** A narrow hint: the key and Launchkey place give way before the title. */
export const HintNarrow: Story = {
  args: { hint: HINT, text: null, width: 420 },
};

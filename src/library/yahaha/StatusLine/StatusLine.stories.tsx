import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { StatusLine } from './StatusLine';
import { ERROR, LONG_TEXT, statusLineArgTypes, statusLineStories as s } from './StatusLine.fixtures';

const meta = {
  title: 'Yahaha/Primitives/StatusLine',
  component: StatusLine,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  args: { onClear: fn(), tip: 'display.status' },
  argTypes: statusLineArgTypes,
} satisfies Meta<typeof StatusLine>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Stage at the board fixture: no message, so an empty row that keeps its height. */
export const Board: Story = {
  args: s.Board.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole('status');
    await expect(status.textContent).toBe('');
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

/** A refusal: the error chip (mark and word), then the message in the primary text role. */
export const Error: Story = {
  args: s.Error.args,
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole('status');
    const button = within(status).getByRole('button', { name: `Error: ${ERROR}` });
    await expect(button).toHaveAttribute('data-tip', 'display.status');
    await expect(status.querySelector('svg[data-hue="warn"]')).toBeInTheDocument();
  },
};

/** A notice: the text alone, from the left edge. */
export const Notice: Story = {
  args: s.Notice.args,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Added SlowWalker.T552 to the library and loaded it.' });
    await expect(button).toHaveAttribute('data-tip', 'display.status');
    await expect(canvasElement.querySelector('[data-hue="warn"]')).toBeNull();
  },
};

/** A click, Enter or Space on the line asks the parent to clear it (`onClear`). */
export const Clears: Story = {
  args: s.Clears.args,
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

/** A hovered control's tooltip in the line's place: the title, what it does, its key and Launchkey place. */
export const Hint: Story = {
  args: s.Hint.args,
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
  args: s.HintOverMessage.args,
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole('status');
    await expect(status.querySelector('.yh-status-line-hint')!.textContent).toContain('Accomp');
    const button = within(status).getByRole('button', { name: `Error: ${ERROR}` });
    await expect(button).toHaveClass('yh-status-line-under');
    await expect(button).toHaveAttribute('data-tip', 'display.status');
  },
};

/** A message too long for 600px: one line ending in "…", the row keeps its height; the whole text stays in the name. */
export const LongText: Story = {
  args: s.LongText.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: `Error: ${LONG_TEXT}` });
    await expect(button).toHaveAttribute('data-tip', 'display.status');
    await expect(canvas.getByRole('status').style.width).toBe('600px');
  },
};

/** Keyboard focus: the ring in the accent role round the chip and text, and the clear mark shown. */
export const Focused: Story = {
  args: s.Focused.args,
  parameters: { pseudo: { focusVisible: true } },
};

/** A narrow hint: the key and Launchkey place give way before the title. */
export const HintNarrow: Story = {
  args: s.HintNarrow.args,
};

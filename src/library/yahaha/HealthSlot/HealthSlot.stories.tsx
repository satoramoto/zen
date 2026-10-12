import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { HealthSlot } from './HealthSlot';

const meta = {
  title: 'Yahaha/Primitives/HealthSlot',
  component: HealthSlot,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  args: { onOpen: fn(), tip: 'app.health' },
  argTypes: {
    failedPart: { control: 'select', options: [null, 0, 1, 2, 3] },
    synthOn: { control: 'boolean' },
    dropouts: { control: { type: 'number', min: 0, step: 1 } },
    bufferFrames: { control: 'select', options: [null, 64, 128, 256, 512, 1024] },
    cpu: { control: { type: 'range', min: 0, max: 1.2, step: 0.01 } },
    width: { control: { type: 'number', min: 0, step: 1 } },
    tip: { control: 'text' },
  },
} satisfies Meta<typeof HealthSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

const hueOf = (root: HTMLElement) => root.querySelector('[data-hue]');

/** The Stage board: calm, a quiet "Audio" at the right edge of the app bar's 100px slot. */
export const Board: Story = {
  args: { failedPart: null, synthOn: true, dropouts: 0, bufferFrames: 256, cpu: 0.2, width: 100 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('Audio health: fine');
    await expect(hueOf(canvasElement)).toHaveAttribute('data-hue', 'm');
    const text = canvas.getByText('Audio', { exact: true });
    await expect(text).toHaveAttribute('aria-hidden', 'true');
    await expect(text).toHaveAttribute('data-tip', 'app.health');
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

/** A busy CPU: "CPU 74%" with a warning triangle; a click opens Settings › System. */
export const Cpu: Story = {
  args: { synthOn: true, dropouts: 0, bufferFrames: 256, cpu: 0.74, width: 100 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('Audio health: CPU 74%');
    await expect(hueOf(canvasElement)).toHaveAttribute('data-hue', 'ending');
    const button = canvas.getByRole('button', { name: 'CPU 74%' });
    await expect(button).toHaveAttribute('data-tip', 'app.health');
    await userEvent.click(button);
    await expect(args.onOpen).toHaveBeenCalledWith({ page: 'settings', tab: 'system' });
  },
};

/** Right 3's plugin failed: "R3 failed" as trouble; a click opens that part's Channel page. */
export const Failed: Story = {
  args: { failedPart: 2, synthOn: true, bufferFrames: 256, cpu: 0.2, width: 100 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('Audio health: R3 failed');
    await expect(hueOf(canvasElement)).toHaveAttribute('data-hue', 'ending');
    const button = canvas.getByRole('button', { name: 'R3 failed' });
    await expect(button).toHaveAttribute('data-tip', 'app.health');
    await userEvent.click(button);
    await expect(args.onOpen).toHaveBeenCalledWith({ page: 'channel', part: 2 });
  },
};

/** A failed plugin outranks no audio: "L failed". */
export const FailedBeatsOff: Story = {
  args: { failedPart: 3, synthOn: false, width: 100 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'L failed' })).toBeInTheDocument();
  },
};

/** No audio: "Audio off" stays neutral (a hollow ring, not an alarm) yet opens Settings › System. */
export const AudioOff: Story = {
  args: { synthOn: false, width: 100 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('Audio health: Audio off');
    await expect(hueOf(canvasElement)).toHaveAttribute('data-hue', 'm');
    const button = canvas.getByRole('button', { name: 'Audio off' });
    button.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onOpen).toHaveBeenCalledTimes(1);
    await expect(args.onOpen).toHaveBeenCalledWith({ page: 'settings', tab: 'system' });
  },
};

/** Two dropouts in the last 30 s: "2 dropouts"; Space on the button opens Settings › System. */
export const Dropouts: Story = {
  args: { dropouts: 2, bufferFrames: 256, cpu: 0.2, width: 100 },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: '2 dropouts' });
    await expect(button).toHaveAttribute('data-tip', 'app.health');
    button.focus();
    await userEvent.keyboard(' ');
    await expect(args.onOpen).toHaveBeenCalledTimes(1);
    await expect(args.onOpen).toHaveBeenCalledWith({ page: 'settings', tab: 'system' });
  },
};

/** One dropout: the singular "1 dropout". */
export const OneDropout: Story = {
  args: { dropouts: 1, bufferFrames: 256, width: 100 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: '1 dropout' })).toBeInTheDocument();
  },
};

/**
 * Three dropouts at a 128-frame buffer: the whole "3 dropouts · buffer 256?", suggesting the next
 * size up. It outranks the busy CPU. No width, so nothing is cut.
 */
export const BufferHint: Story = {
  args: { dropouts: 3, bufferFrames: 128, cpu: 0.74 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('Audio health: 3 dropouts · buffer 256?');
    const button = canvas.getByRole('button', { name: '3 dropouts · buffer 256?' });
    await expect(button).toHaveAttribute('data-tip', 'app.health');
  },
};

/** The same hint in the app bar's 100px: cut with "…", while the live region and name stay whole. */
export const BufferHintInBar: Story = {
  args: { dropouts: 3, bufferFrames: 128, width: 100 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('Audio health: 3 dropouts · buffer 256?');
    await expect(canvas.getByRole('button', { name: '3 dropouts · buffer 256?' })).toBeInTheDocument();
  },
};

/** At 1024 frames there's no larger buffer to suggest: just "3 dropouts". */
export const LargestBuffer: Story = {
  args: { dropouts: 3, bufferFrames: 1024, width: 100 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: '3 dropouts' })).toBeInTheDocument();
  },
};

/** Every state side by side in a bar-like strip, to compare shapes and weights under each pack. */
export const AllStates: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--space-2)', width: 220 }}>
      <HealthSlot {...args} />
      <HealthSlot {...args} synthOn={false} />
      <HealthSlot {...args} cpu={0.74} />
      <HealthSlot {...args} dropouts={2} />
      <HealthSlot {...args} failedPart={2} />
    </div>
  ),
};

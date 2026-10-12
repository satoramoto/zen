import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { StatusDot, type StatusDotHue } from './StatusDot';

const HUES: StatusDotHue[] = ['ok', 'd', 't', 'intro', 'main', 'ending', 'brk', 'fill'];

const meta = {
  title: 'Design OS/Components/Core/StatusDot',
  component: StatusDot,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  argTypes: {
    hue: { control: 'select', options: HUES },
    hollow: { control: 'boolean' },
    glow: { control: 'boolean' },
    size: { control: 'select', options: ['md', 'sm'] },
    visible: { control: 'boolean' },
    name: { control: 'text' },
  },
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Launchkey status on the Stage board, connected: solid in the success role, with the palette's bloom. */
export const Board: Story = {
  args: { hue: 'ok' },
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector('[data-hue]');
    await expect(dot).toHaveAttribute('aria-hidden', 'true');
    await expect(dot).toHaveAttribute('data-hue', 'ok');
    await expect(dot).toHaveAttribute('data-face', 'solid');
    await expect(dot).toHaveAttribute('data-glow', 'true');
    await expect(dot).toHaveAttribute('data-size', 'md');
    await expect(within(canvasElement).queryByRole('img')).toBeNull();
  },
};

/** The dot before "Section" while Main B plays: the playing role (`--selected`) with its bloom; sections take no hue. */
export const Section: Story = {
  args: { hue: 'main' },
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector<HTMLElement>('[data-hue]');
    await expect(dot).toHaveAttribute('data-hue', 'main');
    await expect(dot).toHaveAttribute('data-face', 'solid');
    await expect(dot).toHaveAttribute('data-glow', 'true');
    await expect(dot?.style.getPropertyValue('--yh-status-dot-hue')).toBe('var(--selected)');
  },
};

/** The section dot during an intro: the same playing role as Main, since a section is named by its word, not a colour. */
export const Intro: Story = {
  args: { hue: 'intro' },
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector<HTMLElement>('[data-hue]');
    await expect(dot).toHaveAttribute('data-hue', 'intro');
    await expect(dot).toHaveAttribute('data-glow', 'true');
    await expect(dot?.style.getPropertyValue('--yh-status-dot-hue')).toBe('var(--selected)');
  },
};

/** The section dot while stopped: nothing visible, but its box stays so the text after it doesn't move. */
export const Stopped: Story = {
  args: { hue: 'main', visible: false },
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector<HTMLElement>('[data-hue="main"]');
    await expect(dot).toBeInTheDocument();
    await expect(dot?.style.visibility).toBe('hidden');
  },
};

/** The Launchkey not connected: a `--text-3` ring, empty inside, no bloom (absent is always the ring). */
export const Disconnected: Story = {
  args: { hue: 'd', hollow: true },
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector('[data-hue]');
    await expect(dot).toHaveAttribute('data-face', 'hollow');
    await expect(dot).toHaveAttribute('data-hue', 'd');
    await expect(dot).toHaveAttribute('data-glow', 'false');
  },
};

/** Sync start armed: a ring in the success role, empty inside, no bloom. */
export const SyncStart: Story = {
  args: { hue: 'ok', hollow: true },
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector('[data-hue]');
    await expect(dot).toHaveAttribute('data-face', 'hollow');
    await expect(dot).toHaveAttribute('data-hue', 'ok');
    await expect(dot).toHaveAttribute('data-glow', 'false');
  },
};

/** The rack readout's modified dot: smaller, in the primary text role, no bloom. */
export const Small: Story = {
  args: { size: 'sm', hue: 't', glow: false },
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector('[data-hue]');
    await expect(dot).toHaveAttribute('data-size', 'sm');
    await expect(dot).toHaveAttribute('data-hue', 't');
    await expect(dot).toHaveAttribute('data-glow', 'false');
  },
};

/** The Channel's compact running dot, read out on its own. */
export const Named: Story = {
  args: { hue: 'ok', name: 'Running' },
  play: async ({ canvasElement }) => {
    const dot = within(canvasElement).getByRole('img', { name: 'Running' });
    await expect(dot).toHaveAttribute('data-hue', 'ok');
    await expect(dot).not.toHaveAttribute('aria-hidden');
  },
};

/** A named hollow ring. */
export const NamedHollow: Story = {
  args: { hue: 'ok', hollow: true, name: 'Sync start armed' },
  play: async ({ canvasElement }) => {
    const dot = within(canvasElement).getByRole('img', { name: 'Sync start armed' });
    await expect(dot).toHaveAttribute('data-face', 'hollow');
  },
};

/** A named dot while hidden: silent to screen readers too. */
export const NamedHidden: Story = {
  args: { hue: 'ok', name: 'Running', visible: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('img')).toBeNull();
    const dot = canvasElement.querySelector<HTMLElement>('[data-hue="ok"]');
    await expect(dot).toHaveAttribute('aria-hidden', 'true');
    await expect(dot).not.toHaveAttribute('aria-label');
    await expect(dot?.style.visibility).toBe('hidden');
  },
};

/**
 * Every hue, solid and hollow, beside the word it marks: the dot scales with the label's size.
 * The five section values all read the one playing role.
 */
export const Faces: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, auto)',
        gap: 'var(--space-2) var(--space-5)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--size-label)',
        color: 'var(--text-2)',
      }}
    >
      {HUES.map((hue) => (
        <div key={hue} style={{ display: 'contents' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <StatusDot hue={hue} />
            {hue}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <StatusDot hue={hue} hollow />
            {hue} armed
          </span>
        </div>
      ))}
    </div>
  ),
};

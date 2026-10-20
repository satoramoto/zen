import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, treeStory, withRenderer } from '../../../stories/story';
import { StatusDot } from './StatusDot';
import StatusDotSvelte from './StatusDot.svelte';
import { statusDotArgTypes, statusDotFaces, statusDotStories as s } from './StatusDot.fixtures';

// Every story is built from StatusDot.fixtures.ts (`story(s.Name)`), which the tree snapshot
// shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`. Faces is a view tree
// (`statusDotFaces`), drawn by either `Tree` too.
const meta = {
  title: 'Design OS/Components/Core/StatusDot',
  component: StatusDot,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'centered' },
  argTypes: statusDotArgTypes,
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(StatusDot, StatusDotSvelte);

/** The Launchkey status on the Stage board, connected: solid in the success role, with the palette's bloom. */
export const Board: Story = {
  ...story(s.Board),
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
  ...story(s.Section),
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
  ...story(s.Intro),
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector<HTMLElement>('[data-hue]');
    await expect(dot).toHaveAttribute('data-hue', 'intro');
    await expect(dot).toHaveAttribute('data-glow', 'true');
    await expect(dot?.style.getPropertyValue('--yh-status-dot-hue')).toBe('var(--selected)');
  },
};

/** The section dot while stopped: nothing visible, but its box stays so the text after it doesn't move. */
export const Stopped: Story = {
  ...story(s.Stopped),
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector<HTMLElement>('[data-hue="main"]');
    await expect(dot).toBeInTheDocument();
    await expect(dot?.style.visibility).toBe('hidden');
  },
};

/** The Launchkey not connected: a `--text-3` ring, empty inside, no bloom (absent is always the ring). */
export const Disconnected: Story = {
  ...story(s.Disconnected),
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector('[data-hue]');
    await expect(dot).toHaveAttribute('data-face', 'hollow');
    await expect(dot).toHaveAttribute('data-hue', 'd');
    await expect(dot).toHaveAttribute('data-glow', 'false');
  },
};

/** Sync start armed: a ring in the success role, empty inside, no bloom. */
export const SyncStart: Story = {
  ...story(s.SyncStart),
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector('[data-hue]');
    await expect(dot).toHaveAttribute('data-face', 'hollow');
    await expect(dot).toHaveAttribute('data-hue', 'ok');
    await expect(dot).toHaveAttribute('data-glow', 'false');
  },
};

/** The rack readout's modified dot: smaller, in the primary text role, no bloom. */
export const Small: Story = {
  ...story(s.Small),
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector('[data-hue]');
    await expect(dot).toHaveAttribute('data-size', 'sm');
    await expect(dot).toHaveAttribute('data-hue', 't');
    await expect(dot).toHaveAttribute('data-glow', 'false');
  },
};

/** The Channel's compact running dot, read out on its own. */
export const Named: Story = {
  ...story(s.Named),
  play: async ({ canvasElement }) => {
    const dot = within(canvasElement).getByRole('img', { name: 'Running' });
    await expect(dot).toHaveAttribute('data-hue', 'ok');
    await expect(dot).not.toHaveAttribute('aria-hidden');
  },
};

/** A named hollow ring. */
export const NamedHollow: Story = {
  ...story(s.NamedHollow),
  play: async ({ canvasElement }) => {
    const dot = within(canvasElement).getByRole('img', { name: 'Sync start armed' });
    await expect(dot).toHaveAttribute('data-face', 'hollow');
  },
};

/** A named dot while hidden: silent to screen readers too. */
export const NamedHidden: Story = {
  ...story(s.NamedHidden),
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
export const Faces: Story = treeStory(() => ({ tree: statusDotFaces() })) as Story;

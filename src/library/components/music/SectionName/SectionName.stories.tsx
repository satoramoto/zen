import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { SectionName } from './SectionName';
import SectionNameSvelte from './SectionName.svelte';
import { sectionNameArgTypes, sectionNameStories as s } from './SectionName.fixtures';

/**
 * The playing section's name on the display. Sections take no hue, and the name takes no state
 * colour either: it is neutral and inherits its ink, and whatever holds it (the Display's
 * `--selected` block, its "then" tab) says where it stands. `state` lands on `data-state`.
 */
const meta = {
  title: 'Design OS/Components/Music/SectionName',
  component: SectionName,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  argTypes: sectionNameArgTypes,
} satisfies Meta<typeof SectionName>;

export default meta;
type Story = StoryObj<typeof meta>;

// Every story is built from SectionName.fixtures.ts (`story(s.Name)`), which the tree snapshot
// shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`.
const story = fixtureStories<Story>(SectionName, SectionNameSvelte);

const stateOf = (canvasElement: HTMLElement) => canvasElement.querySelector<HTMLElement>('.yh-section-name')!.dataset.state;

/** The board: "Main B", playing, in the ink it inherits. */
export const Board: Story = { ...story(s.Board), play: async ({ canvasElement }) => expect(stateOf(canvasElement)).toBe('playing') };

/** Stopped: the picked Main, marked idle for its holder. */
export const Idle: Story = { ...story(s.Idle), play: async ({ canvasElement }) => expect(stateOf(canvasElement)).toBe('idle') };

/** An intro playing: the same face as a Main, since the word names the section. */
export const Intro: Story = { ...story(s.Intro), play: async ({ canvasElement }) => expect(stateOf(canvasElement)).toBe('playing') };

/** Every section kind side by side, playing: one face, told apart by name; then a next, an idle and an absent one (a wide row of its own, so React draws it). */
export const AllKinds: Story = story(s.AllKinds, {
  render: () => (
    <div className="lib-row" style={{ gap: 'var(--space-6)' }}>
      {s.AllKinds.items!.map((item, i) => (
        <SectionName key={i} {...item} label={item.label ?? ''} />
      ))}
    </div>
  ),
});

/** No section: the dash keeps the line's height. */
export const Empty: Story = story(s.Empty);

/** New: the section queued next, marked `data-state="next"` for its holder (the Display's "then" tab). */
export const Next: Story = { ...story(s.Next), play: async ({ canvasElement }) => expect(stateOf(canvasElement)).toBe('next') };

/** New: the name as the display's hero, by `size` (set as `--yh-section-name-size`). */
export const HeroSize: Story = {
  ...story(s.HeroSize),
  play: async ({ canvasElement }) => {
    const name = canvasElement.querySelector<HTMLElement>('.yh-section-name')!;
    await expect(name.style.getPropertyValue('--yh-section-name-size')).toBe('var(--size-display)');
  },
};

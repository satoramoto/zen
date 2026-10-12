import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { SectionName } from './SectionName';

/**
 * The playing section's name on the display. Sections take no hue, and the name takes no state
 * colour either: it is neutral and inherits its ink, and whatever holds it (the Display's
 * `--selected` block, its "then" tab) says where it stands. `state` lands on `data-state`.
 */
const meta = {
  title: 'Design OS/Components/Music/SectionName',
  component: SectionName,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    label: { control: 'text' },
    hue: { control: 'select', options: ['intro', 'main', 'ending', 'brk', 'fill'] },
    state: { control: 'inline-radio', options: ['playing', 'next', 'idle', 'absent'] },
    idle: { control: 'boolean' },
    size: { control: 'text' },
  },
} satisfies Meta<typeof SectionName>;

export default meta;
type Story = StoryObj<typeof meta>;

const stateOf = (canvasElement: HTMLElement) => canvasElement.querySelector<HTMLElement>('.yh-section-name')!.dataset.state;

/** The board: "Main B", playing, in the ink it inherits. */
export const Board: Story = {
  args: { label: 'Main B', hue: 'main' },
  play: async ({ canvasElement }) => {
    await expect(stateOf(canvasElement)).toBe('playing');
  },
};

/** Stopped: the picked Main, marked idle for its holder. */
export const Idle: Story = {
  args: { label: 'Main A', hue: 'main', idle: true },
  play: async ({ canvasElement }) => {
    await expect(stateOf(canvasElement)).toBe('idle');
  },
};

/** An intro playing: the same face as a Main, since the word names the section. */
export const Intro: Story = {
  args: { label: 'Intro II', hue: 'intro' },
  play: async ({ canvasElement }) => {
    await expect(stateOf(canvasElement)).toBe('playing');
  },
};

/** Every section kind side by side, playing: one face, told apart by name; then a next, an idle and an absent one. */
export const AllKinds: Story = {
  args: { label: 'Main A' },
  render: () => (
    <div className="lib-row" style={{ gap: 'var(--space-6)' }}>
      <SectionName label="Intro I" hue="intro" />
      <SectionName label="Main A" hue="main" />
      <SectionName label="Break" hue="brk" />
      <SectionName label="Fill" hue="fill" />
      <SectionName label="Ending II" hue="ending" />
      <SectionName label="Main C" hue="main" state="next" />
      <SectionName label="Main B" hue="main" idle />
      <SectionName label="Ending III" hue="ending" state="absent" />
    </div>
  ),
};

/** No section: the dash keeps the line's height. */
export const Empty: Story = {
  args: { label: '', hue: 'main' },
};

/** New: the section queued next, marked `data-state="next"` for its holder (the Display's "then" tab). */
export const Next: Story = {
  args: { label: 'Main C', hue: 'main', state: 'next' },
  play: async ({ canvasElement }) => {
    await expect(stateOf(canvasElement)).toBe('next');
  },
};

/** New: the name as the display's hero, by `size` (set as `--yh-section-name-size`). */
export const HeroSize: Story = {
  args: { label: 'Main B', hue: 'main', size: 'var(--size-display)' },
  play: async ({ canvasElement }) => {
    const name = canvasElement.querySelector<HTMLElement>('.yh-section-name')!;
    await expect(name.style.getPropertyValue('--yh-section-name-size')).toBe('var(--size-display)');
  },
};

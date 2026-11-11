import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../foundation/stories/story';
import { Trace } from './Trace';
import TraceSvelte from './Trace.svelte';
import { traceStories as s } from './Trace.fixtures';

const meta = {
  title: 'Push/Components/Trace',
  component: Trace,
  decorators: [
    withRenderer,
    (Story) => (
      <div style={{ width: 'calc(var(--control-h) * 10)', height: 'calc(var(--control-h) * 4)' }}>
        <Story />
      </div>
    ),
    withLibraryTheme,
  ],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Trace>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Trace, TraceSvelte);

/** A line through five points. */
export const Envelope: Story = {
  ...story(s.Envelope),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-part="root"]')!;
    await expect(root).toHaveAttribute('aria-label', 'Envelope');
    await expect(root.querySelector('[data-part="line"]')).toHaveAttribute('d', 'M 0 40 L 5 0 L 35 12 L 70 12 L 100 40');
    await expect(root.querySelector('[data-part="fill"]')).toBeNull();
  },
};
/** Filled, in a hue slot. */
export const Filled: Story = {
  ...story(s.Filled),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-part="root"]')!;
    await expect(root).toHaveAttribute('data-hue', '2');
    await expect(root.querySelector('[data-part="fill"]')).not.toBeNull();
  },
};
/** A lit region and three markers. */
export const Marked: Story = {
  ...story(s.Marked),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[data-part="marker"]')).toHaveLength(3);
    await expect(canvasElement.querySelector('[data-part="marker"][data-strong]')).toHaveAttribute('data-name', 'playhead');
    await expect(canvasElement.querySelector('[data-part="region"]')).toHaveAttribute('width', '50');
  },
};
export const Disabled: Story = story(s.Disabled);
/** No points: the box is kept and nothing is drawn in it. */
export const Empty: Story = {
  ...story(s.Empty),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-part="line"]')).toBeNull();
  },
};

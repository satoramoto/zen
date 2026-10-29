import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { MacroPads } from './MacroPads';
import MacroPadsSvelte from './MacroPads.svelte';
import { macroPadsArgTypes, macroPadsBase, macroPadsStories as s } from './MacroPads.fixtures';

// Every story is built from MacroPads.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React's or Svelte's `Tree`. A frame gives the bank a width
// (each field's marks are out of flow); Dense widens it to 900 px.

/** The bank's width: 560 px for the pair, or the `frameWidth` parameter. */
const frame: Decorator = (Story, { parameters }) => (
  <div style={{ width: parameters.frameWidth ?? 560 }}>
    <Story />
  </div>
);

/**
 * A short bank of the two effect axes a performer rides most: two XY pads in a row, each captioned
 * above it. A drag in a pad asks for that pad's point through `onMove(id, x, y)`.
 */
const meta = {
  title: 'Design OS/Components/Music/MacroPads',
  component: MacroPads,
  decorators: [withRenderer, frame, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { ...macroPadsBase, onMove: fn() },
  argTypes: macroPadsArgTypes,
} satisfies Meta<typeof MacroPads>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(MacroPads, MacroPadsSvelte);

/**
 * The pair the mockups show: FX A Delay Throw beside Filter / Resonance. Dragging the first pad
 * asks for `fx-a` and the new point, not the one it started from.
 */
export const Default: Story = {
  ...story(s.Default),
  play: async ({ canvasElement, args }) => {
    const pad = canvasElement.querySelector('.yh-xypad') as HTMLElement;
    const box = pad.getBoundingClientRect();
    const at = (x: number, y: number) => ({
      pointerId: 1,
      button: 0,
      clientX: box.left + box.width * x,
      clientY: box.top + box.height * y,
    });
    await fireEvent.pointerDown(pad, at(0.4, 0.6));
    await fireEvent.pointerMove(pad, at(0.3, 0.7));
    await fireEvent.pointerUp(pad, at(0.3, 0.7));
    const calls = (args.onMove as unknown as { mock: { calls: [string, number, number][] } }).mock.calls;
    const [id, x, y] = calls[calls.length - 1];
    await expect(id).toBe('fx-a');
    await expect(x).toBeCloseTo(0.3, 1);
    await expect(y).toBeCloseTo(0.3, 1);
    await expect(x).not.toBe(0.76);
  },
};

/** Every state: four pads, one per hue slot, each with its own reach and trail. */
export const EveryState: Story = story(s.EveryState);

/** The `two-up` bank with four macros in a 900 px frame: two rows of two square fields. */
export const Dense: Story = { ...story(s.Dense), parameters: { frameWidth: 900 } };

/** Nothing given: one empty well where a bank will sit. */
export const Empty: Story = story(s.Empty);

/** Disabled: both fields dimmed and deaf to drags. */
export const Disabled: Story = story(s.Disabled);

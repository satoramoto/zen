import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { XYPad } from './XYPad';
import XYPadSvelte from './XYPad.svelte';
import { xyPadArgTypes, xyPadBase, xyPadStories as s } from './XYPad.fixtures';

// Every story is built from XYPad.fixtures.ts (`story(s.Name)`), which the tree snapshot shares; the
// toolbar's Renderer draws it with React's or Svelte's `Tree`. A frame gives the field a width (its
// marks are all out of flow), and Dense widens that frame to 900 px.

/** A story's width: 300 px, or the `frameWidth` parameter for a wide one. */
const frame: Decorator = (Story, { parameters }) => (
  <div style={{ width: parameters.frameWidth ?? 300 }}>
    <Story />
  </div>
);

/**
 * One effect's two axes: a field with a quarter grid, a fading trail of where the finger has been,
 * a crosshair at (x, y) and each axis's word at its edge. Drag anywhere in the field (or focus it
 * and use the arrows) and it asks for the point through `onMove`.
 */
const meta = {
  title: 'Design OS/Components/Music/XYPad',
  component: XYPad,
  decorators: [withRenderer, frame, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { ...xyPadBase, onMove: fn() },
  argTypes: xyPadArgTypes,
} satisfies Meta<typeof XYPad>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(XYPad, XYPadSvelte);

/**
 * The filter pad: Cutoff across, Resonance up, hue slot 2, the finger's path behind the crosshair.
 * Dragging to 30% across and 30% up asks for exactly that, not the point it started at.
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
    await fireEvent.pointerDown(pad, at(0.25, 0.75));
    await fireEvent.pointerMove(pad, at(0.3, 0.7));
    await fireEvent.pointerUp(pad, at(0.3, 0.7));
    const calls = (args.onMove as unknown as { mock: { calls: [number, number][] } }).mock.calls;
    const [x, y] = calls[calls.length - 1];
    // 30% across, 30% up (the pointer was 70% down): the y axis is inverted.
    await expect(x).toBeCloseTo(0.3, 1);
    await expect(y).toBeCloseTo(0.3, 1);
    await expect(x).not.toBe(0.62);
  },
};

/** Every state: each hue slot, both bottom corners, the middle, a labelled pair and a bare field. */
export const EveryState: Story = story(s.EveryState);

/** The `wide` form in a 900 px frame: the same field, twice as wide as it is tall. */
export const Dense: Story = { ...story(s.Dense), parameters: { frameWidth: 900 } };

/** Nothing given: a bare field, no labels, no trail, the point in the middle. */
export const Empty: Story = story(s.Empty);

/** Disabled: shown, dimmed, and deaf to drags and keys. */
export const Disabled: Story = story(s.Disabled);

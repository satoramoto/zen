import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, treeStory, withRenderer } from '../../../stories/story';
import { Meter, type MeterProps } from './Meter';
import MeterSvelte from './Meter.svelte';
import { meterArgTypes, meterBase, meterRowSample, meterStories as s } from './Meter.fixtures';

/**
 * `live.meter~`: a level, read-only (`role="meter"`). The channel is a `well`, the level lit in the
 * ink, the peak a line. Never focusable, never draggable.
 */
const meta = {
  title: 'Design OS/Components/Music/Meter',
  component: Meter,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: meterBase,
  argTypes: meterArgTypes,
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Meter, MeterSvelte);

// Every story is built from Meter.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React's or Svelte's `Tree`.

/** Caption over the bar, no reading: the widget's default face. */
export const Default: Story = story(s.Default);

/** With a peak hold drawn as a line. */
export const Peak: Story = story(s.Peak);

/** Vertical, with its reading. */
export const Vertical: Story = story(s.Vertical);

/** Inline: caption over reading, beside the bar. */
export const Inline: Story = story(s.Inline);

/** A row: caption and reading inside the bar. */
export const Inside: Story = { args: s.Inside.args, ...treeStory((args: MeterProps) => ({ tree: meterRowSample(args) })) };

/** An authoritative reading. */
export const Display: Story = { ...Inside, args: s.Display.args };

/** Clamped: an overshoot (1.4, peak 2) fills the bar and stops at 100. */
export const Clamped: Story = story(s.Clamped);

/** A custom ink. */
export const Ink: Story = story(s.Ink);

/** Driven: an envelope pulsing, the peak decaying behind it. Animated by a React render, so React draws it. */
export const Driven: Story = {
  render: function Driven(args) {
    const [t, setT] = useState(0);
    const [peak, setPeak] = useState(0);
    useEffect(() => {
      let frame = 0;
      const tick = (now: number) => {
        setT(now / 1000);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    }, []);
    const value = Math.exp(-((t * 2) % 1) * 4) * (0.6 + 0.4 * Math.sin(t * 0.7) ** 2);
    useEffect(() => setPeak((p) => Math.max(value, p - 0.01)), [value]);
    return (
      <div className="lib-row">
        <Meter {...args} value={value} peak={peak} showValue />
        <Meter {...args} orientation="vertical" length={96} value={value} peak={peak} />
      </div>
    );
  },
};

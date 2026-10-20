import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../../storybook';
import { Meter } from './Meter';
import { meterArgTypes, meterBase, meterStories as s } from './Meter.fixtures';

/**
 * `live.meter~`: a level, read-only (`role="meter"`). The channel is a `well`, the level lit in the
 * ink, the peak a line. Never focusable, never draggable.
 */
const meta = {
  title: 'Design OS/Components/Music/Meter',
  component: Meter,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: meterBase,
  argTypes: meterArgTypes,
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;

// Every story's args come from Meter.fixtures.ts, which the Svelte stories and the parity test share.

/** Caption over the bar, no reading: the widget's default face. */
export const Default: Story = { args: s.Default.args };

/** With a peak hold drawn as a line. */
export const Peak: Story = { args: s.Peak.args };

/** Vertical, with its reading. */
export const Vertical: Story = { args: s.Vertical.args };

/** Inline: caption over reading, beside the bar. */
export const Inline: Story = { args: s.Inline.args };

/** A row: caption and reading inside the bar. */
export const Inside: Story = {
  args: s.Inside.args,
  render: (args) => (
    <div style={{ width: 'calc(var(--control-h) * 7)' }}>
      <Meter {...args} />
    </div>
  ),
};

/** An authoritative reading. */
export const Display: Story = { ...Inside, args: s.Display.args };

/** Clamped: an overshoot (1.4, peak 2) fills the bar and stops at 100. */
export const Clamped: Story = { args: s.Clamped.args };

/** A custom ink. */
export const Ink: Story = { args: s.Ink.args };

/** Driven: an envelope pulsing, the peak decaying behind it. */
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

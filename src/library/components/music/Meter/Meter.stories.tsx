import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../../storybook';
import { Meter } from './Meter';

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
  args: { value: 0.62, name: 'Level' },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    peak: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    layout: { control: 'inline-radio', options: ['stacked', 'inline', 'inside'] },
    side: { control: 'inline-radio', options: ['left', 'right'] },
    showValue: { control: 'boolean' },
    display: { control: 'text' },
    width: { control: 'number' },
    length: { control: 'number' },
    ink: { control: 'text' },
  },
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Caption over the bar, no reading: the widget's default face. */
export const Default: Story = {};

/** With a peak hold drawn as a line. */
export const Peak: Story = { args: { value: 0.48, peak: 0.81 } };

/** Vertical, with its reading. */
export const Vertical: Story = { args: { orientation: 'vertical', value: 0.7, peak: 0.9, showValue: true, length: 96, width: 6 } };

/** Inline: caption over reading, beside the bar. */
export const Inline: Story = { args: { layout: 'inline', showValue: true } };

/** A row: caption and reading inside the bar. */
export const Inside: Story = {
  args: { name: 'Energy', layout: 'inside', showValue: true },
  render: (args) => (
    <div style={{ width: 'calc(var(--control-h) * 7)' }}>
      <Meter {...args} />
    </div>
  ),
};

/** An authoritative reading. */
export const Display: Story = { ...Inside, args: { ...Inside.args, display: 'live' } };

/** Clamped: an overshoot (1.4, peak 2) fills the bar and stops at 100. */
export const Clamped: Story = { args: { value: 1.4, peak: 2, showValue: true } };

/** A custom ink. */
export const Ink: Story = { args: { ink: 'var(--hue-3)', peak: 0.75 } };

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
